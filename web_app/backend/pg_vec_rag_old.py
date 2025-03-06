import vecs
from vecs.adapter import Adapter, ParagraphChunker, TextEmbedding
import json
import os
from dotenv import load_dotenv

load_dotenv("../.env")

password = os.getenv("POSTGRES_PASSWORD")
host = "aws-0-us-west-1.pooler.supabase.com"
port = "6543"
db_name = "postgres"
# create vector store client
vx = vecs.Client(f"postgresql://postgres.ctjqozswmwitgayctdtk:{password}@{host}:{port}/{db_name}")

# create a collection with an adapter
docs = vx.get_or_create_collection(
    name="rag_documents",
    adapter=Adapter(
        [
            ParagraphChunker(skip_during_query=True),
            TextEmbedding(model='BAAI/bge-small-en-v1.5'),
        ]
    )
)

# Query using cosine similarity
result = docs.query("What hormone therapy is there?", limit=5, include_metadata=True, include_value=True)

context_str = ""
for i, record in enumerate(result):
    cosine_distance = record[1]   
    if cosine_distance < 0.4:
        # Extract text from the record
        text = record[2].get('text', str(record))
        context_str += f"Document {i+1}:\n{text}\n\n"
print(context_str)