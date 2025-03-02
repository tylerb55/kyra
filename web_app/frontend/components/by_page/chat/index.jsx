import React, { useEffect } from 'react';
import {
  MultiselectCarousel,
  MultiselectCheckbox,
} from './extensions'; // Adjust the path accordingly
import { useState } from 'react';


function system_prompt(patient_name, diagnosis, prescription, appointment, notes) {
  return `You are a friendly healthcare companion. Your patient, ${patient_name}, has been diagnosed with ${diagnosis} and has a prescription for ${prescription}. Their next appointment is ${appointment}. They will ask you for information relating to their diagnosis, prescription, and care plan. Your purpose is to use your knowledge base and the patient's medical record ${notes} to support them to understand and manage their health with a positive and informed approach to navigating their healthcare journey. Critically, ensure that they understand clinical language.

Follow these guidelines for what language to use when answering queries:
1. Use everyday language that is easy to understand
2. Provide clear, concise, professional, and empathetic explanations
3. Do not use sorrow or pitiful language. Do not apologise in the response. 
4. Offer analogies or examples when helpful but be sensitive and considerate to the severity of the patient's situation. 
5. If a technical term is necessary, provide a simple definition. 
6. Assume the patient has no medical background and aim to educate without overwhelming. 
7. Ensure information is accurate to the source
8. Use gender inclusive language
9. In your answers, refer to the patient by their name.
`;
}

function Chat({ accountDetails }) {
  const [text, setText] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Handle sessionStorage and prompt generation only on client side
  useEffect(() => {
    if (isClient) {
      // Try to get saved prompt from sessionStorage
      const savedPrompt = window.sessionStorage.getItem('systemPrompt') || '';
      
      if (savedPrompt) {
        setText(savedPrompt);
      } else if (accountDetails?.data) {
        // Generate new prompt if no saved prompt exists
        const newPrompt = system_prompt(
          accountDetails.data.patient_name,
          accountDetails.data.diagnosis,
          accountDetails.data.prescription,
          accountDetails.data.appointment,
          accountDetails.data.notes
        );
        setText(newPrompt);
        window.sessionStorage.setItem('systemPrompt', newPrompt);
      }
    }
  }, [isClient, accountDetails]);

  return (
    <div className='chatDiv'>
    </div>
  );
}

export default Chat;
