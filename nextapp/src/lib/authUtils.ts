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
export async function awsFetch(url: string, options: RequestInit = {}) {
  try {
    // Convert fetch options to axios options
    const axiosOptions: AxiosRequestConfig = {
      method: options.method || 'GET',
      headers: options.headers as RawAxiosRequestHeaders,
      data: options.body,
      signal: options.signal || undefined,
    };
    
    // Make the request using axios
    const response = await awsAxios(url, axiosOptions);
    
    // Create a fetch-like response object for backward compatibility
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      // Add json method to mimic fetch Response
      json: () => Promise.resolve(response.data),
      // Add text method to mimic fetch Response
      text: () => Promise.resolve(
        typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data)
      ),
      data: response.data
    };
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        ok: false,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        json: () => Promise.reject(error.response.data),
        text: () => Promise.reject(error.response.data),
        data: error.response.data
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error;
    }
  }
}

/**
 * Alternative native fetch implementation using AWS SigV4
 * Direct wrapper around the new fetchWithSigV4 function
 */
export async function awsNativeFetch(url: string, options: RequestInit = {}) {
  return fetchWithSigV4(url, options);
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