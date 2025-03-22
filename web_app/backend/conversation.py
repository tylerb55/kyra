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

def answer_query_with_context(query, context, memory, username, age, gender, diagnosis, prescription):
    """Answer a query using RAG approach with provided context and chat history."""
    # Create system prompt with context
    system_prompt = f"""{os.getenv("system_prompt")}\n
    Answer with all related pieces of knowledge. Always reference between phrases the ones you use. If you skip one, you will be penalized.

    Use the format [citationId] between sentences. Use the exact same "citationId" present in the context.

    Example:
    The capital of Chile is Santiago de Chile[1], and the population is 7 million people[3].
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