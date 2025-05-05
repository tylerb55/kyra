'use client';

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import "../styles/App.css";
import axios from 'axios';
import { Plus, Menu, Send } from "lucide-react";
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
// Import Shadcn Select components
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Adjust path if needed
import { useAuth } from "@/app/contexts";

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

// Define the type for source items
interface SourceItem {
  citationId?: number | string;
  title?: string;
  source?: string; // This property holds the URL/source identifier
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'RAG' | 'Browser'>('RAG');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLlmActive, setIsLlmActive] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isTranscriptSaved, setIsTranscriptSaved] = useState(true);
  // auth context
  const { userId } = useAuth();
  // Add state for the selected model
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash-preview-04-17');

  // function to save transcript
  const saveTranscript = async (chatMessages: Message[], title: string) => {
    console.log(JSON.stringify({
      id: sessionId || "",
      title: title,
      messages: chatMessages,
      timestamp: new Date().toISOString(),
      mode: mode
    }))
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/save-transcript`, {
        id: sessionId || "",
        title: title,
        messages: chatMessages,
        timestamp: new Date().toISOString(),
        mode: mode
      });
      setIsTranscriptSaved(true);
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };

  // Mark transcript as unsaved when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setIsTranscriptSaved(false);
    }
  }, [messages]);

  // Save transcript on page unload if it is unsaved
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isTranscriptSaved && messages.length > 0) {
        const firstUserMessage = messages.find(msg => msg.sender === 'user');
        const chatTitle = firstUserMessage 
          ? firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '')
          : 'New Chat';

        // Use synchronous API to ensure it runs before page unload
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/save-transcript`,
          JSON.stringify({
            id: sessionId || "",
            title: chatTitle,
            messages: [...messages],
            timestamp: new Date().toISOString(),
            mode: mode
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [messages, isTranscriptSaved, mode, sessionId]);

  // Check LLM status *only* if Qwen model is selected
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkLlmStatus = async () => {
      // This function only runs if model is Qwen
      setIsCheckingStatus(true);
      // Assume inactive until proven otherwise for Qwen
      // setIsLlmActive(false); // Optional: uncomment if you want it to appear inactive during check
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/liveness-check`);
        setIsLlmActive(response.data.active);
        // If LLM is not active and not initializing, scale up (only relevant for Qwen)
        if (!response.data.active && response.data.status !== "initializing") {
          await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/scale-up`);
        }
      } catch (error) {
        console.error('Error checking Qwen LLM status:', error);
        setIsLlmActive(false); // Set inactive on error
      } finally {
        setIsCheckingStatus(false);
      }
    };

    if (selectedModel === 'qwen-2.5-7b') {
      console.log("Qwen model selected, checking status...");
      // Start checking for Qwen
      checkLlmStatus(); // Check immediately
      intervalId = setInterval(checkLlmStatus, 15000); // Check periodically
    } else {
      // For Gemini or other non-Qwen models, assume active immediately
      console.log("Non-Qwen model selected, setting active.");
      setIsLlmActive(true);
      setIsCheckingStatus(false);
    }

    // Cleanup function: clear interval when component unmounts or model changes
    return () => {
      if (intervalId) {
        console.log("Clearing Qwen status check interval.");
        clearInterval(intervalId);
      }
    };
  }, [selectedModel]); // Re-run this effect when the selected model changes

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

    if (inputText.trim() === '' || !isLlmActive) return; // Also check if LLM is active

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      text: inputText,
      sender: 'user',
      timestamp: getFormattedTime()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Determine the endpoint based on the mode
    const endpoint = mode === 'RAG' ? 'database-rag' : 'browser-rag';
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${endpoint}`;

    try {
      // Make a request to the backend, including the selected model
      const response = await axios.post(url, {
        "query": userMessage.text, // Use the text from the userMessage object
        "user_id": userId,
        "session_id": sessionId,
        "model": selectedModel // Send the selected model
      });

      // Update session ID if it's new
      if (response.data.session_id && response.data.session_id !== sessionId) {
          setSessionId(response.data.session_id);
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: generateId(),
        text: response.data.answer,
        sender: 'assistant',
        timestamp: getFormattedTime()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add source message if present
      if (response.data.source && Array.isArray(response.data.source) && response.data.source.length > 0) {
          const source = response.data.source;
          // Adjust source string formatting for Markdown
          const sourceString = source.map((item: SourceItem, index: number) => {
              const citationId = item.citationId || (index + 1);
              const title = item.title || 'Unknown Title';
              const sourceUrl = item.source || 'Unknown Source';
              // Format with Markdown: bold title
              return `[${citationId}] **${title}** (${sourceUrl})`;
          }).join('  \n'); // Join with TWO spaces and a newline for a hard break

          if (sourceString.trim() !== '') {
              const sourceMessage: Message = {
                  id: generateId(),
                  // Prepend "Sources:\n" - add two spaces here too for a break after the title
                  text: `Sources:  \n${sourceString}`,
                  sender: 'assistant',
                  timestamp: getFormattedTime()
              };
              setMessages(prev => [...prev, sourceMessage]);
          }
      }

    } catch (error) {
        console.error('Error sending message:', error);
        // Optionally add an error message to the chat
        const errorMessage: Message = {
            id: generateId(),
            text: "Sorry, I encountered an error trying to get a response.",
            sender: 'assistant',
            timestamp: getFormattedTime()
        };
        setMessages(prev => [...prev, errorMessage]);
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

      // Save transcript
      saveTranscript(messages, chatTitle);
      
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
    setSessionId(null);
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

  // Determine if the main chat area should be disabled
  const isChatDisabled = !isLlmActive && selectedModel === 'qwen-2.5-7b';

  return (
    // Add opacity/pointer-events only if Qwen is selected and inactive
    <div className={`flex h-[80vh] w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${isChatDisabled ? 'opacity-70 pointer-events-none' : ''}`}>
      {/* Overlay only if Qwen is selected and inactive */}
      {isChatDisabled && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
          <div className="bg-gray-800 bg-opacity-75 text-white px-6 py-4 rounded-lg shadow-lg">
            {isCheckingStatus ? (
              <p>Checking Qwen LLM status...</p>
            ) : (
              <p>Qwen LLM service is currently scaling up or unavailable. Please wait...</p>
            )}
          </div>
        </div>
      )}
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
                <h3 className="text-xs text-gray-500 font-medium mb-2 px-3"></h3>
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
          <div className="flex items-center gap-2"> {/* Added gap for spacing */}
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

            {/* Model Selector */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px] bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available</SelectLabel>
                  <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                  <SelectItem value="gemini-2.5-flash-preview-04-17">gemini-2.5-flash</SelectItem>
                  <SelectItem value="qwen-2.5-7b">qwen-2.5-7b</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Unavailable</SelectLabel>
                  <SelectItem value="gpt-4.1" disabled>gpt-4.1</SelectItem>
                  <SelectItem value="gpt-o3" disabled>gpt-o3</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Messages Container */}
        <div className="flex-1 w-full overflow-y-auto bg-white dark:bg-gray-800 p-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Send a message to chat in {mode} mode</p>
            </div>
          ) : (
            <div className="w-full h-full">
              {messages.map(message => (
                <motion.div
                  key={message.id}
                  className="py-6 w-full"
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
                      <div className={`max-w-xl px-4 py-3 rounded-lg shadow ${
                        message.sender === 'user'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {message.sender === 'assistant' ? (
                          <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown>
                              {message.text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p>{message.text}</p>
                        )}
                        <span className="block text-xs mt-1 opacity-70 text-right">
                          {message.timestamp}
                        </span>
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
        <div className="w-2/3 border-t border-gray-200 dark:border-gray-700 p-4 self-center">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                // Update placeholder based on active status and model
                placeholder={
                    isLlmActive
                        ? `Send a message (${selectedModel})`
                        : selectedModel === 'qwen-2.5-7b'
                            ? 'Qwen LLM service unavailable...'
                            : `Send a message (${selectedModel})` // Should be active if not Qwen
                }
                rows={1}
                className="w-full p-4 pr-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[56px] max-h-[200px] overflow-y-auto"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
                // Disable input if the selected model is Qwen and it's not active
                disabled={!isLlmActive && selectedModel === 'qwen-2.5-7b'}
              />
              <button
                type="submit"
                className="absolute right-3 bottom-3 p-2 rounded-md bg-purple-500 text-white disabled:opacity-50"
                // Disable button if LLM not active OR input is empty
                disabled={!isLlmActive || inputText.trim() === ''}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            <p className="text-xs text-center mt-2 text-gray-500">
              {/* Update footer message based on active status and model */}
              {isLlmActive
                ? 'Chat Assistant can make mistakes. Check important info.'
                : selectedModel === 'qwen-2.5-7b'
                    ? 'Qwen LLM service unavailable. Please wait...'
                    : 'Chat Assistant ready.' // Should be active if not Qwen
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;