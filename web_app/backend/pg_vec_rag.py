import vecs
from vecs.adapter import Adapter, ParagraphChunker, TextEmbedding
import json
import os
from openai import OpenAI
from collections import deque
from typing import List
from dotenv import load_dotenv

load_dotenv("../.env")

# Postgres connection setup
password = os.getenv("POSTGRES_PASSWORD")
host = "aws-0-us-west-1.pooler.supabase.com"
port = "6543"
db_name = "postgres"
# Create vector store client
vx = vecs.Client(f"postgresql://postgres.ctjqozswmwitgayctdtk:{password}@{host}:{port}/{db_name}")

# Get or create collection with adapter
docs = vx.get_or_create_collection(
    name="rag_documents",
    adapter=Adapter(
        [
            ParagraphChunker(skip_during_query=True),
            TextEmbedding(model='BAAI/bge-small-en-v1.5'),
        ]
    )
)

def create_memory():
    """
    Create a simple memory queue that holds the last 10 messages.
    
    Returns:
        A deque object limited to 10 items to store conversation history
    """
    # Initialize a deque with a maximum length of 10
    memory = deque(maxlen=10)
    return memory

def retrieve_relevant_documents(query, limit=5):
    """
    Retrieve relevant documents from the Postgres vector store based on the query.
    
    Args:
        query: The user query
        limit: Number of results to retrieve
        
    Returns:
        List of retrieved documents with relevance scores
    """
    return docs.query(query, limit=limit, include_metadata=True, include_value=True)

def format_context_from_records(records) -> str:
    """
    Format retrieved records into a context string for the LLM.
    
    Args:
        records: List of retrieved records from Postgres
        
    Returns:
        Formatted context string
    """
    context_str = ""
    for i, record in enumerate(records):
        # Extract text from the record - adjust based on your actual record structure
        text = record.get('metadata', {}).get('text', str(record))
        context_str += f"Document {i+1}:\n{text}\n\n"
    return context_str

def answer_query_with_rag(query, memory, llm):
    """
    Answer a query using RAG approach with chat history.
    
    Args:
        query: User query
        memory: Chat memory buffer containing conversation history
        llm: LLM client
        
    Returns:
        Response from the LLM
    """
    # Retrieve relevant documents
    retrieved_records = retrieve_relevant_documents(query)
    context = format_context_from_records(retrieved_records)
    
    # Create system prompt with context
    system_prompt = f"""You are a helpful AI assistant. Answer the user's question based on the provided context.
    If you don't know the answer or the context doesn't contain relevant information, say so.
    Don't make up information that isn't in the context.

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

def main():
    """
    Main function to run the Postgres-based RAG chat system.
    """
    llm = OpenAI(
        base_url = "https://pn3bt077dimy5mo9.us-east-1.aws.endpoints.huggingface.cloud/v1/",
        api_key = os.environ["HUGGINGFACE_API_KEY"]
    )
    
    print("Welcome to the Postgres RAG-based Chat System!")
    print("Initializing chat memory...")
    chat_memory = create_memory()
    
    print("\nChat initialized! Type 'exit' to end the conversation.")
    print("Ask a question about the documents in the database:")
    
    # Chat loop
    while True:
        # Get user query
        query = input("> ")
        
        # Check if user wants to exit
        if query.lower() in ["exit", "quit", "bye"]:
            print("Thank you for chatting! Goodbye.")
            break
        
        # Process query and get response
        print("Thinking...")
        response = answer_query_with_rag(query, chat_memory, llm)
        
        # Display response
        print("\nAssistant:")
        print(response)
        print()

if __name__ == "__main__":
    main()