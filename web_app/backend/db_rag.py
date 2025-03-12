from config import docs, cosine_distance_threshold

def retrieve_relevant_documents(query, collection_name="rag_documents", limit=5):
    """Retrieve relevant documents from the Postgres vector store."""
    return docs.query(query, limit=limit, include_metadata=True, include_value=True)

def format_context_from_records(records) -> str:
    """Format retrieved records into a context string for the LLM."""
    context_str = ""
    source_details = []
    for i, record in enumerate(records):
        cosine_distance = record[1]   
        if cosine_distance < cosine_distance_threshold:
            # Extract text from the record
            text = record[2].get('text', str(record))
            context_str += f"Document {i+1}:\n{text}\n\n"
            target_dict = {"title": str(record[2]['title']), "source": str(record[2]['source']), "author": str(record[2]['author'])}
            if target_dict not in source_details:
                source_details.append(target_dict)
    return context_str, source_details