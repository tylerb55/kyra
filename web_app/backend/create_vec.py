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


with open('cancer_info.jsonl', 'r') as file:
    data = json.load(file)
    
records = [(record['id'], record['text'], {"title": record['document'], "text": record["text"], "source": record['source'], "author": record['author']}) for record in data]

docs.upsert(
    records=records
)