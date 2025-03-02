'use client';

import React, { useState, useRef, useEffect } from "react";
import Header from '@/components/global/header';
import Footer from '@/components/global/footer';
import { useAccount } from '@/app/contexts';
import { motion } from "framer-motion";
import "../styles/App.css";

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
  const { accountDetails } = useAccount();

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
  const handleSendMessage = (e: React.FormEvent) => {
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
    
    // Simulate assistant response after a short delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: generateId(),
        text: `Thanks for your message: "${inputText}"`,
        sender: 'assistant',
        timestamp: getFormattedTime()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
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
    
    <div className="flex h-screen bg-white dark:bg-gray-800">
      {/* Sidebar */}
      <div 
        className="transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        style={{ 
          width: sidebarOpen ? '260px' : '0px',
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
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
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Send a message to start chatting in {mode} mode</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map(message => (
                <motion.div 
                  key={message.id}
                  className={`py-6 ${message.sender === 'assistant' ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-start">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-4 ${
                        message.sender === 'user' 
                          ? 'bg-gray-200 dark:bg-gray-700' 
                          : 'bg-purple-500'
                      }`}>
                        {message.sender === 'user' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 dark:text-gray-200">{message.text}</p>
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
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask anything" 
                className="w-full p-4 pr-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button 
                type="submit"
                className="absolute right-3 top-3 p-2 rounded-md bg-purple-500 text-white disabled:opacity-50"
                disabled={inputText.trim() === ''}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
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