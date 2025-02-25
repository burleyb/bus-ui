import { useState, useEffect, useCallback, useRef } from 'react';
import { isAuthenticated, signIn, signOut, getAwsCredentials } from '@/lib/awsAuth';
import type { AwsCredentials } from '@/lib/leoCognito';

interface UseAwsAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  credentials: AwsCredentials | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCredentials: () => Promise<void>;
}

/**
 * Hook for AWS authentication
 * Provides authentication state and methods for signing in and out
 */
export function useAwsAuth(): UseAwsAuthResult {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    isLoading: boolean;
    error: Error | null;
    credentials: AwsCredentials | null;
  }>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    credentials: null
  });
  
  // Use a ref to track if initial authentication has been performed
  const initialAuthPerformed = useRef(false);

  const checkAuth = useCallback(async () => {
    // Skip if we've already performed initial authentication
    if (initialAuthPerformed.current && authState.isAuthenticated) {
      return;
    }
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const authenticated = await isAuthenticated();
      
      let credentials = null;
      if (authenticated) {
        // Use getAwsCredentials directly from awsAuth
        credentials = await getAwsCredentials();
      }
      
      setAuthState({
        isAuthenticated: authenticated,
        isLoading: false,
        error: null,
        credentials
      });
      
      // Mark initial authentication as complete
      initialAuthPerformed.current = true;
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Authentication check failed'),
        credentials: null
      });
    }
  }, [authState.isAuthenticated]);

  // Check authentication on mount only
  useEffect(() => {
    if (!initialAuthPerformed.current) {
      checkAuth();
    }
  }, [checkAuth]);

  // Handle sign in
  const handleSignIn = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await signIn();
      await checkAuth();
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Sign in failed')
      }));
    }
  }, [checkAuth]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        credentials: null
      });
      
      // Reset the initial auth flag so we'll check again on next sign in
      initialAuthPerformed.current = false;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Sign out failed')
      }));
    }
  }, []);

  // Refresh credentials
  const refreshCredentials = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Use getAwsCredentials directly from awsAuth
      const credentials = await getAwsCredentials();
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        credentials,
        isAuthenticated: true
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to refresh credentials')
      }));
    }
  }, []);

  return {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    credentials: authState.credentials,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshCredentials
  };
}

export default useAwsAuth; 