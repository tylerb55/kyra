from llama_index.readers.web import BeautifulSoupWebReader
from llama_index.core import VectorStoreIndex
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import NodeWithScore
from typing import List

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

def create_vector_index(documents):
    """Create a vector store index from documents."""
    index = VectorStoreIndex.from_documents(
        documents,
        embed_model=HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5"),
    )
    return index

def retrieve_relevant_documents(index, query, n_results=3):
    """Retrieve relevant documents from the vector store index."""
    retriever = index.as_retriever(similarity_top_k=n_results)
    return retriever.retrieve(query)

def format_context_from_nodes(nodes: List[NodeWithScore]) -> str:
    """Format retrieved nodes into a context string for the LLM."""
    context_str = ""
    for i, node in enumerate(nodes):
        context_str += f"Document {i+1}:\n{node.node.text}\n\n"
    return context_str