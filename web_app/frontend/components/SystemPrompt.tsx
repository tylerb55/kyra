'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://kyra-backend.onrender.com';

const SystemPrompt = () => {
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the system prompt when component mounts
  useEffect(() => {
    const fetchSystemPrompt = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/system-prompt`);
        console.log(response.data);
        setSystemPrompt(response.data.system_prompt);
        setOriginalPrompt(response.data.system_prompt);
      } catch (err) {
        console.error('Failed to fetch system prompt:', err);
        setError('Failed to load system prompt. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemPrompt();
  }, []);

  // Check if there are unsaved changes
  const hasUnsavedChanges = systemPrompt !== originalPrompt;

  // Handle saving the system prompt
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/system-prompt?system_prompt=${encodeURIComponent(systemPrompt.trim())}`);
      setOriginalPrompt(systemPrompt);
    } catch (err) {
      console.error('Failed to save system prompt:', err);
      // Log more details about the error response
      if (axios.isAxiosError(err) && err.response) {
        console.error('Error response data:', err.response.data);
        setError(`Failed to save: ${err.response.data.detail || 'Please try again later.'}`);
      } else {
        setError('Failed to save system prompt. Please try again later.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Prompt user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">System Prompt</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded">
          {error}
          <button 
            className="ml-2 underline"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                        bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
                        focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter system prompt here..."
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              {hasUnsavedChanges && (
                <span className="text-amber-600 dark:text-amber-400">
                  You have unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSystemPrompt(originalPrompt)}
                disabled={!hasUnsavedChanges || isSaving}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                          rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition
                          disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg 
                          hover:bg-purple-700 transition
                          disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemPrompt;