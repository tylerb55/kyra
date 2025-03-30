import uuid
from collections import deque
from config import conversation_memories, conversations, llm, supabase_client
import os
import json
import datetime
from utils.helper_functions import extract_json_from_markdown
import logging

def get_or_create_memory(session_id: str = None):
    """Get existing memory or create a new one with optional session_id"""
    if not session_id:
        session_id = str(uuid.uuid4())
    
    if session_id not in conversation_memories:
        conversation_memories[session_id] = deque(maxlen=10)
    
    return session_id, conversation_memories[session_id]

def save_conversation(session_id, conversation_name=None):
    """
    Save conversation to database with insights about topics, symptoms, and knowledge gaps
    
    Args:
        session_id: The unique session identifier
        conversation_name: Optional name for the conversation
        
    Returns:
        Boolean indicating success
    """
    if session_id not in conversation_memories:
        return False
    
    memory = conversation_memories[session_id]
    if not memory:
        return False
    
    # Create transcript
    transcript = "\n".join([f"{msg['role']}: {msg['content']}" for msg in memory])
    
    # Extract insights using LLM
    full_conversation = "\n".join([f"{msg['role']}: {msg['content']}" for msg in memory])
    
    analysis_prompt = f"""
    Analyze the following conversation and extract:
    1. Main topics discussed (list up to 5)
    2. Any symptoms or problems mentioned (list all)
    3. Topics where the assistant lacked knowledge or couldn't provide a complete answer
    
    Format your response as JSON with the following structure:
    {{
        "topics": ["topic1", "topic2", ...],
        "symptoms_problems": ["symptom1", "problem1", ...],
        "knowledge_gaps": ["gap1", "gap2", ...]
    }}
    
    Conversation:
    {full_conversation}
    """
    
    try:
        # Generate analysis using the LLM
        response = llm.chat.completions.create(
            model="tgi",
            messages=[{"role": "user", "content": analysis_prompt}]
        )
        
        # Parse the JSON response
        analysis = json.loads(extract_json_from_markdown(response.choices[0].message.content))
        
        # Insert or update the conversation transcript with insights
        result = supabase_client.table("conversation_transcripts").upsert({
            "session_id": session_id,
            "conversation_name": conversation_name,
            "transcript": transcript,
            "topics": analysis.get("topics", []),
            "symptoms_problems": analysis.get("symptoms_problems", []),
            "knowledge_gaps": analysis.get("knowledge_gaps", []),
            "username": os.getenv("username"),
            "updated_at": datetime.datetime.now().isoformat()
        }).execute()
        
        return True if result.data else False
        
    except Exception as e:
        print(f"Error saving conversation with insights: {str(e)}")
        
        # Fallback: save just the transcript without insights
        result = supabase_client.table("conversation_transcripts").upsert({
            "session_id": session_id,
            "conversation_name": conversation_name,
            "transcript": transcript,
            "username": os.getenv("username"),
            "updated_at": datetime.datetime.now().isoformat()
        }).execute()
        
        return True if result.data else False

def answer_query_with_context(query, context, memory, username, age, gender, diagnosis, prescription):
    """Answer a query using RAG approach with provided context and chat history."""
    # Create system prompt with context
    system_prompt = f"""{os.getenv("system_prompt")}\n
    Answer with all related pieces of knowledge. Always reference between phrases the ones you use. If you skip one, you will be penalized.

    Use the format [citationId] between sentences. Use the exact same "citationId" present in the context.

    Example:
    The capital of Chile is Santiago de Chile [1], and the population is 7 million people [3].
    
    Context:
    {context}
    """
    
    # Create messages list with system prompt and chat history
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history from memory
    for msg in memory:
        messages.append(msg)
    
    # Add user query
    user_message = {"role": "user", "content": query}
    messages.append(user_message)
    memory.append(user_message)
    
    # Generate response using the LLM
    response = llm.chat.completions.create(
        model="tgi",  # Using the model specified in your environment
        messages=messages,
        max_tokens=400
    )
    
    # Extract assistant response
    assistant_message = {"role": "assistant", "content": response.choices[0].message.content}
    
    # Add assistant response to memory
    memory.append(assistant_message)
    
    return assistant_message["content"]