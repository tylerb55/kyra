from llama_index.readers.web import BeautifulSoupWebReader
from llama_index.core import VectorStoreIndex, Document
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import NodeWithScore
from typing import List
import os
import requests

def query_browser(query, top_n=3):
    """Query the browser for relevant information. take the top n results and return them"""
    url = "https://api.search.brave.com/res/v1/web/search"
    params = {
        "q": query,
        "country": "GB",
        "result_filter": "web",
        "count": top_n
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
        return []


def load_and_process_documents(urls):
    """Load and process documents from URLs."""
    reader = BeautifulSoupWebReader()
    documents = reader.load_data(urls)

    for i, doc in enumerate(documents):
        lines = documents[i].text.split("\n")

        # remove sections with more than two empty lines in a row
        fixed_lines = [lines[0]]  # Start with the first line
        for idx in range(1, len(lines)):
            if lines[idx].strip() == "" and lines[idx - 1].strip() == "":
                continue
            fixed_lines.append(lines[idx])

        documents[i] = documents[i].model_copy(update={"text": "\n".join(fixed_lines)})
    
    return documents

def create_vector_index(query_results):
    """Create a vector store index from documents."""
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
    ) for i, doc_data in enumerate(query_results)]
    
    index = VectorStoreIndex.from_documents(
        documents,
        embed_model=HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5"),
    )
    return index

def browser_retrieve(index, query, n_results=3):
    """Retrieve relevant documents from the vector store index."""
    retriever = index.as_retriever(similarity_top_k=n_results)
    return retriever.retrieve(query)

def format_context_from_nodes(nodes: List[NodeWithScore]) -> str:
    """Format retrieved nodes into a context string for the LLM."""
    context_str = ""
    source_details = []
    for i, node in enumerate(nodes):
        context_str += f"Document {i+1}:\n{node.node.text}\n\n"
        # add source details to the source_details list if the source is not already in the list
        if f"[{i}] Title: {node.node.metadata['title']}, Source: {node.node.metadata['url']}, Author: {node.node.metadata['author']}\n" not in source_details:
            source_details.append(f"[{i}] Title: {node.node.metadata['title']}, Source: {node.node.metadata['url']}, Author: {node.node.metadata['author']}\n")
    return context_str, source_details