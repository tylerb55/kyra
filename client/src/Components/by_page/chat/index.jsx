import React, { useEffect } from 'react';
import {
  MultiselectCarousel,
  MultiselectCheckbox,
} from './extensions'; // Adjust the path accordingly
import { useState } from 'react';

function system_prompt(patient_name, diagnosis, prescription, appointment, notes) {
  return `You are a friendly healthcare companion. Your patient, ${patient_name}, has been diagnosed with ${diagnosis} and has a prescription for ${prescription}. Their next appointment is ${appointment}. They will ask you for information relating to their diagnosis, prescription, and care plan. Your purpose is to use your knowledge base and the patient’s medical record ${notes} to support them to understand and manage their health with a positive and informed approach to navigating their healthcare journey. Critically, ensure that they understand clinical language.

Follow these guidelines for what language to use when answering queries:
1. Use everyday language that is easy to understand
2. Provide clear, concise, professional, and empathetic explanations
3. Do not use sorrow or pitiful language. Do not apologise in the response. 
4. Offer analogies or examples when helpful but be sensitive and considerate to the severity of the patient’s situation. 
5. If a technical term is necessary, provide a simple definition. 
6. Assume the patient has no medical background and aim to educate without overwhelming. 
7. Ensure information is accurate to the source
8. Use gender inclusive language
9. In your answers, refer to the patient by their name.
`;
}

function Chat({ accountDetails }) {
  const [text, setText] = useState(() => sessionStorage.getItem('systemPrompt') || '');

  if (text === '') {
    setText(system_prompt(accountDetails.data.patient_name, accountDetails.data.diagnosis, accountDetails.data.prescription, accountDetails.data.appointment, accountDetails.data.notes)); 
    sessionStorage.setItem('systemPrompt', text);
  }

  useEffect(() => {
    // Import the script and execute the voiceflow code on component load
    const script = document.createElement('script');
    script.src = 'https://cdn.voiceflow.com/widget/bundle.mjs';
    script.type = 'text/javascript';

    script.onload = () => {
        window.voiceflow.chat.load({
            verify: { projectID: '665133c2663b2c6358d3e75a'},
            url: 'https://general-runtime.voiceflow.com',
            versionID: 'production',
            userID: accountDetails ? accountDetails.data.id : '1234',
            launch: {
              event: {
                type: "launch",
                payload: {
                  user_group: accountDetails.data.user_group,
                  patient_name: accountDetails.data.patient_name,
                  prescription: accountDetails.data.prescription,
                  diagnosis: accountDetails.data.diagnosis,
                  notes: accountDetails.data.notes,
                  phone: accountDetails.data.phone_number,
                  system_prompt: text,              
                }
              }
            },
            render: {
            mode: 'embedded',
            target: document.getElementById('voiceflow-chat-frame'),
        },
        autostart: true,
        allowDangerousHTML: true,
        assistant: {
          extensions: [
            MultiselectCarousel,
            MultiselectCheckbox,
          ],
        },
      });
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div className='chatDiv'>
      <div id="voiceflow-chat-frame"></div>
    </div>
  );
}

export default Chat;
