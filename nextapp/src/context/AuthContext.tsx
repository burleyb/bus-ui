'use client'

import React, { createContext, useContext, ReactNode } from 'react';
import { useAwsAuth } from '@/hooks/useAwsAuth';
import type { AwsCredentials } from '@/lib/leoCognito';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  credentials: AwsCredentials | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCredentials: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAwsAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 