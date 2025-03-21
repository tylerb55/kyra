from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
import os
from dotenv import load_dotenv
import traceback
import requests
# Import local modules
from models import *
from browser_rag import query_browser, create_vector_index, browser_retrieve, format_context_from_nodes
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
    allow_origins=["https://kyra-sand.vercel.app"], # kyra-sand.vercel.app in production
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
        documents = query_browser(request.query)
        if not documents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Search query returned no results"
            )
        # Create vector index
        index = create_vector_index(documents)
        
        # Retrieve relevant documents
        retrieved_nodes = browser_retrieve(index, request.query)
        context, source_details = format_context_from_nodes(retrieved_nodes)
        
        # Generate response
        answer = answer_query_with_context(request.query, context, memory, username=os.getenv("username"), age=os.getenv("age"), gender=os.getenv("gender"), diagnosis=os.getenv("diagnosis"), prescription=os.getenv("prescription"))
        
        return {"answer": answer, "source": source_details, "session_id": session_id}
    
    except Exception as e:
        logging.error(f"Error processing browser RAG: {str(e)} \n{traceback.format_exc()}")
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
        answer = answer_query_with_context(request.query, context, memory, username=os.getenv("username"), age=os.getenv("age"), gender=os.getenv("gender"), diagnosis=os.getenv("diagnosis"), prescription=os.getenv("prescription"))
        
        return {"answer": answer, "source": source_details, "session_id": session_id}
    
    except Exception as e:
        logging.error(f"Error processing database RAG: {str(e)} \n{traceback.format_exc()}")
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
        logging.error(f"Error clearing conversation: {str(e)} \n{traceback.format_exc()}")
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
        if profile:
            # Set default environment variables
            os.environ["username"] = profile["username"]
            os.environ["age"] = str(profile["age"])
            os.environ["gender"] = profile["gender"]
            os.environ["diagnosis"] = profile["diagnosis"]
            os.environ["prescription"] = profile["prescription"]
        
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
        logging.error(f"Error getting profile: {str(e)} \n{traceback.format_exc()}")
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
        
        if update_response.data:
            # Update environment variables
            os.environ["username"] = profile_data["username"]
            os.environ["age"] = str(profile_data["age"])
            os.environ["gender"] = profile_data["gender"]
            os.environ["diagnosis"] = profile_data["diagnosis"]
            os.environ["prescription"] = profile_data["prescription"]
        
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
        logging.error(f"Error updating profile: {str(e)} \n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )

@app.get("/liveness-check")
async def liveness_check():
    base_url = "https://api.endpoints.huggingface.cloud"
    namespace = "tylerbunsie"
    name = "qwen2-5-7b-instruct"
    key = os.getenv("HUGGINGFACE_API_KEY")
    headers = {
        "Authorization": f"Bearer {key}"
    }
    try:
        response = requests.get(f"{base_url}/v2/endpoint/{namespace}/{name}", headers=headers)
        print(response.json())
        state = response.json()["status"]["state"]
        
        if state == "scaledToZero":
            return {"status": "scaledToZero", "active": False}
        elif state == "paused":
            return {"status": "paused", "active": False}
        elif state == "initializing":
            return {"status": "initializing", "active": False}
        elif state == "running":
            return {"status": "running", "active": True}
        else:
            return {"status": "unknown", "active": False}
    except Exception as e:
        print(e)
        return {"status": "unknown", "active": False}

@app.get("/scale-up")
async def scale_up():
    llm = OpenAI(
        base_url="https://pn3bt077dimy5mo9.us-east-1.aws.endpoints.huggingface.cloud/v1/",
        api_key=os.environ["HUGGINGFACE_API_KEY"]
    )
    
    messages = [{"role": "system", "content": "Scaling up the llm endpoint. Respond with OK"}]  
    response = llm.chat.completions.create(
        model="tgi",  # Using the model specified in your environment
        messages=messages,
        max_tokens=5
    )
    return True

@app.get("/scale-to-zero")
async def scale_to_zero():
    """Call the endpoint to scale to zero"""
    base_url = "https://api.endpoints.huggingface.cloud"
    namespace = "tylerbunsie"
    name = "qwen2-5-7b-instruct"
    key = os.getenv("HUGGINGFACE_API_KEY")
    headers = {
        "Authorization": f"Bearer {key}"
    }
    
    try:
        response = requests.post(f"{base_url}/v2/endpoint/{namespace}/{name}/scale-to-zero", headers=headers)
        print(response.json())
        return True
    except Exception as e:
        print(e)
        return False

def make_system_prompt():
    return f"""You are a expert medical professional. You are tasked with giving
    safe and accurate medical information. The context provided to you is directly from your knowledge base.
    If the user asks a medical question and the context does not contain relevant information, you should say 
    "I can't find that information in my knowledge base." Then try to give a general answer.
    
    Provide concise, and professional language while maintaining a warm and empathetic approach.
    Do not use sorrow or pitiful language. Do not apologise in the response.
    Do not bring up death, short survival time, or that there is no cure unless the user specifically asks about these.
    Offer analogies or examples when helpful but be sensitive and considerate to the severity of the patient’s situation - 
    contextualise if a response could be interpreted as belittling the user's experience.
    If a technical term is necessary, provide a simple definition.
    Assume the patient has no medical background and aim to educate without overwhelming.
    
    You are speaking with {os.getenv('username')}. A {os.getenv('age')} year old {os.getenv('gender')} diagnosed with {os.getenv('diagnosis')} and prescribed {os.getenv('prescription')}."""


@app.get("/system-prompt")
async def get_system_prompt():
    try:
        if os.getenv("system_prompt") is None:
            os.environ["system_prompt"] = make_system_prompt()
        return {"system_prompt": os.getenv("system_prompt")}
    except Exception as e:
        logging.error(f"Error getting system prompt: {str(e)} \n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting system prompt: {str(e)}"
        )

@app.post("/system-prompt")
async def update_system_prompt(system_prompt: str = Query(..., description="The system prompt to set")): 
    try:
        os.environ["system_prompt"] = system_prompt
        return {"system_prompt": os.getenv("system_prompt")}
    except Exception as e:
        logging.error(f"Error updating system prompt: {str(e)} \n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating system prompt: {str(e)}"
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