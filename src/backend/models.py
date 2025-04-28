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
    model: Optional[str] = "gemini-2.5-flash-preview-04-17"
    session_id: Optional[str] = None

class DatabaseRagRequest(BaseModel):
    query: str
    model: Optional[str] = "gemini-2.5-flash-preview-04-17"
    collection_name: Optional[str] = "rag_documents"
    session_id: Optional[str] = None

class ClearConversationRequest(BaseModel):
    session_id: str
    conversation_name: Optional[str] = None

class Source(BaseModel):
    title: str
    source: str
    author: str
class RagResponse(BaseModel):
    answer: str  
    source: Optional[List[Source]] = None
    session_id: Optional[str] = None
class UserProfile(BaseModel):
    id: str
    username: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    role: Optional[str] = None
    updated_at: Optional[str] = None

class SystemPromptData(BaseModel):
    system_prompt: str
    
class Message(BaseModel):
    id: str
    text: str
    sender: str
    timestamp: str
class TranscriptObject(BaseModel):
    id: str
    title: str
    messages: List[Message]
    timestamp: str
    mode: str