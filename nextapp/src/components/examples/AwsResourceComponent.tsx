"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AwsResourceComponent() {
  const { getAwsCredentials, isAuthenticated } = useAuth();
  const [credentials, setCredentials] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Function to fetch and display credentials
  const fetchCredentials = async () => {
    if (!isAuthenticated) {
      setError('User is not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const creds = await getAwsCredentials();
      
      // Mask the secret key for display purposes
      const maskedCreds = {
        ...creds,
        secretAccessKey: creds.secretAccessKey 
          ? `${creds.secretAccessKey.substring(0, 4)}...${creds.secretAccessKey.substring(creds.secretAccessKey.length - 4)}`
          : null
      };
      
      setCredentials(maskedCreds);
    } catch (err: any) {
      setError(err.message || 'Failed to get AWS credentials');
    } finally {
      setLoading(false);
    }
  };

  // Clear displayed credentials
  const clearCredentials = () => {
    setCredentials(null);
    setError(null);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">AWS Credentials Example</h2>
      
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={fetchCredentials}
            disabled={loading || !isAuthenticated}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Get AWS Credentials'}
          </button>
          
          <button
            onClick={clearCredentials}
            disabled={!credentials}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {credentials && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Current Credentials:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(credentials, null, 2)}
            </pre>
            <p className="text-sm text-gray-500 mt-2">
              Note: Secret keys are masked for security. In a real application, never display these values.
            </p>
          </div>
        )}

        {isAuthenticated ? (
          <div className="text-green-600">✓ Authenticated with Identity Pool</div>
        ) : (
          <div className="text-red-600">✗ Not authenticated</div>
        )}
        
        <div className="mt-4 text-sm text-gray-700">
          <p>
            This component demonstrates how to get AWS credentials from the Identity Pool.
            These credentials can be used to directly access AWS services from the browser.
          </p>
          <p className="mt-2">
            For a complete implementation, you would use these credentials with AWS SDK clients
            to access services like S3, DynamoDB, etc.
          </p>
        </div>
      </div>
    </div>
  );
} 