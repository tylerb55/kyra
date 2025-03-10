from llama_index import VectorStoreIndex, SimpleDirectoryReader, ServiceContext
from llama_index.llms import OpenAI
from llama_index.readers.web import SimpleWebPageReader
from llama_index.core import Settings
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
import supabase

# Load environment variables
load_dotenv("../.env")

# Initialize LlamaIndex
Settings.llm = OpenAI(model="gpt-4", temperature=0.1)

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase_client = supabase.create_client(supabase_url, supabase_key)

class RAGAgent:
    @staticmethod
    async def browser_rag(query: str, urls: List[str]) -> Dict[str, Any]:
        """
        Perform browser-assisted RAG using provided URLs
        """
        # Load documents from URLs
        documents = SimpleWebPageReader().load_data(urls)
        
        # Create index from documents
        index = VectorStoreIndex.from_documents(documents)
        
        # Query the index
        query_engine = index.as_query_engine()
        response = query_engine.query(query)
        
        return {
            "response": str(response),
            "source_urls": urls
        }
    
    @staticmethod
    async def database_rag(query: str, user_id: str, collection_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform database RAG using documents from Supabase
        """
        # Get user-specific data from Supabase
        collection = collection_name or "default_collection"
        
        # Query user's documents from the database
        response = supabase_client.table("documents").select("*").eq("user_id", user_id).eq("collection", collection).execute()
        
        if not response.data:
            return {
                "response": "No documents found in your collection.",
                "sources": []
            }
        
        # Process documents from database
        documents = [doc["content"] for doc in response.data]
        
        # Create index from documents
        index = VectorStoreIndex.from_documents(documents)
        
        # Query the index
        query_engine = index.as_query_engine()
        response = query_engine.query(query)
        
        return {
            "response": str(response),
            "sources": [doc["title"] for doc in response.data]
        }