"use client";

import { ReactNode } from 'react';
import { useInit } from '@/context/InitContext';

interface InitGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function InitGuard({ children, fallback }: InitGuardProps) {
  const { isInitialized, isInitializing, error } = useInit();

  // If still initializing, show loading state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Initializing application...</p>
        </div>
      </div>
    );
  }

  // If there was an error during initialization
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">Initialization Error</h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300">{error.message}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If initialization is complete, render children
  if (isInitialized) {
    return <>{children}</>;
  }

  // If not initialized and fallback is provided, render fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default state - redirect to home
  if (typeof window !== 'undefined') {
    window.location.href = '/';
    return null;
  }
  
  // SSR fallback
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Redirecting to home...</p>
      </div>
    </div>
  );
} 