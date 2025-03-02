import React, { useState, useEffect } from 'react';
import { useSystemPrompt } from '@/app/contexts';

const SystemPrompt = () => {
    const [text, setText] = useState(() => sessionStorage.getItem('systemPrompt') || '');

    useEffect(() => {
      // Load saved text from sessionStorage on component mount
      const savedText = sessionStorage.getItem('systemPrompt');
      if (savedText) {
        setText(savedText);
      }
    }, []);
  
    const handleChange = (e) => {
      setText(e.target.value);
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      // Save text to sessionStorage
      sessionStorage.setItem('systemPrompt', text);
      window.location.reload();
    };

  return (
    <div style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
    <h3>System Prompt:</h3>
      <textarea
        value={text}
        onChange={handleChange}
        style={{ width: '100%', height: '200px', fontSize: '16px', padding: '10px' }}
        placeholder="Enter your text here..."
      />
      <button
        onClick={handleSubmit}
        style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Submit
      </button>
    </div>
  );
};

export default SystemPrompt;
