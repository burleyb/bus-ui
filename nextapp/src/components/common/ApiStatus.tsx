'use client'

import { useEffect, useState } from 'react';
import { checkApiConnection } from '@/lib/apiUtils';
import { API_BASE_URL } from '@/config';
import { isAuthenticated, signIn } from '@/lib/awsAuth';

interface ApiStatusState {
  isConnected: boolean | null;
  hasCredentials: boolean | null;
  error: string | null;
}

export default function ApiStatus() {
  const [status, setStatus] = useState<ApiStatusState>({
    isConnected: null,
    hasCredentials: null,
    error: null
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      // Check API connection
      const connected = await checkApiConnection();
      
      // Check AWS credentials
      let hasCredentials = false;
      let error = null;
      
      try {
        hasCredentials = await isAuthenticated();
      } catch (err) {
        hasCredentials = false;
        error = err instanceof Error ? err.message : 'Failed to get AWS credentials';
        console.error('Error getting AWS credentials:', err);
      }
      
      setStatus({
        isConnected: connected,
        hasCredentials,
        error
      });
    } catch (error) {
      setStatus({
        isConnected: false,
        hasCredentials: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Error checking API status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (status.isConnected === null) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-pulse h-2 w-2 rounded-full bg-gray-400"></div>
        <span className="text-xs">Checking API connection...</span>
      </div>
    );
  }

  // If connected but no credentials
  if (status.isConnected && status.hasCredentials === false) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
        <span className="text-xs text-yellow-600">API Connected (Auth Failed)</span>
        <button
          onClick={() => signIn().then(checkStatus)}
          disabled={isChecking}
          className="text-xs text-blue-500 hover:text-blue-700 disabled:text-gray-400"
          title={status.error || 'Authentication failed'}
        >
          {isChecking ? 'Checking...' : 'Sign In'}
        </button>
      </div>
    );
  }

  // If fully connected with credentials
  if (status.isConnected && status.hasCredentials) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        <span className="text-xs text-green-600">API Connected</span>
      </div>
    );
  }

  // If disconnected
  return (
    <div className="flex items-center space-x-2">
      <div className="h-2 w-2 rounded-full bg-red-500"></div>
      <span className="text-xs text-red-600">API Disconnected</span>
      <button
        onClick={checkStatus}
        disabled={isChecking}
        className="text-xs text-blue-500 hover:text-blue-700 disabled:text-gray-400"
        title={`Retry connection to ${API_BASE_URL}`}
      >
        {isChecking ? 'Checking...' : 'Retry'}
      </button>
    </div>
  );
} 