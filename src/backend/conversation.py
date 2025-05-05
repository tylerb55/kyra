import uuid
from collections import deque
from config import conversation_memories, conversations, llm, supabase_client, cosine_distance_threshold
from prompts import *
from db_rag import retrieve_relevant_documents
import os
import json
import datetime
from utils.helper_functions import extract_json_from_markdown
import logging
from google import genai
from google.genai import types
from openai import OpenAI
from dotenv import load_dotenv
from models import UserProfile

load_dotenv()

gemini_chat = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
current_model = None

def gemini_response(system_prompt, memory, query, model):
    global current_model

    memory.append({"role": "user", "content": query})
    
    contents = []
    for message in memory:
        contents.append(types.Content(role=message["role"], parts=[types.Part(text=message["content"])]))
    
    response = gemini_chat.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system_prompt)
    )
    memory.append({"role": "model", "content": response.text})
    current_model = model
    return response.text

    
def gpt_response(system_prompt, memory, query, model):
    global current_model
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in memory:
        messages.append(msg)
    messages.append({"role": "user", "content": query})
    memory.append({"role": "user", "content": query})

    response = client.responses.create(
        model=model,
        instructions=os.environ("system_prompt"),
        input=query,
    )
    current_model = model
    return response.output_text

def tgi_response(system_prompt, memory, query, model):
    global current_model
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
    current_model = model
    return response 

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
    
def format_context_from_records(records, profile: UserProfile):
    """Format retrieved records into a context string for the LLM."""
    context_str = f"Patient Information: You are speaking to {profile.username} who is a {profile.role} with {profile.diagnosis}. Their age is {profile.age} and their gender is {profile.gender}. They have been prescribed {profile.prescription}.\n\n"
    for i, record in enumerate(records):
        if record[1] < cosine_distance_threshold:
            context_str += f"Citation ID [{i+1}]:\n{record[2]['content']}\n\n"
    return context_str

def check_user_intent(query, model):
    """Check the user's intent based on the query."""
    system_prompt = f"""
    You are a medical advisor called Kyra.
    You are given a query.
    Your job is to classify the user's intent based on the query.
    The possible intents are:
    greetings_chit_chat - The user is greeting you or having general non-medical conversation.
    clarification_questions - The user is asking to repeat or further explain something previously mentioned in the conversation.
    app_functionality_questions - The user is asking about the app, how to use it or what it can do.
    diagnosis_questions - The user is asking about their diagnosis, what it means or what the implications are.
    treatment_questions - The user is asking for information about their specific treatment plan or prescription.
    prognosis_questions - User asking about their specific outlook or chances of recovery/recurrence. Extremely sensitive, handle with utmost care and strong disclaimers, potentially deflecting to discussion with their doctor.
    side_effects_questions - User asking how to manage a common side effect (e.g., "How to deal with fatigue?", "What helps with hot flashes?"). Response can be tailored based on their likely treatment causing it.
    emotional_support_questions - User asking for emotional support, advice or just someone to talk to.
    general_medical_questions - User asking a general medical question that is not specific or related to the user.
    Respond ONLY with the intent name (e.g., "diagnosis_questions"). Do not add any other text or formatting.
    Example:
    Query: What are the side effects of Leuprolide?
    Intent: side_effects_questions
    """
    query = f"Query: {query}"
    intent_response = gemini_response(system_prompt, [], query, model)
    return intent_response

def handle_intent(intent, query, memory, model, profile: UserProfile):
    """Handle the user's intent."""
    if "greetings_chit_chat" in intent:
        return gemini_response(base_system_prompt, memory, query, model), []
    elif "app_functionality_questions" in intent:
        return gemini_response(make_app_functionality_prompt(), memory, query, model), []
    elif "clarification_questions" in intent:
        context = retrieve_relevant_documents(query)
        source_details = format_context_from_records(context)
        context_string = format_context_from_records(context)
        query = f"Context: {context_string}\nQuery: {query}"
        return gemini_response(make_clarification_prompt(), memory, query, model), source_details
    elif "prognosis_questions" in intent:
        query = f"I have been diagnosed with {profile.diagnosis}. {query}"
        context = retrieve_relevant_documents(query)
        source_details = format_context_from_records(context)
        context_string = format_context_from_records(context)
        query = f"Context: {context_string}\nQuery: {query}"
        return gemini_response(make_prognosis_prompt(), memory, query, model), source_details
    elif "diagnosis_questions" in intent:
        query = f"I have been diagnosed with {profile.diagnosis}. {query}"
        context = retrieve_relevant_documents(query)
        source_details = format_context_from_records(context)
        context_string = format_context_from_records(context)
        query = f"Context: {context_string}\nQuery: {query}"
        return gemini_response(make_diagnosis_prompt(), memory, query, model), source_details
    elif "treatment_questions" in intent:
        query = f"I have been prescribed {profile.prescription}. {query}"
        context = retrieve_relevant_documents(query)
        source_details = format_context_from_records(context)
        context_string = format_context_from_records(context)
        query = f"Context: {context_string}\nQuery: {query}"
        return gemini_response(make_treatment_prompt(), memory, query, model), source_details
    else:
        context = retrieve_relevant_documents(query)
        source_details = format_context_from_records(context)
        context_string = format_context_from_records(context)
        query = f"Context: {context_string}\nQuery: {query}"
        return gemini_response(base_system_prompt, memory, query, model), source_details

def answer_query_with_context(query, context, memory, model):
    """Answer a query using RAG approach with provided context and chat history."""
    # Create system prompt with context
    system_prompt = f"""{os.getenv("system_prompt")}\n
    If you can use the context provided to answer the question, answer with all related pieces of knowledge. Always reference between phrases the ones you use. If you skip one, you will be penalized.

    Use the format [citationId] between sentences. Use the exact same "citationId" present in the context.

    Example:
    The capital of Chile is Santiago de Chile [1], and the population is 7 million people [3].
    
    If "No relevant documents found for the query" is present in the context, or you would need external sources to answer the question, answer with "Unfortunately, I don't have that info in my records of trusted info. If you want to swipe across to free internet searching I can provide some answers from the internet, but please note, I cannot guarantee the reliability of these sources"
    
    Context:
    {context}
    """
    
    if "gemini" in model:
        response = gemini_response(system_prompt, memory, query, model)
        assistant_message = {"role": "assistant", "content": response}
    elif "gpt" in model:
        response = gpt_response(system_prompt, memory, query, model)
        assistant_message = {"role": "assistant", "content": response}
    elif "qwen" in model:
        response = tgi_response(system_prompt, memory, query)
        assistant_message = {"role": "assistant", "content": response.choices[0].message.content}
    else:
        raise ValueError(f"Invalid model: {model}")
    # Add assistant response to memory
    memory.append(assistant_message)
    
    return assistant_message["content"]