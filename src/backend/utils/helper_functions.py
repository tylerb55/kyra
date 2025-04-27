import re

def extract_json_from_markdown(markdown_text):
    # This regex looks for content between ```json and ``` markers
    pattern = r'```json\s*([\s\S]*?)\s*```'
    
    match = re.search(pattern, markdown_text)
    if match:
        json_str = match.group(1)
        return json_str
    else:
        return None