'use client'

import { useState, useEffect } from 'react';
import { API_BASE_URL, API_REGION, API_SERVICE, AWS_IDENTITY_POOL_ID, FEATURES, TIMEOUTS } from '@/config';
import { isDevelopment } from '@/lib/envUtils';
import { getAwsCredentials } from '@/lib/awsAuth';

export default function EnvInfo() {
  const [isVisible, setIsVisible] = useState(false);
  const [authInfo, setAuthInfo] = useState<{
    hasCredentials: boolean;
    expiresIn: string | null;
    error: string | null;
  }>({
    hasCredentials: false,
    expiresIn: null,
    error: null
  });

  // Check AWS credentials when the component is visible
  useEffect(() => {
    if (isVisible) {
      const checkCredentials = async () => {
        try {
          const credentials = await getAwsCredentials();
          if (credentials.expiration) {
            const now = new Date();
            const expiration = new Date(credentials.expiration);
            const diffMs = expiration.getTime() - now.getTime();
            const diffMins = Math.round(diffMs / 60000);
            
            setAuthInfo({
              hasCredentials: true,
              expiresIn: `${diffMins} minutes`,
              error: null
            });
          } else {
            setAuthInfo({
              hasCredentials: true,
              expiresIn: 'Unknown',
              error: null
            });
          }
        } catch (error) {
          setAuthInfo({
            hasCredentials: false,
            expiresIn: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      };
      
      checkCredentials();
    }
  }, [isVisible]);

  // Only show in development mode
  if (!isDevelopment()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        title="Environment Info"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM6.293 6.707a1 1 0 011.414 0L9 8l1.293-1.293a1 1 0 011.414 1.414L10.414 9.5l1.293 1.293a1 1 0 01-1.414 1.414L9 11l-1.293 1.293a1 1 0 01-1.414-1.414L7.586 9.5 6.293 8.207a1 1 0 010-1.414zM11 13a1 1 0 102 0v-1a1 1 0 10-2 0v1zm-6 0a1 1 0 102 0v-1a1 1 0 10-2 0v1z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isVisible && (
        <div className="mt-2 p-4 bg-white rounded-md shadow-lg border border-gray-200 w-80">
          <h3 className="text-lg font-semibold mb-2">Environment Info</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">API URL:</span> 
              <span className="ml-2 text-gray-600">{API_BASE_URL}</span>
            </div>
            <div>
              <span className="font-medium">AWS Region:</span> 
              <span className="ml-2 text-gray-600">{API_REGION}</span>
            </div>
            <div>
              <span className="font-medium">AWS Service:</span> 
              <span className="ml-2 text-gray-600">{API_SERVICE}</span>
            </div>
            <div>
              <span className="font-medium">Identity Pool:</span> 
              <span className="ml-2 text-gray-600">{AWS_IDENTITY_POOL_ID}</span>
            </div>
            <div>
              <span className="font-medium">Debug Mode:</span> 
              <span className="ml-2 text-gray-600">{FEATURES.debugMode ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div>
              <span className="font-medium">Mock Data:</span> 
              <span className="ml-2 text-gray-600">{FEATURES.enableMockData ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div>
              <span className="font-medium">API Timeout:</span> 
              <span className="ml-2 text-gray-600">{TIMEOUTS.apiRequest}ms</span>
            </div>
            
            {/* AWS Authentication Status */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <h4 className="font-semibold mb-1">AWS Authentication</h4>
              {authInfo.hasCredentials ? (
                <div className="text-green-600">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Authenticated</span>
                  </div>
                  <div className="text-xs mt-1">
                    Expires in: {authInfo.expiresIn}
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Not Authenticated</span>
                  </div>
                  {authInfo.error && (
                    <div className="text-xs mt-1 bg-red-50 p-1 rounded">
                      Error: {authInfo.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            This debug panel is only visible in development mode.
          </div>
        </div>
      )}
    </div>
  );
} 