import { Message } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function sendMessage(
  message: string, 
  mode: 'RAG' | 'Browser', 
  token: string,
  urls?: string[]
) {
  const endpoint = mode === 'RAG' ? '/database-rag' : '/browser-rag';
  
  const payload = mode === 'RAG' 
    ? { query: message, collection_name: 'medical' }
    : { query: message, urls: urls || [] };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get response');
  }
  
  return response.json();
}