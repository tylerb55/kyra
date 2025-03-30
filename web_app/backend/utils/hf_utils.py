import requests
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def liveness_check():
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
            return False
        elif state == "paused":
            return False
        elif state == "running":
            return True
        else:
            return False
    except Exception as e:
        print(e)
        return False
    
def scale_up():
    """Send a request to scale up the endpoint"""
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

def scale_to_zero():
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
    
if __name__ == "__main__":
    #liveness_check()
    #scale_up()
    scale_to_zero()







    
