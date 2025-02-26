"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useInit } from '@/context/InitContext';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isInitialized } = useInit();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // If not yet initialized or rendering on server, don't attempt auth check
  if (!isClient || !isInitialized) {
    return null; // Return null to prevent flashing content during initialization
  }

  // If still loading auth state, show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and fallback is provided, render fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default: render anonymous access message
  // Note: With Identity Pool, most pages should be accessible anonymously
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Anonymous Access
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You're viewing this content with limited permissions.
        </p>
      </div>
    </div>
  );
} 