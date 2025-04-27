'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { fetchProfile, updateProfileAPI } from '../api/profile'
// Account Context
interface AccountDetails {
  // Add the specific properties your account has
  id?: string;
  name?: string;
  email?: string;
  // Add other properties as needed
}

export interface UserProfile {
  id: string;
  username: string;
  diagnosis: string;
  prescription: string;
  age: number | null;
  gender: string;
  ethnicity: string;
}

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const defaultProfile: UserProfile = {
  id: '0',
  username: 'Guest',
  diagnosis: 'None',
  prescription: 'None',
  age: 30,
  gender: 'Male',
  ethnicity: 'White'
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(defaultProfile);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useAuth(); // Your auth context

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching profile for user ID:", userId);
      const data = await fetchProfile(userId);
      setProfile(data);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProfile = await updateProfileAPI(data); // Your API function
      setProfile(updatedProfile);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load profile on initial authentication
  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated, refreshProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refreshProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface AccountContextType {
  accountDetails: AccountDetails | null;
  setAccountDetails: (details: AccountDetails | null) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(() => {
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

interface AuthContextType {
  userId: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(() => {
    // Load from localStorage on initialization (client-side only)
    if (typeof window !== 'undefined') {
      console.log("Loading user ID from localStorage:", localStorage.getItem('userId'));
      return localStorage.getItem('userId');
    }
    return null;
  });
  
  const isAuthenticated = userId !== null;

  const login = (token: string, userId: string) => {
    // Store token in HTTP-only cookie (handled by your API)
    // Store user ID in context and localStorage
    setUserId(userId);
    localStorage.setItem('userId', userId);
  };

  const logout = () => {
    // Clear user ID from context and localStorage
    setUserId(null);
    localStorage.removeItem('userId');
    // API call to invalidate token/session
  };

  return (
    <AuthContext.Provider value={{ userId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


