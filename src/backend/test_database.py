import supabase
import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import requests

load_dotenv()
# print timestamp + timezone in format 2025-03-08 16:13:10+00
print(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S%z")[:-2])

def query_brave(query):
    # Set up the request
    url = "https://api.search.brave.com/res/v1/web/search"
    params = {
        "q": query,
        "country": "GB",
        "result_filter": "web",
        "count": 3
    }
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": os.getenv("BRAVE_API_KEY")
    }

    # Make the request
    response = requests.get(url, params=params, headers=headers)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the JSON response
        data = response.json()
        results = data["web"]["results"]
        return results
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        

from llama_index.core import Document
from llama_index.core import VectorStoreIndex
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import NodeWithScore
from typing import List

def create_and_search_documents(documents_data: List[str], query: str):
    """
    Creates LlamaIndex documents from text strings, indexes them, and performs a similarity search.
    
    Args:
        texts: List of text strings to convert to documents
        query: Query string to search for
        
    Returns:
        List of retrieved nodes with scores
    """
    # Create LlamaIndex documents from text strings
    documents = [
    Document(
        text=" ".join(doc_data["extra_snippets"]),
        metadata={
            "url": doc_data.get("url", ""),
            "title": doc_data.get("title", ""),
            "author": doc_data.get("profile", {}).get("name", ""),
            # You can add any other metadata fields here
            "source_id": i  # Adding an index to track the original position
        }
    ) for i, doc_data in enumerate(documents_data)
    ]
    
    # Initialize the embedding model
    embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    # Create a vector store index from the documents
    index = VectorStoreIndex.from_documents(
        documents,
        embed_model=embed_model,
    )
    
    # Create a retriever that will return all documents sorted by similarity
    retriever = index.as_retriever(similarity_top_k=len(documents))
    
    # Retrieve documents similar to the query
    retrieved_nodes = retriever.retrieve(query)
    
    return retrieved_nodes


results = query_brave("what is deep learning")
nodes = create_and_search_documents(results, "what is deep learning")
print(nodes[0].node.metadata)

    





