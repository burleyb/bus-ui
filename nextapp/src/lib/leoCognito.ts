"use client";

import { 
  CognitoIdentityClient,
  GetIdCommand, 
  GetCredentialsForIdentityCommand
} from '@aws-sdk/client-cognito-identity';
import { signRequest } from './awsSignature'; // Import our new SigV4 implementation

// Configuration
const IDENTITY_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || 'us-east-1:3425a7c9-40c1-4aa0-b7c7-62e28e353b9e';
const REGION = process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1';

// Local storage keys
const CREDENTIALS_KEY = 'leoIdentityCredentials';

// Initialize client only on client side
let identityClient: CognitoIdentityClient | null = null;
if (typeof window !== 'undefined') {
  identityClient = new CognitoIdentityClient({ region: REGION });
}

/**
 * Class to handle authentication with AWS Cognito Identity Pools
 */
class LeoCognito {
  private pendingRequests: any[] = [];
  private isFetchingCredentials: boolean = false;
  private loadCallbacks: Function[] = [];

  // Initialize with an optional login token provider
  async initialize(tokenProvider?: () => Promise<{ [key: string]: string }>) {
    if (typeof window === 'undefined') return;
    
    await this.refreshCredentials(tokenProvider);
  }

  // Refresh AWS credentials
  async refreshCredentials(tokenProvider?: () => Promise<{ [key: string]: string }>) {
    if (typeof window === 'undefined' || !identityClient) return null;
    
    this.isFetchingCredentials = true;
    
    try {
      if (tokenProvider) {
        // Get tokens from provider for authenticated access
        const logins = await tokenProvider();
        
        // Step 1: Get Cognito identity ID
        const getIdCommand = new GetIdCommand({
          IdentityPoolId: IDENTITY_POOL_ID,
          Logins: logins
        });
        
        const identityResponse = await identityClient.send(getIdCommand);
        
        if (!identityResponse.IdentityId) {
          throw new Error('Failed to get identity ID');
        }

        // Step 2: Get credentials for identity
        const getCredentialsCommand = new GetCredentialsForIdentityCommand({
          IdentityId: identityResponse.IdentityId,
          Logins: logins
        });

        const credentialsResponse = await identityClient.send(getCredentialsCommand);
        
        if (!credentialsResponse.Credentials) {
          throw new Error('Failed to get AWS credentials');
        }

        // Save credentials to local storage
        const credentials = {
          accessKeyId: credentialsResponse.Credentials.AccessKeyId,
          secretAccessKey: credentialsResponse.Credentials.SecretKey,
          sessionToken: credentialsResponse.Credentials.SessionToken,
          expiration: credentialsResponse.Credentials.Expiration,
          identityId: identityResponse.IdentityId
        };

        this.saveCredentials(credentials);
        
        // Notify all callbacks
        this.notifyCallbacks();
        
        return credentials;
      } else {
        // Unauthenticated access using direct client API calls
        try {
          // Step 1: Get Cognito identity ID
          const getIdCommand = new GetIdCommand({
            IdentityPoolId: IDENTITY_POOL_ID
          });
          
          const identityResponse = await identityClient.send(getIdCommand);
          
          if (!identityResponse.IdentityId) {
            throw new Error('Failed to get identity ID');
          }

          // Step 2: Get credentials for identity
          const getCredentialsCommand = new GetCredentialsForIdentityCommand({
            IdentityId: identityResponse.IdentityId
          });

          const credentialsResponse = await identityClient.send(getCredentialsCommand);
          
          if (!credentialsResponse.Credentials) {
            throw new Error('Failed to get AWS credentials');
          }

          // Save credentials
          const credentialsToSave = {
            accessKeyId: credentialsResponse.Credentials.AccessKeyId,
            secretAccessKey: credentialsResponse.Credentials.SecretKey,
            sessionToken: credentialsResponse.Credentials.SessionToken,
            expiration: credentialsResponse.Credentials.Expiration,
            identityId: identityResponse.IdentityId
          };
          
          this.saveCredentials(credentialsToSave);
          
          // Notify all callbacks
          this.notifyCallbacks();
          
          return credentialsToSave;
        } catch (error) {
          console.error('Error getting unauthenticated credentials:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error refreshing credentials:', error);
      throw error;
    } finally {
      this.isFetchingCredentials = false;
    }
  }
  
  // Add a callback to be notified when credentials are refreshed
  addCallback(callback: Function) {
    this.loadCallbacks.push(callback);
    
    // If we already have credentials, call the callback immediately
    const credentials = this.getCredentialsFromStorage();
    if (credentials && !this.isExpired(credentials)) {
      callback(credentials);
    } else if (!this.isFetchingCredentials) {
      // Trigger a refresh
      this.refreshCredentials();
    }
  }
  
  // Notify all callbacks
  private notifyCallbacks() {
    const credentials = this.getCredentialsFromStorage();
    if (credentials) {
      for (const callback of this.loadCallbacks) {
        callback(credentials);
      }
    }
  }
  
  // Check if credentials are expired
  private isExpired(credentials: any): boolean {
    if (!credentials || !credentials.expiration) return true;
    
    const expirationDate = new Date(credentials.expiration);
    const now = new Date();
    
    // Consider expired 5 minutes before actual expiration
    const fiveMinutes = 5 * 60 * 1000;
    return expirationDate.getTime() - now.getTime() < fiveMinutes;
  }

  // Save credentials to local storage
  private saveCredentials(credentials: any) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Error saving credentials to local storage:', error);
    }
  }

  // Get credentials from local storage
  getCredentialsFromStorage() {
    if (typeof window === 'undefined') return null;
    
    try {
      const credentialsString = localStorage.getItem(CREDENTIALS_KEY);
      return credentialsString ? JSON.parse(credentialsString) : null;
    } catch (error) {
      console.error('Error getting credentials from local storage:', error);
      return null;
    }
  }

  // Get AWS credentials (returns cached or new)
  async getAwsCredentials(tokenProvider?: () => Promise<{ [key: string]: string }>) {
    // First try to get from storage
    const storedCredentials = this.getCredentialsFromStorage();
    
    // If we have credentials and they're not expired, return them
    if (storedCredentials && !this.isExpired(storedCredentials)) {
      return storedCredentials;
    }
    
    // Otherwise, get new credentials
    return await this.refreshCredentials(tokenProvider);
  }
  
  // Check if user is authenticated by checking if we have valid credentials
  async isAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const credentials = this.getCredentialsFromStorage();
    return !!credentials && !this.isExpired(credentials);
  }
  
  // Sign out by clearing credentials
  signOut() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(CREDENTIALS_KEY);
  }

  async fetchWithCredentials(
    region: string,
    method: string,
    url: string,
    headers: Record<string, string> = {},
    body?: string
  ): Promise<Response> {
    const credentials = await this.getAwsCredentials();
    
    // Log credentials in development (except for secretAccessKey)
    if (process.env.NODE_ENV !== 'production') {
      const safeCredentials = { ...credentials };
      if (safeCredentials.secretAccessKey) {
        safeCredentials.secretAccessKey = '[REDACTED]';
      }
      console.debug('Using credentials for API request:', safeCredentials);
    }
    
    // Create a copy of headers for signing
    const requestHeaders: Record<string, string> = { ...headers };
    
    // Add content-type if not provided
    if (!requestHeaders['content-type'] && !requestHeaders['Content-Type']) {
      requestHeaders['content-type'] = body ? 'application/json' : '';
    }
    
    // Sign the request using our new AWS SDK v3 implementation
    const signedHeaders = await signRequest(
      method,
      url,
      requestHeaders,
      body,
      'execute-api'
    );
    
    // Log the final request in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Sending signed request:', {
        method,
        url,
        headers: signedHeaders,
        body: body ? (body.length > 1000 ? body.substring(0, 1000) + '...' : body) : undefined
      });
    }
    
    // Make the request with signed headers
    try {
      const response = await fetch(url, {
        method,
        headers: signedHeaders,
        body
      });
      
      // Log response status in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`API response: ${response.status} ${response.statusText}`);
        
        // If error, try to show more details
        if (!response.ok) {
          const clone = response.clone();
          try {
            const errorText = await clone.text();
            console.error('API error response:', errorText);
          } catch (e) {
            console.error('Could not read error response body');
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Fetch request failed:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const leoCognito = new LeoCognito();
export default leoCognito; 