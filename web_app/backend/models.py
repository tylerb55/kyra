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
class QueryRequest(BaseModel):
    query: str
    urls: Optional[List[str]] = None

class DatabaseQueryRequest(BaseModel):
    query: str
    collection_name: Optional[str] = None