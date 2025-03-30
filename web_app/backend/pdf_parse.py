import os
import json
import requests
from llama_parse import LlamaParse
from config import llm, documents, supabase_client #, LLAMA_PARSE_API_KEY
from sentence_transformers import SentenceTransformer
import datetime
import uuid 

def process_pdf_with_llama_parse(file_path, username=None, chunk_size=1000):
    """
    Process a PDF file using LlamaParse, create embeddings, and store in Supabase
    
    Args:
        file_path: Path to the PDF file
        username: Username to associate with the document
        chunk_size: Size of text chunks to create
        
    Returns:
        List of document IDs created in the database
    """
    pdf_name = os.path.basename(file_path)
    
    # Initialize LlamaParse
    parser = LlamaParse(
    api_key="llx-6u8gIvj8ATvE5Z4cMtdSyAVxuMfclllbCJfd0tTOerxOPOqZ",  # can also be set in your env as LLAMA_CLOUD_API_KEY
    result_type="markdown",  # "markdown" and "text" are available
    verbose=True,
    language="en",  # Optionally you can define a language, default=en
    )
    
    # Parse the PDF
    document = parser.load_data(file_path)
    
    # Create embeddings and store in database
    doc_ids = []
    
    # Process each page (document object) separately
    for page_idx, doc in enumerate(document):
        page_content = doc.get_content()
        
        # Create chunks based on document structure for this page
        chunks = []
        current_chunk = ""
        current_section = ""
        
        for line in page_content.split('\n'):
            # Check if line is a header
            if line.startswith('#'):
                # If we have content in the current chunk, save it
                if current_chunk:
                    chunks.append({
                        "content": current_chunk.strip(),
                        "section": current_section.strip() if current_section else "General"
                    })
                    current_chunk = ""
                
                current_section = line
                current_chunk = line + "\n"
            else:
                current_chunk += line + "\n"
                
                # Check if chunk is getting too large
                if len(current_chunk) >= chunk_size:
                    chunks.append({
                        "content": current_chunk.strip(),
                        "section": current_section.strip() if current_section else "General"
                    })
                    current_chunk = ""
        
        # Add the last chunk if there's content
        if current_chunk:
            chunks.append({
                "content": current_chunk.strip(),
                "section": current_section.strip() if current_section else "General"
            })
        
        # Get page number from document metadata if available, otherwise use index
        page_number = page_idx
        if hasattr(doc, 'metadata') and doc.metadata and 'page_number' in doc.metadata:
            page_number = doc.metadata['page_number']
        
        # Process each chunk for this page
        for i, chunk in enumerate(chunks):
            # Create embedding
            embedding = SentenceTransformer('BAAI/bge-base-en-v1.5').encode(chunk["content"])
            
            # Create metadata
            metadata = {
                "source": pdf_name,
                "chunk": i,
                "page": page_number,
                "section": chunk["section"],
                "parsed_by": "llama_parse"
            }
            
            # Store in Supabase
            result = supabase_client.rpc(
                "insert_document",
                {
                    "p_content": chunk["content"],
                    "p_embedding": embedding.tolist(),
                    "p_metadata": json.dumps(metadata),
                    "p_username": username,
                    "p_pdf_name": pdf_name,
                    "p_chunk_index": i
                }
            ).execute()
            
            if result.data:
                doc_ids.append(result.data[0])
    
    return doc_ids

def process_pdf_with_llama_parse_vecs(file_path, username=None, chunk_size=1000):
    """
    Process a PDF file using LlamaParse, create embeddings, and store in vecs documents collection
    
    Args:
        file_path: Path to the PDF file
        username: Username to associate with the document
        chunk_size: Size of text chunks to create
        
    Returns:
        List of document IDs created in the database
    """
    pdf_name = os.path.basename(file_path)
    
    # Initialize LlamaParse
    parser = LlamaParse(
        api_key="llx-6u8gIvj8ATvE5Z4cMtdSyAVxuMfclllbCJfd0tTOerxOPOqZ",
        result_type="markdown",
        verbose=True,
        language="en",
    )
    
    # Parse the PDF
    document = parser.load_data(file_path)
    
    # Create embeddings and store in database
    doc_ids = []
    
    # Process each page (document object) separately
    for page_idx, doc in enumerate(document):
        page_content = doc.get_content()
        
        # Create chunks based on document structure for this page
        chunks = []
        current_chunk = ""
        current_section = ""
        
        for line in page_content.split('\n'):
            # Check if line is a header
            if line.startswith('#'):
                # If we have content in the current chunk, save it
                if current_chunk:
                    chunks.append({
                        "content": current_chunk.strip(),
                        "section": current_section.strip() if current_section else "General"
                    })
                    current_chunk = ""
                
                current_section = line
                current_chunk = line + "\n"
            else:
                current_chunk += line + "\n"
                
                # Check if chunk is getting too large
                if len(current_chunk) >= chunk_size:
                    chunks.append({
                        "content": current_chunk.strip(),
                        "section": current_section.strip() if current_section else "General"
                    })
                    current_chunk = ""
        
        # Add the last chunk if there's content
        if current_chunk:
            chunks.append({
                "content": current_chunk.strip(),
                "section": current_section.strip() if current_section else "General"
            })
        
        # Get page number from document metadata if available, otherwise use index
        page_number = page_idx
        if hasattr(doc, 'metadata') and doc.metadata and 'page_number' in doc.metadata:
            page_number = doc.metadata['page_number']
        
        # Process each chunk for this page
        for i, chunk in enumerate(chunks):
            # Create metadata with all relevant information
            metadata = {
                "source": pdf_name,
                "chunk_index": i,
                "page": page_number+1,
                "section": chunk["section"],
                "content": chunk["content"],
                "parsed_by": "llama_parse",
                "username": username,
                "pdf_name": pdf_name,
                "created_at": datetime.datetime.now().isoformat()
            }
            
            # Generate a UUID for the document
            doc_id = str(uuid.uuid4())            
            
            # Insert into vecs documents collection
            # The adapter will automatically create the embedding
            documents.upsert(
                records=[(doc_id, chunk["content"], metadata)]  # (id, content, metadata)
            )
            
            doc_ids.append(doc_id)
    
    return doc_ids

if __name__ == "__main__":
    for file in os.listdir("pdfs"):
        process_pdf_with_llama_parse_vecs(f"pdfs/{file}")
    #process_pdf_with_llama_parse("computervision.pdf")
    #process_pdf_with_llama_parse_vecs("computervision.pdf")

