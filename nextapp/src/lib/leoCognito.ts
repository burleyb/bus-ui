/**
 * LEOCognito - AWS Cognito Authentication Utility
 * 
 * This module provides functionality for AWS Cognito authentication and
 * signing requests with AWS Signature Version 4.
 */

import CryptoJS from 'crypto-js';
import { AWS_IDENTITY_POOL_ID, AWS_REGION } from '@/config';

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
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityService.GetId'
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get identity ID: ${errorText}`);
  }
  
  const data = await response.json();
  return data.IdentityId;
}

/**
 * Get credentials for identity from Cognito Identity Pool
 */
async function getCredentialsForIdentity(identityId: string): Promise<AwsCredentials> {
  const endpoint = `https://cognito-identity.${AWS_REGION}.amazonaws.com/`;
  
  const params = {
    IdentityId: identityId
  };
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityService.GetCredentialsForIdentity'
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get credentials: ${errorText}`);
  }
  
  const data = await response.json();
  
  // Format the credentials
  const credentials: AwsCredentials = {
    accessKeyId: data.Credentials.AccessKeyId,
    secretAccessKey: data.Credentials.SecretKey,
    sessionToken: data.Credentials.SessionToken,
    expiration: new Date(data.Credentials.Expiration)
  };
  
  return credentials;
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
 */
export async function signRequest(
  request: Request,
  service: string = 'execute-api',
  region: string = 'us-east-1'
): Promise<Request> {
  const credentials = await getCredentials();
  
  // Create a new request with the same properties
  const url = new URL(request.url);
  const method = request.method;
  const headers = new Headers(request.headers);
  const body = await request.clone().text();
  
  // Get the current date and time
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  
  // Add required headers for AWS Signature Version 4
  headers.set(X_AMZ_DATE, amzDate);
  if (credentials.sessionToken) {
    headers.set(X_AMZ_SECURITY_TOKEN, credentials.sessionToken);
  }
  
  // Create canonical request
  const canonicalUri = url.pathname;
  const canonicalQueryString = url.search.substring(1); // Remove the leading '?'
  
  // Sort headers by name
  const sortedHeaders = Array.from(headers.entries()).sort((a, b) => 
    a[0].toLowerCase().localeCompare(b[0].toLowerCase())
  );
  
  // Create canonical headers
  const canonicalHeaders = sortedHeaders
    .map(([name, value]) => `${name.toLowerCase()}:${value.trim()}`)
    .join('\n') + '\n';
  
  // Create signed headers
  const signedHeaders = sortedHeaders
    .map(([name]) => name.toLowerCase())
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
  
  // Add the authorization header
  const authorizationHeader = [
    `${algorithm} Credential=${credentials.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(', ');
  
  headers.set('Authorization', authorizationHeader);
  
  // Create a new request with the signed headers
  return new Request(request.url, {
    method: request.method,
    headers: headers,
    body: body || undefined,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    integrity: request.integrity,
  });
}

/**
 * Create a signed fetch function that automatically signs requests with AWS Signature Version 4
 */
export function createSignedFetch(
  service: string = 'execute-api',
  region: string = 'us-east-1'
) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      // Create the request
      const request = new Request(input, init);
      
      // Sign the request
      const signedRequest = await signRequest(request, service, region);
      
      // Send the signed request
      return fetch(signedRequest);
    } catch (error) {
      console.error('Error in signed fetch:', error);
      throw error;
    }
  };
}

export default {
  initialize,
  getCredentials,
  refreshCredentials: getCredentials,
  signRequest,
  createSignedFetch
}; 