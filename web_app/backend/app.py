from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
import os
from dotenv import load_dotenv
import traceback

# Import local modules
from models import *
from browser_rag import load_and_process_documents, create_vector_index, retrieve_relevant_documents as browser_retrieve, format_context_from_nodes
from db_rag import retrieve_relevant_documents as db_retrieve, format_context_from_records
from conversation import get_or_create_memory, save_conversation, answer_query_with_context
from config import *
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="RAG API with Browser and Database Support")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception
    
    # Get user from database
    response = supabase_client.table("users").select("*").eq("username", token_data.username).execute()
    user = response.data[0] if response.data else None
    
    if user is None:
        raise credentials_exception
    return user

# Authentication endpoints
@app.post("/register", response_model=Token)
async def register_user(user: User):
    # Check if user already exists
    response = supabase_client.table("users").select("*").eq("username", user.username).execute()
    if response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Hash password and store user
    hashed_password = get_password_hash(user.password)
    new_user = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    
    supabase_client.table("users").insert(new_user).execute()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Get user from database
    response = supabase_client.table("users").select("*").eq("username", form_data.username).execute()
    user = response.data[0] if response.data else None
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Browser-assisted RAG endpoint
@app.post("/browser-rag", response_model=RagResponse)
async def browser_rag(request: BrowserRagRequest):
    try:
        # Get or create conversation memory
        session_id, memory = get_or_create_memory(request.session_id)
        
        # Load and process documents from URLs
        documents = load_and_process_documents(request.urls)
        
        # Create vector index
        index = create_vector_index(documents)
        
        # Retrieve relevant documents
        retrieved_nodes = browser_retrieve(index, request.query)
        context = format_context_from_nodes(retrieved_nodes)
        
        # Generate response
        answer = answer_query_with_context(request.query, context, memory)
        
        return {"answer": answer, "session_id": session_id}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing browser RAG: {str(e)}"
        )

@app.post("/database-rag", response_model=RagResponse)
async def database_rag(request: DatabaseRagRequest):
    try:
        # Get or create conversation memory
        session_id, memory = get_or_create_memory(request.session_id)
        
        # Retrieve relevant documents from database
        retrieved_records = db_retrieve(
            request.query
        )
        context, source_details = format_context_from_records(retrieved_records)
        
        # Generate response
        answer = answer_query_with_context(request.query, context, memory)
        
        return {"answer": answer, "source": source_details, "session_id": session_id}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing database RAG: {str(e)}"
        )
        
@app.post("/clear-conversation", status_code=status.HTTP_200_OK)
async def clear_conversation(request: ClearConversationRequest):
    try:
        session_id = request.session_id
        
        # Save conversation if it exists
        if session_id in conversation_memories:
            saved = save_conversation(session_id, request.conversation_name)
            
            # Clear the memory
            conversation_memories[session_id].clear()
            
            return {"message": "Conversation saved and cleared" if saved else "Conversation cleared"}
        else:
            return {"message": "No conversation found with this session ID"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing conversation: {str(e)}"
        )

@app.get("/profile", response_model=UserProfile)
async def get_profie(id: str = Query(..., description="User ID to retrieve profile for")):
    try:
        # Get profile from database
        response = supabase_client.table("users").select("*").eq("id", id).execute()
        profile = response.data[0] if response.data else None
        
    
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
            
        return UserProfile(
            id=id,
            username=profile["username"],
            diagnosis=profile["diagnosis"],
            prescription=profile["prescription"],
            age=profile["age"],
            gender=profile["gender"],
            ethnicity=profile["ethnicity"],
            updated_at=profile["updated_at"]
        )
    
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting profile: {str(e)}"
        )

@app.put("/profile", response_model=UserProfile)
async def update_profile(profile: UserProfile):
    try:
        if not all([
            profile.id,
            profile.diagnosis,
            profile.prescription,
            profile.age,
            profile.gender,
            profile.ethnicity,
            profile.username
        ]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All fields are required"
            )
            
        # Check if user exists
        response = supabase_client.table("users").select("*").eq("id", profile.id).execute()
        user = response.data[0] if response.data else None
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {profile.id} not found"
            )
        
        # Convert model to dictionary and prepare data for update
        profile_data = profile.model_dump()
        
        # Remove 'user_id' from the data being sent to the database
        # since the database uses 'id' instead of 'user_id'
        user_id = profile_data.pop('id')
        
        # Add updated_at timestamp
        profile_data["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S%z")[:-2]

        # Print the profile data for debugging
        print("Profile data to update:", profile_data)
        print("User data from database:", user)

        # Handle username change if needed
        if user["username"] != profile.username:
            # check if username is taken
            username_check = supabase_client.table("users").select("*").eq("username", profile.username).execute()
            if username_check.data and username_check.data[0]["id"] != user["id"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Update the user profile
        update_response = supabase_client.table("users").update(profile_data).eq("id", user_id).execute()
        print("Update response:", update_response)
        
        # Return the updated profile with the user_id field
        return UserProfile(
            id=user_id,
            username=profile_data["username"],
            diagnosis=profile_data["diagnosis"],
            prescription=profile_data["prescription"],
            age=profile_data["age"],
            gender=profile_data["gender"],
            ethnicity=profile_data["ethnicity"],
            updated_at=profile_data["updated_at"]
        )
    
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Include the traceback in the error detail
        tb = traceback.format_exc()
        print(f"Error updating profile: {str(e)}\n{tb}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}\nTraceback: {tb}"
        )

@app.get("/")
async def root():
    return {"message": "RAG API is running. Use /browser-rag or /database-rag endpoints."}

# User profile endpoint
@app.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user["username"],
        "email": current_user["email"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)