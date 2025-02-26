"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useInit } from '@/context/InitContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isInitialized, isInitializing, error: initError } = useInit();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect when both auth check is done and initialization is complete
    if (!authLoading && isInitialized) {
      // Log status in development mode
      if (process.env.NODE_ENV !== 'production') {
        console.log('Initialization complete, redirecting to dashboard');
        console.log('Auth state:', isAuthenticated ? 'Authenticated' : 'Anonymous');
      }
      
      setIsRedirecting(true);
      
      // Always redirect to dashboard regardless of auth state
      // Identity Pool will handle anonymous access
      router.push('/dashboard');
    }
  }, [authLoading, isInitialized, isAuthenticated, router]);

  // Show initialization error if one occurred
  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Initialization Error
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {initError.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading state while determining where to redirect
  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          EventBus UI
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isInitializing 
            ? "Initializing application services..." 
            : isRedirecting 
              ? "Redirecting to dashboard..." 
              : "Loading..."}
        </p>
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-500 text-left p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-auto max-w-full">
            <p>Init Status: {isInitialized ? "✅ Initialized" : "⏳ Pending"}</p>
            <p>Auth Status: {authLoading ? "⏳ Checking" : isAuthenticated ? "✅ Authenticated" : "ℹ️ Anonymous"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
