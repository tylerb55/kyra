import pytest
from fastapi import HTTPException
from unittest.mock import patch, MagicMock

# Import your application
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import verify_password, get_password_hash, create_access_token, get_current_user

def test_verify_password():
    """Test password verification"""
    # This is a bcrypt hash for 'password'
    hashed = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"
    
    # Test correct password
    assert verify_password("password", hashed) is True
    
    # Test incorrect password
    assert verify_password("wrong_password", hashed) is False

def test_get_password_hash():
    """Test password hashing"""
    password = "test_password"
    hashed = get_password_hash(password)
    
    # Check that hash is not the original password
    assert hashed != password
    
    # Check that the hash can be verified
    assert verify_password(password, hashed) is True

def test_create_access_token():
    """Test JWT token creation"""
    data = {"sub": "testuser"}
    token = create_access_token(data)
    
    # Check that token is a string
    assert isinstance(token, str)
    
    # Check that token is not empty
    assert len(token) > 0

@pytest.mark.asyncio
async def test_get_current_user_valid_token(test_token, mock_supabase, test_user):
    """Test user retrieval with valid token"""
    # Mock Supabase response
    mock_response = MagicMock()
    mock_response.data = [test_user]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
    
    # Test with valid token
    user = await get_current_user(test_token)
    assert user["username"] == test_user["username"]
    assert user["email"] == test_user["email"]

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(mock_supabase):
    """Test user retrieval with invalid token"""
    # Test with invalid token
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user("invalid_token")
    
    assert excinfo.value.status_code == 401
    assert "Could not validate credentials" in excinfo.value.detail

@pytest.mark.asyncio
async def test_get_current_user_user_not_found(test_token, mock_supabase):
    """Test user retrieval when user not in database"""
    # Mock empty Supabase response
    mock_response = MagicMock()
    mock_response.data = []
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
    
    # Test with valid token but user not in database
    with pytest.raises(HTTPException) as excinfo:
        await get_current_user(test_token)
    
    assert excinfo.value.status_code == 401
    assert "Could not validate credentials" in excinfo.value.detail