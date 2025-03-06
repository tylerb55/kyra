import requests
import os
from dotenv import load_dotenv

load_dotenv("../.env")



from openai import OpenAI

client = OpenAI(
		base_url = "https://pn3bt077dimy5mo9.us-east-1.aws.endpoints.huggingface.cloud/v1/",
		api_key = os.environ["HUGGINGFACE_API_KEY"]
	)

chat_completion = client.chat.completions.create(
	model="tgi",
	messages=[
	{
		"role": "user",
		"content": "What is deep learning?"
	}
],
	top_p=None,
	temperature=None,
	max_tokens=150,
	stream=True,
	seed=None,
	stop=None,
	frequency_penalty=None,
	presence_penalty=None
)

for message in chat_completion:
	print(message.choices[0].delta.content, end = "")