import pytest
from fastapi.testclient import TestClient
import os
import jwt
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Import your application
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app, SECRET_KEY, ALGORITHM
from agent import RAGAgent, supabase_client

@pytest.fixture
def test_client():
    """
    Create a test client for FastAPI
    """
    with TestClient(app) as client:
        yield client

@pytest.fixture
def mock_supabase():
    """
    Mock the Supabase client for testing
    """
    with patch('agent.supabase_client') as mock:
        yield mock

@pytest.fixture
def mock_llama_index():
    """
    Mock LlamaIndex components for testing
    """
    with patch('agent.VectorStoreIndex') as mock_index, \
         patch('agent.SimpleWebPageReader') as mock_reader:
        
        # Configure the mocks
        mock_query_engine = MagicMock()
        mock_query_engine.query.return_value = "This is a test response"
        
        mock_index.from_documents.return_value.as_query_engine.return_value = mock_query_engine
        
        mock_reader.return_value.load_data.return_value = ["Document 1", "Document 2"]
        
        yield mock_index, mock_reader

@pytest.fixture
def test_user():
    """
    Create a test user
    """
    return {
        "id": "test-user-id",
        "username": "testuser",
        "email": "test@example.com",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # "password"
    }

@pytest.fixture
def test_token(test_user):
    """
    Create a test JWT token
    """
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"sub": test_user["username"], "exp": expire}
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token