import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Chat from './Pages/Chat/Chat'
import Login from './Pages/Login/Login'
import Register from './Pages/Register/Register'
import Profile from './Pages/Profile/Profile'
import { createContext, useContext, useEffect, useState } from 'react'

const router = createBrowserRouter([
  {
    path: '/',
    element: <div><Login /></div>
  },
  {
    path: '/register',
    element: <div><Register /></div>
  },
  {
    path: '/chat',
    element: <div><Chat /></div>
  },
  {
    path: '/profile',
    element: <div><Profile /></div>
  }
])

const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
    const [accountDetails, setAccountDetails] = useState(() => {
      // Load from localStorage on initialization
      const savedAccount = localStorage.getItem('accountDetails');
      return savedAccount ? JSON.parse(savedAccount) : null;
    });

    useEffect(() => {
      // Save to localStorage whenever accountDetails changes
      localStorage.setItem('accountDetails', JSON.stringify(accountDetails));
    }, [accountDetails]);

    return (
        <AccountContext.Provider value={{accountDetails, setAccountDetails}}>
            {children}
        </AccountContext.Provider>
    );
};

export const useAccount = () => {
    return useContext(AccountContext);
};

export const SystemPromptContext = createContext();

// Create Provider Component
export const SystemPromptProvider = ({ children }) => {
  const [SystemPrompt, setSystemPrompt] = useState(() => {
    // Load from localStorage on initialization
    const savedSystemPrompt = localStorage.getItem('systemPrompt');
    return savedSystemPrompt ? savedSystemPrompt : '';
  });

  useEffect(() => {
    // Save to localStorage whenever systemPrompt changes
    localStorage.setItem('systemPrompt', SystemPrompt);
  }, [SystemPrompt]);

  return (
    <SystemPromptContext.Provider value={{ SystemPrompt, setSystemPrompt }}>
      {children}
    </SystemPromptContext.Provider>
  );
};

export const useSystemPrompt = () => {
  return useContext(SystemPromptContext);
};

function App() {

  return (
    
    <div>
      <SystemPromptProvider>
        <AccountProvider>
          <RouterProvider router={router} />
        </AccountProvider>
      </SystemPromptProvider>
    </div>    
  )
}

export default App
