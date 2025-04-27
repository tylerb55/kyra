from config import docs, conversations, documents, llm
from db_rag import retrieve_relevant_documents as db_retrieve, format_context_from_records
import json
import re

#print(docs.query("How does smoking affect the lungs?", limit=2, include_metadata=True, include_value=True))



# Retrieve relevant documents from database
#retrieved_records = db_retrieve(
#    "How does smoking affect the lungs?"
#)
#context, source_details = format_context_from_records(retrieved_records)

#print(context)
#print(source_details)

#result = documents.query("I hurts when i try to urinate", limit=2, include_metadata=True, include_value=True)
#print(result)

hardcoded_memory = [
    {"role": "user", "content": "Hi, I was recently diagnosed with asthma and I'm having some issues with my medication."},
    {"role": "assistant", "content": "I'm sorry to hear you're having issues with your asthma medication. Could you tell me more about what problems you're experiencing and what medications you've been prescribed?"},
    {"role": "user", "content": "I was prescribed an albuterol inhaler for rescue and Flovent for daily use. The Flovent seems to make me jittery and I still wake up with tightness in my chest most mornings."},
    {"role": "assistant", "content": "Thank you for sharing that information. Feeling jittery can sometimes be a side effect of inhaled corticosteroids like Flovent, though it's more commonly associated with albuterol. The morning chest tightness suggests your asthma might not be optimally controlled yet."},
    {"role": "user", "content": "Yes, and I also get wheezing after exercise, especially when it's cold outside. Sometimes I cough a lot at night too."},
    {"role": "assistant", "content": "Exercise-induced symptoms and nighttime coughing are common asthma symptoms that indicate your treatment plan might need adjustment. Cold air is a known trigger for many people with asthma. Have you discussed these specific symptoms with your doctor?"},
    {"role": "user", "content": "Not yet, my follow-up appointment is next month. Should I call them sooner?"},
    {"role": "assistant", "content": "Given that you're experiencing persistent symptoms like morning chest tightness, exercise-induced wheezing, and nighttime coughing despite being on controller medication, it would be advisable to contact your healthcare provider sooner rather than waiting for your scheduled appointment. They might want to adjust your medication or dosage."},
    {"role": "user", "content": "OK I'll do that. Do you think they might change my medication completely?"},
    {"role": "assistant", "content": "It's possible they might adjust your current medications or potentially try a different medication. There are several options for asthma control, including different types of inhaled corticosteroids, combination inhalers that include both a corticosteroid and a long-acting bronchodilator, leukotriene modifiers, or other medications. The goal is to find the right treatment that controls your symptoms with minimal side effects."},
    {"role": "user", "content": "I've heard about Symbicort. Is that better than Flovent?"},
    {"role": "assistant", "content": "Symbicort is a combination medication containing both budesonide (a corticosteroid) and formoterol (a long-acting beta-agonist or LABA). Flovent contains only fluticasone (a corticosteroid). Whether Symbicort would be 'better' than Flovent depends entirely on your specific situation and asthma control needs. Combination medications like Symbicort are typically prescribed when a corticosteroid alone isn't providing adequate control. However, I can't recommend specific medications as that decision should be made by your healthcare provider based on your complete medical history and examination."},
    {"role": "user", "content": "Is there anything I can do about the cold air triggering my asthma when I exercise?"},
    {"role": "assistant", "content": "Yes, there are several strategies that might help with cold air-induced asthma symptoms during exercise: 1) Use your rescue inhaler 15-20 minutes before exercising, 2) Wear a face mask or scarf over your mouth and nose to warm the air before it enters your lungs, 3) Try to breathe through your nose rather than your mouth when possible, 4) Warm up gradually before intense exercise, 5) Consider indoor exercise when it's very cold outside. These approaches, combined with proper medication management, can help reduce symptoms."}
]

def extract_json_from_markdown(markdown_text):
    # This regex looks for content between ```json and ``` markers
    pattern = r'```json\s*([\s\S]*?)\s*```'
    
    match = re.search(pattern, markdown_text)
    if match:
        json_str = match.group(1)
        return json_str
    else:
        return None

def save_conversation(session_id, conversation_name=None):
    """
    Save conversation to database with insights about topics, symptoms, and knowledge gaps
    
    Args:
        session_id: The unique session identifier
        conversation_name: Optional name for the conversation
        
    Returns:
        Boolean indicating success
    """
    
    memory = hardcoded_memory
    
    # Create transcript
    transcript = "\n".join([f"{msg['role']}: {msg['content']}" for msg in memory])
    
    # Extract insights using LLM
    full_conversation = "\n".join([f"{msg['role']}: {msg['content']}" for msg in memory])
    
    analysis_prompt = f"""
    Analyze the following conversation and extract:
    1. Main topics discussed (list up to 5)
    2. Any symptoms or problems mentioned (list all)
    3. Topics where the assistant lacked knowledge or couldn't provide a complete answer
    
    Format your response as JSON with the following structure:
    {{
        "topics": ["topic1", "topic2", ...],
        "symptoms_problems": ["symptom1", "problem1", ...],
        "knowledge_gaps": ["gap1", "gap2", ...]
    }}
    
    Conversation:
    {full_conversation}
    """
    
    try:
        # Generate analysis using the LLM
        response = llm.chat.completions.create(
            model="tgi",
            messages=[{"role": "user", "content": analysis_prompt}],
        )
        
        json_content = extract_json_from_markdown(response.choices[0].message.content)
        # Parse the JSON response
        analysis = json.loads(json_content)
        
        return analysis
    except Exception as e:
        print(f"Error generating analysis: {e}")
        return False
    
    
print(save_conversation("test"))
