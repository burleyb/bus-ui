'use client'

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    // Only attempt authentication once if not already authenticated and not loading
    if (!isLoading && !isAuthenticated && !authAttempted) {
      setAuthAttempted(true);
      signIn().catch(error => {
        console.error('Authentication failed:', error);
      });
    }
  }, [isAuthenticated, isLoading, signIn, authAttempted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Getting AWS credentials...</p>
        </div>
      </div>
    );
  }

  // If authentication was attempted but failed, show error
  if (!isAuthenticated && authAttempted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-red-50 p-6 rounded-lg border border-red-200 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to get AWS credentials</h2>
          <p className="text-gray-600 mb-4">
            We couldn't get the required AWS credentials to access the application.
          </p>
          <button
            onClick={() => {
              setAuthAttempted(false); // Reset the attempt flag to try again
              signIn();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 