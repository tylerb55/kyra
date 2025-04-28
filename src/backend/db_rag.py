from config import documents, cosine_distance_threshold, supabase_client
import logging

def store_rag_metrics(query, response, user_id=None):
    """Calculate and store RAG metrics."""
    try:
        cosine_distance = response[1]
        metadata = response[2]
        
        # extract metadata
        source = metadata.get('source', "")
        section = metadata.get('section', None)
        page_number = metadata.get('page', None)
        
        result = supabase_client.table('rag_metrics').insert({
            'query': query,
            'source': source,
            'section': section,
            'page_number': page_number,
            'cosine_distance': cosine_distance,
            'user_id': user_id
        }).execute()
        
        if result.data:
            logging.info(f"RAG metrics stored for user_id: {user_id}")
            return True
        else:
            logging.error(f"Failed to store RAG metrics for user_id: {user_id}")
            return False
    except Exception as e:
        logging.error(f"Error storing RAG metrics for user_id: {user_id}: {e}")
        return False     

def retrieve_relevant_documents(query, limit=5, user_id=None):
    """Retrieve relevant documents from the Postgres vector store."""
    retrieved_docs = documents.query(query, limit=limit, include_metadata=True, include_value=True)
    for doc in retrieved_docs:
        store_rag_metrics(query, doc, user_id)
    return retrieved_docs

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
            title = str(record[2]['section'])
            title_source = f"Title: {title}\nSource: {source}"
            
            # Assign source ID if not already assigned
            if title_source not in source_to_id:
                source_to_id[title_source] = current_source_id
                current_source_id += 1
            
            source_id = source_to_id[title_source]
            
            # Add text with source ID to context string
            context_str += f"citationId: [{source_id}]\nTitle:{title}\nSource:{source}\n{text}\n\n"
            
            # Add source details if not already added
            target_dict = {
                "id": source_id,
                "title": title, 
                "source": source, 
                "author": str(record[2]['username'])
            }
            if target_dict not in source_details:
                source_details.append(target_dict)
        if i == 0 and cosine_distance > cosine_distance_threshold:
            context_str += f"No relevant documents found for the query"
            source_details = []
            return context_str, source_details
    
    return context_str, source_details