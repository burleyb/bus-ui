/**
 * LEOCognito - AWS Cognito Authentication Utility
 * 
 * This module provides functionality for AWS Cognito authentication and
 * signing requests with AWS Signature Version 4.
 */

import CryptoJS from 'crypto-js';
import { AWS_IDENTITY_POOL_ID, AWS_REGION } from '@/config';
import axios from 'axios';

// Types
export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration?: Date;
}

export interface CognitoConfig {
  identityPoolId: string;
  region: string;
  apiUri?: string;
}

export interface CognitoTokens {
  IdentityId: string;
  Logins: Record<string, string>;
}

// Constants for AWS Signature
const AWS_SHA_256 = 'AWS4-HMAC-SHA256';
const AWS4_REQUEST = 'aws4_request';
const AWS4 = 'AWS4';
const X_AMZ_DATE = 'x-amz-date';
const X_AMZ_SECURITY_TOKEN = 'x-amz-security-token';
const HOST = 'host';
const AUTHORIZATION = 'Authorization';

// State
let currentCredentials: AwsCredentials | null = null;
let credentialsExpiration: Date | null = null;
let isFetchingToken = false;
let pendingRequests: Array<() => void> = [];
let config: CognitoConfig | null = null;

// Cache for credentials to avoid unnecessary calls
let cachedCredentials: AwsCredentials | null = null;

/**
 * Initialize the LEOCognito module with configuration
 */
export function initialize(cognitoConfig: CognitoConfig): void {
  // Store configuration for later use
  config = cognitoConfig;
  const region = cognitoConfig.region || cognitoConfig.identityPoolId.split(':')[0];
  
  console.log('Initializing LEOCognito with region:', region);
}

/**
 * Get AWS credentials from Cognito Identity Pool
 * This function will use cached credentials if they're still valid
 */
export async function getCredentials(): Promise<AwsCredentials> {
  // Check if we have valid cached credentials
  if (cachedCredentials && credentialsExpiration && new Date() < credentialsExpiration) {
    console.log('Using cached AWS credentials');
    return cachedCredentials;
  }

  console.log('Fetching new AWS credentials from Cognito');
  
  try {
    // Get identity ID
    const identityId = await getIdentityId();
    
    // Get credentials for identity
    const credentials = await getCredentialsForIdentity(identityId);
    
    // Cache the credentials
    cachedCredentials = credentials;
    
    // Set expiration time (credentials typically expire after 1 hour)
    if (credentials.expiration) {
      credentialsExpiration = credentials.expiration;
    } else {
      // Default to 55 minutes if no expiration provided
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 55);
      credentialsExpiration = expiration;
    }
    
    return credentials;
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    throw error;
  }
}

/**
 * Get identity ID from Cognito Identity Pool
 */
async function getIdentityId(): Promise<string> {
  const endpoint = `https://cognito-identity.${AWS_REGION}.amazonaws.com/`;
  
  const params = {
    IdentityPoolId: AWS_IDENTITY_POOL_ID
  };
  
  const response = await axios({
    url: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityService.GetId'
    },
    data: params
  });
  
  return response.data.IdentityId;
}

/**
 * Get credentials for identity from Cognito Identity Pool
 */
async function getCredentialsForIdentity(identityId: string): Promise<AwsCredentials> {
  const endpoint = `https://cognito-identity.${AWS_REGION}.amazonaws.com/`;
  
  const params = {
    IdentityId: identityId
  };
  
  try {
    const response = await axios({
      url: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityService.GetCredentialsForIdentity'
      },
      data: params
    });
    
    const data = response.data;
    console.log('Raw credentials data:', JSON.stringify(data.Credentials));
    
    // Format the credentials
    const credentials: AwsCredentials = {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretKey,
      sessionToken: data.Credentials.SessionToken,
    };
    
    // Handle different expiration formats
    if (data.Credentials.Expiration) {
      const expiration = data.Credentials.Expiration;
      
      // Check if it's a number (seconds since epoch) or string (ISO date)
      if (typeof expiration === 'number') {
        // Convert seconds to milliseconds for JS Date
        credentials.expiration = new Date(expiration * 1000);
      } else if (typeof expiration === 'string') {
        // Parse ISO string or other string format
        credentials.expiration = new Date(expiration);
      } else {
        // Default fallback
        const defaultExpiration = new Date();
        defaultExpiration.setMinutes(defaultExpiration.getMinutes() + 55);
        credentials.expiration = defaultExpiration;
      }
      
      console.log('Got credentials with expiration:', credentials.expiration);
    }
    
    return credentials;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to get credentials: ${error.response.data}`);
    }
    throw error;
  }
}

/**
 * Clear the cached credentials
 * Useful when manually refreshing credentials
 */
export function clearCredentialsCache(): void {
  cachedCredentials = null;
  credentialsExpiration = null;
}

/**
 * Sign a request with AWS Signature Version 4
 * This function now works with axios request config instead of fetch Request
 */
export async function signRequest(
  config: any,
  service: string = 'execute-api',
  region: string = 'us-east-1'
): Promise<any> {
  const credentials = await getCredentials();
  
  // Extract request details from axios config
  const url = new URL(config.url);
  const method = config.method?.toUpperCase() || 'GET';
  const headers = config.headers || {};
  const body = config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : '';
  
  // Get the current date and time
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  
  // Add required headers for AWS Signature Version 4
  headers[X_AMZ_DATE] = amzDate;
  if (credentials.sessionToken) {
    headers[X_AMZ_SECURITY_TOKEN] = credentials.sessionToken;
  }
  
  // Create canonical request
  const canonicalUri = url.pathname;
  const canonicalQueryString = url.search.substring(1); // Remove the leading '?'
  
  // Sort headers by name
  const sortedHeaderNames = Object.keys(headers).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  
  // Create canonical headers
  const canonicalHeaders = sortedHeaderNames
    .map(name => `${name.toLowerCase()}:${headers[name].trim()}`)
    .join('\n') + '\n';
  
  // Create signed headers
  const signedHeaders = sortedHeaderNames
    .map(name => name.toLowerCase())
    .join(';');
  
  // Create payload hash
  const payloadHash = CryptoJS.SHA256(body || '').toString(CryptoJS.enc.Hex);
  
  // Create canonical request
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const algorithm = AWS_SHA_256;
  const credentialScope = `${dateStamp}/${region}/${service}/${AWS4_REQUEST}`;
  
  const canonicalRequestHash = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);
  
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  // Calculate signature
  const kDate = CryptoJS.HmacSHA256(dateStamp, AWS4 + credentials.secretAccessKey);
  const kRegion = CryptoJS.HmacSHA256(region, kDate);
  const kService = CryptoJS.HmacSHA256(service, kRegion);
  const kSigning = CryptoJS.HmacSHA256(AWS4_REQUEST, kService);
  const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString(CryptoJS.enc.Hex);
  
  // Add the signature to the headers
  const authorizationHeader = [
    `${algorithm} Credential=${credentials.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(', ');
  
  headers[AUTHORIZATION] = authorizationHeader;
  
  // Return the updated axios config
  return {
    ...config,
    headers
  };
}

/**
 * Create a signed axios request function
 * This replaces the previous createSignedFetch function
 */
export function createSignedAxios(
  service: string = 'execute-api',
  region: string = 'us-east-1'
) {
  return async (config: any) => {
    const signedConfig = await signRequest(config, service, region);
    return axios(signedConfig);
  };
}

// Default export
export default {
  initialize,
  getCredentials,
  clearCredentialsCache,
  refreshCredentials: getCredentials,
  signRequest,
  createSignedAxios
};

// Auto-initialize the module with the configuration from the environment
// This ensures the module is ready to use without explicit initialization

// Initialize the module with the configuration from the environment
initialize({
  identityPoolId: AWS_IDENTITY_POOL_ID,
  region: AWS_REGION
});

console.log('LEOCognito module initialized with Identity Pool ID:', AWS_IDENTITY_POOL_ID, 'and Region:', AWS_REGION); 