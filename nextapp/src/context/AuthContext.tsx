"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import leoCognito from '@/lib/leoCognito';
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
  const { isInitialized, isInitializing } = useInit();

  // Update this effect to broadcast authentication changes
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
        
        // Broadcast authentication status for other contexts
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_status', authenticated.toString());
          // Dispatch an event to notify listeners
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'auth_status',
            newValue: authenticated.toString()
          }));
        }
        
        // Log authentication status in development mode
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Auth status: ${authenticated ? 'Authenticated' : 'Anonymous'}`);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        
        // Broadcast authentication failure
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_status', 'false');
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'auth_status',
            newValue: 'false'
          }));
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isInitialized, isInitializing]);

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
    
    // Broadcast sign out to other contexts
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_status', 'false');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth_status',
        newValue: 'false'
      }));
      
      // Refresh the page to reset application state
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