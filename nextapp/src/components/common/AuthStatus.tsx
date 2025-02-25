'use client'

import { useAuth } from '@/context/AuthContext';

export default function AuthStatus() {
  const { isAuthenticated, isLoading, error, signIn, refreshCredentials } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse h-4 w-4 rounded-full bg-gray-400"></div>
        <span className="text-sm text-gray-500">Checking credentials...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 rounded-full bg-red-500"></div>
        <span className="text-sm text-red-600">Credential error</span>
        <button
          onClick={() => signIn()}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 rounded-full bg-green-500"></div>
        <span className="text-sm text-green-600">AWS Credentials</span>
        <button
          onClick={() => refreshCredentials()}
          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          title="Refresh AWS credentials"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
      <span className="text-sm text-yellow-600">No credentials</span>
      <button
        onClick={() => signIn()}
        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Get Credentials
      </button>
    </div>
  );
} 