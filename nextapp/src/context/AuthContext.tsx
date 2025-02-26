"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import leoCognito from '@/lib/leoCognito';
import { useAppContext } from './AppContext';
import { useInit } from './InitContext';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  signOut: () => void;
  getAwsCredentials: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const { dispatch } = useAppContext();
  const { isInitialized, isInitializing } = useInit();

  // Check authentication status when initialization is complete
  useEffect(() => {
    // Skip auth check if initialization is not complete
    if (isInitializing || !isInitialized) {
      return;
    }
    
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if we're authenticated (have valid credentials)
        const authenticated = await leoCognito.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        // Update app context authentication state
        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: authenticated
        });
        
        // Log authentication status in development mode
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Auth status: ${authenticated ? 'Authenticated' : 'Anonymous'}`);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [dispatch, isInitialized, isInitializing]);

  // Get AWS credentials
  const getAwsCredentials = async () => {
    try {
      return await leoCognito.getAwsCredentials();
    } catch (error) {
      console.error('Error getting AWS credentials:', error);
      throw error;
    }
  };

  // Sign out function
  const signOut = () => {
    leoCognito.signOut();
    setIsAuthenticated(false);
    setUser(null);
    
    dispatch({
      type: 'SET_AUTHENTICATED',
      payload: false
    });
    
    // Refresh the page to reset application state
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        signOut,
        getAwsCredentials
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 