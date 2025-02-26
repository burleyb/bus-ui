"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import leoCognito from '@/lib/leoCognito';
import { initializeCognito } from '@/lib/authUtils';

interface InitContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  reinitialize: () => Promise<void>;
}

const InitContext = createContext<InitContextType | undefined>(undefined);

export function useInit() {
  const context = useContext(InitContext);
  if (context === undefined) {
    throw new Error('useInit must be used within an InitProvider');
  }
  return context;
}

interface InitProviderProps {
  children: ReactNode;
}

export function InitProvider({ children }: InitProviderProps) {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const initialize = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      // Initialize Cognito Identity Pool
      await initializeCognito();
      
      // Log successful initialization in development mode
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Application services initialized successfully');
      }
      
      setIsInitialized(true);
    } catch (err) {
      console.error('Error during application initialization:', err);
      setError(err instanceof Error ? err : new Error('Unknown initialization error'));
    } finally {
      setIsInitializing(false);
    }
  };

  // Run initialization on first mount
  useEffect(() => {
    initialize();
  }, []);

  const reinitialize = async () => {
    setIsInitialized(false);
    await initialize();
  };

  return (
    <InitContext.Provider
      value={{
        isInitialized,
        isInitializing,
        error,
        reinitialize
      }}
    >
      {children}
    </InitContext.Provider>
  );
} 