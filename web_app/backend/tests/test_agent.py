import pytest
from unittest.mock import patch, MagicMock

# Import your application
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agent import RAGAgent

@pytest.mark.asyncio
async def test_browser_rag(mock_llama_index):
    """Test browser RAG functionality"""
    # Test data
    query = "What is the capital of France?"
    urls = ["https://example.com/france"]
    
    # Call the function
    result = await RAGAgent.browser_rag(query, urls)
    
    # Check the result
    assert "response" in result
    assert "source_urls" in result
    assert result["response"] == "This is a test response"
    assert result["source_urls"] == urls
    
    # Verify the mocks were called correctly
    mock_index, mock_reader = mock_llama_index
    mock_reader.return_value.load_data.assert_called_once_with(urls)
    mock_index.from_documents.assert_called_once()

@pytest.mark.asyncio
async def test_database_rag_with_documents(mock_llama_index, mock_supabase):
    """Test database RAG with documents"""
    # Test data
    query = "What is in my documents?"
    user_id = "test-user-id"
    collection_name = "test_collection"
    
    # Mock Supabase response with documents
    mock_docs = [
        {"title": "Doc 1", "content": "Content 1"},
        {"title": "Doc 2", "content": "Content 2"}
    ]
    mock_response = MagicMock()
    mock_response.data = mock_docs
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
    
    # Call the function
    result = await RAGAgent.database_rag(query, user_id, collection_name)
    
    # Check the result
    assert "response" in result
    assert "sources" in result
    assert result["response"] == "This is a test response"
    assert result["sources"] == ["Doc 1", "Doc 2"]
    
    # Verify the mocks were called correctly
    mock_index, _ = mock_llama_index
    mock_supabase.table.assert_called_with("documents")
    mock_index.from_documents.assert_called_once()

@pytest.mark.asyncio
async def test_database_rag_no_documents(mock_supabase):
    """Test database RAG with no documents"""
    # Test data
    query = "What is in my documents?"
    user_id = "test-user-id"
    collection_name = "empty_collection"
    
    # Mock empty Supabase response
    mock_response = MagicMock()
    mock_response.data = []
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
    
    # Call the function
    result = await RAGAgent.database_rag(query, user_id, collection_name)
    
    # Check the result
    assert "response" in result
    assert "sources" in result
    assert "No documents found" in result["response"]
    assert result["sources"] == []