import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Import your application
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app

def test_register_user(test_client, mock_supabase):
    """Test user registration endpoint"""
    # Mock empty Supabase response (user doesn't exist)
    mock_response = MagicMock()
    mock_response.data = []
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
    
    # Mock successful insert
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
    
    # Test data
    user_data = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "password123"
    }
    
    # Make request
    response = test_client.post("/register", json=user_data)
    
    # Check response
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "token_type" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_register_existing_user(test_client, mock_supabase):
    """Test registration with existing username"""
    # Mock Supabase response with existing user
    mock_response = MagicMock()
    mock_response.data = [{"username": "existinguser"}]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
    
    # Test data
    user_data = {
        "username": "existinguser",
        "email": "existing@example.com",
        "password": "password123"
    }
    
    # Make request
    response = test_client.post("/register", json=user_data)
    
    # Check response
    assert response.status_code == 400
    assert "Username already registered" in response.json()["detail"]

def test_login(test_client, mock_supabase, test_user):
    """Test login endpoint"""
    # Mock Supabase response with user
    mock_response = MagicMock()
    mock_response.data = [test_user]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
    
    # Test data
    form_data = {
        "username": test_user["username"],
        "password": "password"  # This matches the hashed password in test_user
    }
    
    # Make request
    response = test_client.post("/token", data=form_data)
    
    # Check response
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "token_type" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_invalid_credentials(test_client, mock_supabase):
    """Test login with invalid credentials"""
    # Mock empty Supabase response (user doesn't exist)
    mock_response = MagicMock()
    mock_response.data = []
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
    
    # Test data
    form_data = {
        "username": "nonexistentuser",
        "password": "wrongpassword"
    }
    
    # Make request
    response = test_client.post("/token", data=form_data)
    
    # Check response
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

def test_browser_rag_endpoint(test_client, test_token):
    """Test browser RAG endpoint"""
    # Mock the RAGAgent.browser_rag method
    with patch('app.RAGAgent.browser_rag') as mock_browser_rag:
        # Configure the mock
        mock_result = {
            "response": "This is a test response",
            "source_urls": ["https://example.com"]
        }
        mock_browser_rag.return_value = mock_result
        
        # Test data
        request_data = {
            "query": "What is the capital of France?",
            "urls": ["https://example.com/france"]
        }
        
        # Make request with authentication
        response = test_client.post(
            "/browser-rag",
            json=request_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        # Check response
        assert response.status_code == 200
        assert response.json() == mock_result

def test_database_rag_endpoint(test_client, test_token):
    """Test database RAG endpoint"""
    # Mock the RAGAgent.database_rag method
    with patch('app.RAGAgent.database_rag') as mock_database_rag:
        # Configure the mock
        mock_result = {
            "response": "This is a test response from database",
            "sources": ["Doc 1", "Doc 2"]
        }
        mock_database_rag.return_value = mock_result
        
        # Test data
        request_data = {
            "query": "What is in my documents?",
            "collection_name": "test_collection"
        }
        
        # Make request with authentication
        response = test_client.post(
            "/database-rag",
            json=request_data,
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        # Check response
        assert response.status_code == 200
        assert response.json() == mock_result

def test_me_endpoint(test_client, test_token, test_user):
    """Test user profile endpoint"""
    # Mock the get_current_user dependency
    with patch('app.get_current_user', return_value=test_user):
        # Make request with authentication
        response = test_client.get(
            "/me",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        # Check response
        assert response.status_code == 200
        assert response.json()["username"] == test_user["username"]
        assert response.json()["email"] == test_user["email"]