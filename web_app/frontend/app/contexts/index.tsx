'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Account Context
interface AccountContextType {
  accountDetails: any | null;
  setAccountDetails: (details: any | null) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [accountDetails, setAccountDetails] = useState<any | null>(() => {
    // Load from localStorage on initialization (client-side only)
    if (typeof window !== 'undefined') {
      const savedAccount = localStorage.getItem('accountDetails');
      return savedAccount ? JSON.parse(savedAccount) : null;
    }
    return null;
  });

  useEffect(() => {
    // Save to localStorage whenever accountDetails changes
    if (accountDetails !== null) {
      localStorage.setItem('accountDetails', JSON.stringify(accountDetails));
    }
  }, [accountDetails]);

  return (
    <AccountContext.Provider value={{ accountDetails, setAccountDetails }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

// System Prompt Context
interface SystemPromptContextType {
  SystemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

const SystemPromptContext = createContext<SystemPromptContextType | undefined>(undefined);

export const SystemPromptProvider = ({ children }: { children: ReactNode }) => {
  const [SystemPrompt, setSystemPrompt] = useState<string>(() => {
    // Load from localStorage on initialization (client-side only)
    if (typeof window !== 'undefined') {
      const savedSystemPrompt = localStorage.getItem('systemPrompt');
      return savedSystemPrompt ? savedSystemPrompt : '';
    }
    return '';
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

export const useSystemPrompt = (): SystemPromptContextType => {
  const context = useContext(SystemPromptContext);
  if (context === undefined) {
    throw new Error('useSystemPrompt must be used within a SystemPromptProvider');
  }
  return context;
};