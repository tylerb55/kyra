from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# User models
class User(BaseModel):
    username: str
    email: str
    password: str

class UserInDB(User):
    hashed_password: str

# Authentication models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# RAG query models
class BrowserRagRequest(BaseModel):
    query: str
    urls: List[str]
    session_id: Optional[str] = None

class DatabaseRagRequest(BaseModel):
    query: str
    collection_name: Optional[str] = "rag_documents"
    session_id: Optional[str] = None

class ClearConversationRequest(BaseModel):
    session_id: str
    conversation_name: Optional[str] = None

class RagResponse(BaseModel):
    answer: str
    session_id: str