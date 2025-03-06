import os
from openai import OpenAI
import vecs
from vecs.adapter import Adapter, ParagraphChunker, TextEmbedding
from dotenv import load_dotenv
from collections import deque
import supabase

# Load environment variables
load_dotenv("../.env")

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase_client = supabase.create_client(supabase_url, supabase_key)

# cosine distance threshold
cosine_distance_threshold = 0.4

# Initialize OpenAI client
llm = OpenAI(
    base_url="https://pn3bt077dimy5mo9.us-east-1.aws.endpoints.huggingface.cloud/v1/",
    api_key=os.environ["HUGGINGFACE_API_KEY"]
)

# Postgres connection setup
password = os.getenv("POSTGRES_PASSWORD")
host = "aws-0-us-west-1.pooler.supabase.com"
port = "6543"
db_name = "postgres"

# Create vector store client
vx = vecs.Client(f"postgresql://postgres.ctjqozswmwitgayctdtk:{password}@{host}:{port}/{db_name}")

# Get or create collection with adapter for document storage
docs = vx.get_or_create_collection(
    name="rag_documents",
    adapter=Adapter(
        [
            ParagraphChunker(skip_during_query=True),
            TextEmbedding(model='BAAI/bge-small-en-v1.5'),
        ]
    )
)

# Get or create collection for conversation history
conversations = vx.get_or_create_collection(
    name="conversations",
    dimension=1  # We're not using embeddings for this collection
)

# Global conversation memory
# Using a dictionary to store conversations by session_id
conversation_memories = {}