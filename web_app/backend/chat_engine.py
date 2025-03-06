from openai import OpenAI
from collections import deque
import os
from llama_index.postprocessor.colbert_rerank import ColbertRerank
from llama_index.readers.web import BeautifulSoupWebReader
from llama_index.core import VectorStoreIndex, Settings
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from typing import Dict, Any, List, Optional
from pydantic import Field
from llama_index.core.schema import NodeWithScore
from dotenv import load_dotenv

load_dotenv("../.env")

def load_and_process_documents(urls):
    """Load and process documents from URLs."""
    reader = BeautifulSoupWebReader()
    documents = reader.load_data(urls)

    for i, doc in enumerate(documents):
        lines = documents[i].text.split("\n")

        # remove sections with more than two empty lines in a row
        fixed_lines = [lines[i]]
        for idx in range(1, len(lines)):
            if lines[idx].strip() == "" and lines[idx - 1].strip() == "":
                continue
            fixed_lines.append(lines[idx])

        documents[i] = documents[i].model_copy(update={"text": "\n".join(fixed_lines)})
    
    return documents

def create_vector_index(documents):
    """Create a vector store index from documents."""
    index = VectorStoreIndex.from_documents(
        documents,
        embed_model=HuggingFaceEmbedding(model_name = "BAAI/bge-small-en-v1.5"),
    )
    return index


def retrieve_relevant_documents(index, query, n_results=3):
    """
    Retrieve relevant documents from the vector store index based on the query.
    
    Args:
        index: The vector store index to search
        query: The user query
        n_results: Number of results to retrieve
        
    Returns:
        List of retrieved nodes with relevance scores
    """
    retriever = index.as_retriever(similarity_top_k=n_results)
    retrieved_nodes = retriever.retrieve(query)
    
    # Optional: Add reranking for better results
    # reranker = ColbertRerank()
    # reranked_nodes = reranker.postprocess_nodes(retrieved_nodes, query)
    # return reranked_nodes
    
    return retrieved_nodes

def format_context_from_nodes(nodes: List[NodeWithScore]) -> str:
    """
    Format retrieved nodes into a context string for the LLM.
    
    Args:
        nodes: List of retrieved nodes with scores
        
    Returns:
        Formatted context string
    """
    context_str = ""
    for i, node in enumerate(nodes):
        context_str += f"Document {i+1}:\n{node.node.text}\n\n"
    return context_str

def create_memory():
    """
    Create a simple memory queue that holds the last 10 messages.
    
    Returns:
        A deque object limited to 10 items to store conversation history
    """
    # Initialize a deque with a maximum length of 10
    memory = deque(maxlen=10)
    return memory

def answer_query_with_rag(index, query, memory, llm):
    """
    Answer a query using RAG approach with chat history.
    
    Args:
        index: The vector store index
        query: User query
        chat_memory: Chat memory buffer containing conversation history
        model_name: LLM model to use
        
    Returns:
        Response from the LLM
    """
    # Retrieve relevant documents
    retrieved_nodes = retrieve_relevant_documents(index, query)
    context = format_context_from_nodes(retrieved_nodes)
    
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
    Main function to run the RAG-based chat system.
    
    This function:
    1. Prompts the user for URLs to load documents from
    2. Creates a vector index from those documents
    3. Initializes a chat memory buffer
    4. Enters a chat loop where the user can ask questions
    """
    llm = OpenAI(
		base_url = "https://pn3bt077dimy5mo9.us-east-1.aws.endpoints.huggingface.cloud/v1/",
		api_key = os.environ["HUGGINGFACE_API_KEY"]
	)
    
    print("Welcome to the RAG-based Chat System!")
    
    urls = ["https://docs.anthropic.com/claude/docs/tool-use"]
    
    print("Loading and processing documents...")
    documents = load_and_process_documents(urls)
    
    print("Creating vector index...")
    index = create_vector_index(documents)
    
    print("Initializing chat memory...")
    chat_memory = create_memory()
    
    print("\nChat initialized! Type 'exit' to end the conversation.")
    print("Ask a question about the loaded documents:")
    
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
        response = answer_query_with_rag(index, query, chat_memory, llm)
        
        # Display response
        print("\nAssistant:")
        #print(response[0].choices[0].delta.content)
        print(response)
        print()

if __name__ == "__main__":
    main()