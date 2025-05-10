import uuid
from collections import deque
from config import conversation_memories, conversations, llm
import os

def get_or_create_memory(session_id: str = None):
    """Get existing memory or create a new one with optional session_id"""
    if not session_id:
        session_id = str(uuid.uuid4())
    
    if session_id not in conversation_memories:
        conversation_memories[session_id] = deque(maxlen=10)
    
    return session_id, conversation_memories[session_id]

def save_conversation(session_id, conversation_name=None):
    """Save conversation to database"""
    if session_id not in conversation_memories:
        return False
    
    memory = conversation_memories[session_id]
    if not memory:
        return False
    
    # Convert memory to a format suitable for storage
    conversation_data = {
        "messages": list(memory),
        "name": conversation_name or f"Conversation-{session_id[:8]}"
    }
    
    # Store in the conversations collection
    conversations.upsert(
        records=[
            (session_id, None, {"conversation": conversation_data})
        ]
    )
    return True

def answer_query_with_context(query, context, memory):
    """Answer a query using RAG approach with provided context and chat history."""
    # Create system prompt with context
    system_prompt = f"""You are a expert medical professional. You are tasked with giving
    safe and accurate medical information. The context provided to you is directly from your knowledge base.
    If the user asks a medical question and the context does not contain relevant information, you should say 
    "I can't find that information in my knowledge base." Then try to give a general answer.
    
    Provide concise, and professional language while maintaining a warm and empathetic approach.
    Do not use sorrow or pitiful language. Do not apologise in the response.
    Do not bring up death, short survival time, or that there is no cure unless the user specifically asks about these.
    Offer analogies or examples when helpful but be sensitive and considerate to the severity of the patient’s situation - contextualise if a response could be interpreted as belittling the user's experience.
    If a technical term is necessary, provide a simple definition.
    Assume the patient has no medical background and aim to educate without overwhelming.
    
    You are speaking with {os.getenv("name")}. A {os.getenv("age")} year old {os.getenv("gender")} diagnosed with {os.getenv("diagnosis")} and prescribed {os.getenv("medication")}.

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