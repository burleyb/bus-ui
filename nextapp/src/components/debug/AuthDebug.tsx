'use client'

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthDebug() {
  const { isAuthenticated, isLoading, error, credentials } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (!process.env.NEXT_PUBLIC_DEBUG_MODE) {
    return null;
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-md p-4 my-4 text-sm">
      <h3 className="font-bold text-lg mb-2">Authentication Debug</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="font-semibold">Status:</div>
        <div>
          {isLoading ? (
            <span className="text-blue-500">Loading...</span>
          ) : isAuthenticated ? (
            <span className="text-green-500">Authenticated</span>
          ) : (
            <span className="text-red-500">Not Authenticated</span>
          )}
        </div>
        
        {error && (
          <>
            <div className="font-semibold">Error:</div>
            <div className="text-red-500">{error.message || String(error)}</div>
          </>
        )}
        
        <div className="font-semibold">Has Credentials:</div>
        <div>{credentials ? 'Yes' : 'No'}</div>
        
        {credentials && (
          <>
            <div className="font-semibold">Expiration:</div>
            <div>
              {credentials.expiration 
                ? new Date(credentials.expiration).toLocaleString() 
                : 'Unknown'}
            </div>
            
            <div className="col-span-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-500 underline"
              >
                {showDetails ? 'Hide' : 'Show'} Credential Details
              </button>
            </div>
            
            {showDetails && (
              <div className="col-span-2 mt-2 bg-gray-200 p-2 rounded overflow-auto max-h-40">
                <pre className="text-xs">
                  {JSON.stringify(
                    {
                      accessKeyId: credentials.accessKeyId,
                      secretAccessKey: credentials.secretAccessKey ? '[REDACTED]' : undefined,
                      sessionToken: credentials.sessionToken ? '[REDACTED]' : undefined,
                      expiration: credentials.expiration,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 