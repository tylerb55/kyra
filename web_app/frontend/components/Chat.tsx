'use client';

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import "../styles/App.css";
import axios from 'axios';
import { Plus, Menu, Send } from "lucide-react";
import Image from 'next/image';
// Define message types
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

// Define saved chat type
interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([
    { id: '1', title: 'Hello and Greeting', messages: [], timestamp: 'Today' },
    { id: '2', title: 'Next.js Project Setup', messages: [], timestamp: 'Today' },
    { id: '3', title: 'Next.js UI Conversion', messages: [], timestamp: 'Today' },
    { id: '4', title: 'Vite to Next.js Migration', messages: [], timestamp: 'Today' },
    { id: '5', title: 'Confusion Matrix Error Debug', messages: [], timestamp: 'Yesterday' },
  ]);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'RAG' | 'Browser'>('RAG');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format current time
  const getFormattedTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Generate a simple ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputText.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      text: inputText,
      sender: 'user',
      timestamp: getFormattedTime()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Make a request to the backend
    if (mode === 'RAG') {
      const response = await axios.post('http://localhost:8000/database-rag', {
        "query": inputText,
        "session_id": sessionId
      });

      setSessionId(response.data.session_id);

      const assistantMessage: Message = {
        id: generateId(),
        text: response.data.answer,
        sender: 'assistant',
        timestamp: getFormattedTime()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } else if (mode === 'Browser') {
      const response = await axios.post('http://localhost:8000/browser-rag', {
        "query": inputText,
        "session_id": sessionId
      });

      setSessionId(response.data.session_id);

      const assistantMessage: Message = {
        id: generateId(),
        text: response.data.answer, //+ "\n\nURL: " + response.url,
        sender: 'assistant',
        timestamp: getFormattedTime()
      };

      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  // Create a new chat (save current and clear)
  const handleNewChat = () => {
    if (messages.length > 0) {
      // Find the first user message to use as title
      const firstUserMessage = messages.find(msg => msg.sender === 'user');
      const chatTitle = firstUserMessage 
        ? firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '')
        : 'New Chat';
      
      // Save current chat
      const newSavedChat: SavedChat = {
        id: generateId(),
        title: chatTitle,
        messages: [...messages],
        timestamp: 'Today'
      };
      
      setSavedChats(prev => [newSavedChat, ...prev]);
    }
    
    // Clear current chat
    setMessages([]);
  };

  // Load a saved chat
  const loadSavedChat = (chatId: string) => {
    const chatToLoad = savedChats.find(chat => chat.id === chatId);
    if (chatToLoad) {
      // Save current chat if it has messages
      if (messages.length > 0) {
        const firstUserMessage = messages.find(msg => msg.sender === 'user');
        const chatTitle = firstUserMessage 
          ? firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '')
          : 'New Chat';
        
        const currentChat: SavedChat = {
          id: generateId(),
          title: chatTitle,
          messages: [...messages],
          timestamp: 'Today'
        };
        
        setSavedChats(prev => [currentChat, ...prev.filter(chat => chat.id !== chatId)]);
      } else {
        // Just remove the loaded chat from saved chats
        setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
      }
      
      // Load the selected chat
      setMessages(chatToLoad.messages);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    
    <div className="flex h-[80vh] w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Sidebar */}
      <div 
        className="transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 h-full"
        style={{ 
          width: sidebarOpen ? '15%' : '0px',
        }}
      >
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            {/* New Chat Button */}
            <div className="p-3">
              <button 
                onClick={handleNewChat}
                className="w-full py-3 px-3 rounded-md border border-gray-200 dark:border-gray-700 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-800 dark:text-gray-200"
              >
                <Plus className="h-4 w-4" />
                New chat
              </button>
            </div>
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto">
              {/* Today Section */}
              <div className="px-3 py-2">
                <h3 className="text-xs text-gray-500 font-medium mb-2 px-3">Today</h3>
                {savedChats
                  .filter(chat => chat.timestamp === 'Today')
                  .map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => loadSavedChat(chat.id)}
                      className="w-full text-left p-3 rounded-md mb-1 hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-800 dark:text-gray-200 text-sm"
                    >
                      {chat.title}
                    </button>
                  ))
                }
              </div>
              
              {/* Yesterday Section */}
              <div className="px-3 py-2">
                <h3 className="text-xs text-gray-500 font-medium mb-2 px-3">Yesterday</h3>
                {savedChats
                  .filter(chat => chat.timestamp === 'Yesterday')
                  .map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => loadSavedChat(chat.id)}
                      className="w-full text-left p-3 rounded-md mb-1 hover:bg-gray-200 dark:hover:bg-gray-800 transition text-gray-800 dark:text-gray-200 text-sm"
                    >
                      {chat.title}
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            {/* Mode Toggle */}
            <div className="ml-4 flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-1" style={{ width: '180px' }}>
              <button 
                onClick={() => setMode('RAG')}
                className={`flex-1 py-1 px-3 text-center rounded-md transition-all duration-300 text-sm ${mode === 'RAG' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`}
              >
                RAG
              </button>
              <button 
                onClick={() => setMode('Browser')}
                className={`flex-1 py-1 px-3 text-center rounded-md transition-all duration-300 text-sm ${mode === 'Browser' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`}
              >
                Browser
              </button>
            </div>
          </div>
        </div>
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 p-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Send a message to chat in {mode} mode</p>
            </div>
          ) : (
            <div className="w-full h-full">
              {messages.map(message => (
                <motion.div 
                key={message.id}
                className={`py-6 ${message.sender === 'assistant' ? '' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-4">
                  <div className={`flex items-start ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.sender === 'assistant' && (
                      <div className="h-8 w-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 self-start mt-1 overflow-hidden">
                        <Image 
                          src="/chat.png" 
                          alt="AI Assistant" 
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`max-w-[75%] ${message.sender === 'user' ? 'bg-gray-100 dark:bg-gray-700 rounded-lg p-4' : ''}`}>
                      <p className="text-gray-800 dark:text-gray-200 font-sans text-base leading-relaxed px-2 py-1">{message.text}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="w-2/3 border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask anything" 
                rows={1}
                className="w-full p-4 pr-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[56px] max-h-[200px] overflow-y-auto"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />
              <button 
                type="submit"
                className="absolute right-3 bottom-3 p-2 rounded-md bg-purple-500 text-white disabled:opacity-50"
                disabled={inputText.trim() === ''}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            <p className="text-xs text-center mt-2 text-gray-500">
              Chat Assistant can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;