from config import docs, cosine_distance_threshold

def retrieve_relevant_documents(query, collection_name="rag_documents", limit=5):
    """Retrieve relevant documents from the Postgres vector store."""
    return docs.query(query, limit=limit, include_metadata=True, include_value=True)

def format_context_from_records(records) -> str:
    """Format retrieved records into a context string for the LLM."""
    context_str = ""
    source_details = []
    
    # Create a dictionary to track unique sources and assign IDs
    source_to_id = {}
    current_source_id = 1
    
    for i, record in enumerate(records):
        cosine_distance = record[1]   
        if cosine_distance < cosine_distance_threshold:
            # Extract text from the record
            text = record[2].get('text', str(record))
            source = str(record[2]['source'])
            
            # Assign source ID if not already assigned
            if source not in source_to_id:
                source_to_id[source] = current_source_id
                current_source_id += 1
            
            source_id = source_to_id[source]
            
            # Add text with source ID to context string
            context_str += f"citationID: [{source_id}]\nTitle:{record[2]['title']}\nSource:{source}\n{text}\n\n"
            
            # Add source details if not already added
            target_dict = {
                "id": source_id,
                "title": str(record[2]['title']), 
                "source": source, 
                "author": str(record[2]['author'])
            }
            if target_dict not in source_details:
                source_details.append(target_dict)
    
    return context_str, source_details