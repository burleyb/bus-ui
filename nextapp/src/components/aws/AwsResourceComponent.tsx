"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Example component showing how to access AWS resources using credentials from Cognito Identity Pools
 */
export default function AwsResourceComponent() {
  const { getAwsCredentials, isAuthenticated } = useAuth();
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load credentials if user is authenticated
    if (isAuthenticated) {
      loadCredentials();
    }
  }, [isAuthenticated]);

  const loadCredentials = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const creds = await getAwsCredentials();
      setCredentials({
        accessKeyId: creds.accessKeyId ? 
          `${creds.accessKeyId.substring(0, 5)}...` : 'Not available',
        expiration: creds.expiration ? 
          new Date(creds.expiration).toLocaleString() : 'Not available',
        identityId: creds.identityId || 'Not available',
      });
    } catch (err: any) {
      console.error('Error loading AWS credentials:', err);
      setError(err.message || 'Failed to load AWS credentials');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to access AWS resources</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">AWS Credentials</h2>
      
      {loading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {credentials && (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Access Key ID:</span> {credentials.accessKeyId}
          </div>
          <div>
            <span className="font-medium">Identity ID:</span> {credentials.identityId}
          </div>
          <div>
            <span className="font-medium">Expiration:</span> {credentials.expiration}
          </div>
        </div>
      )}
      
      <button
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        onClick={loadCredentials}
        disabled={loading}
      >
        Refresh Credentials
      </button>
      
      <div className="mt-6 border-t pt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          To use AWS services directly from the browser with these credentials, import the required AWS SDK client
          and configure it with the credentials from <code>getAwsCredentials()</code>.
        </p>
      </div>
    </div>
  );
} 