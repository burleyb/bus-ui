import leoCognito from './leoCognito';
import { awsAxios } from './axiosClient';
import { AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import { signRequest, fetchWithSigV4 } from './awsSignature';

/**
 * Utility function to sign AWS requests using SigV4
 */
export async function signAwsRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: string
): Promise<Record<string, string>> {
  try {
    // Use the new AWS SDK V3 signature implementation
    return await signRequest(method, url, headers, body);
  } catch (error) {
    console.error('Error signing AWS request:', error);
    return headers;
  }
}

/**
 * Create a fetch function for AWS services with proper SigV4 signing
 * This now uses axios under the hood but maintains the same interface
 */
export const awsFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  
  // Log API call in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API call to: ${fullUrl}`, {
      method: options.method || 'GET',
      headers: options.headers || {}
    });
  }
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Log errors for easier debugging
    if (!response.ok) {
      console.error(`API error (${response.status}): ${fullUrl}`, 
        await response.text().catch(() => 'Failed to get response text')
      );
    }
    
    return response;
  } catch (error) {
    console.error(`API fetch error for ${fullUrl}:`, error);
    throw error;
  }
};

/**
 * Alternative native fetch implementation using AWS SigV4
 * Direct wrapper around the new fetchWithSigV4 function
 */
export async function awsNativeFetch(url: string, options: RequestInit = {}) {
  // Determine if we need to add the base URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  
  // Log API call in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API call to: ${fullUrl}`);
  }
  
  return fetchWithSigV4(fullUrl, options);
}

/**
 * Get AWS credentials for accessing AWS services directly
 */
export async function getAWSCredentials() {
  try {
    return await leoCognito.getAwsCredentials();
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    throw error;
  }
}

/**
 * Initialize the Cognito Identity Pool process
 */
export async function initializeCognito(tokenProvider?: () => Promise<{ [key: string]: string }>) {
  return leoCognito.initialize(tokenProvider);
}

/**
 * Check if user is authenticated
 * With Identity Pools, we can still load the application without authentication
 */
export async function requireAuth() {
  const isAuthenticated = await leoCognito.isAuthenticated();
  return isAuthenticated;
} 