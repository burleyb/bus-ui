"use client";

import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-browser";
import leoCognito from './leoCognito';
import { HeaderBag } from "@aws-sdk/types";

/**
 * Signs an HTTP request using AWS Signature V4
 * This is a modern implementation using the AWS SDK v3
 */
export async function signRequest(
  method: string,
  url: string, 
  headers: Record<string, string> = {}, 
  body?: string,
  service: string = 'execute-api'
): Promise<Record<string, string>> {
  try {
    // Get credentials from Cognito Identity Pool
    const credentials = await leoCognito.getAwsCredentials();
    
    if (!credentials) {
      console.error('Missing AWS credentials');
      return headers;
    }

    // Extract region from environment or use default
    const region = process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1';
    
    // Log signing attempt in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Signing request with AWS SigV4', {
        method,
        url,
        region,
        service
      });
    }

    // Parse the URL
    const parsedUrl = new URL(url);
    
    // Create a signer with the provided credentials and service
    const signer = new SignatureV4({
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken
      },
      region: region,
      service: service,
      sha256: Sha256,
      // Important: Set this to false to NOT include x-amz-content-sha256 header
      // which is causing CORS issues
      applyChecksum: false
    });
    
    // Prepare headers as HeaderBag object
    const requestHeaders: HeaderBag = {};
    
    // First populate with any default headers
    if (!headers['content-type'] && body) {
      requestHeaders['content-type'] = 'application/json';
    }
    
    // Add all provided headers
    Object.entries(headers).forEach(([key, value]) => {
      // Convert header name to lowercase
      requestHeaders[key.toLowerCase()] = value;
    });
    
    // Set host header if not provided
    if (!requestHeaders['host']) {
      requestHeaders['host'] = parsedUrl.host;
    }
    
    // Create query parameters object from URL search params
    const query: Record<string, string> = {};
    for (const [key, value] of new URLSearchParams(parsedUrl.search)) {
      query[key] = value;
    }
    
    // Sign the request
    const signed = await signer.sign({
      method: method,
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      query: query,
      headers: requestHeaders,
      body: body
    });
    
    // Convert the signed headers back to a simple Record for compatibility
    const signedHeaders: Record<string, string> = {};
    Object.entries(signed.headers).forEach(([key, value]) => {
      // Skip headers that may cause CORS issues if they're not in the allowed list
      if (key.toLowerCase() === 'x-amz-content-sha256') {
        return; // Skip this header
      }
      
      if (Array.isArray(value)) {
        signedHeaders[key] = value.join(',');
      } else {
        signedHeaders[key] = value;
      }
    });

    // Return headers without modifying the original
    return signedHeaders;
  } catch (error) {
    console.error('Error signing request with AWS SigV4:', error);
    return headers;
  }
}

/**
 * Create a fetch function with AWS SigV4 signing
 */
export async function fetchWithSigV4(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Extract request details
    const method = options.method || 'GET';
    const headers = options.headers ? 
      (options.headers as Record<string, string>) : {};
    const body = options.body ? 
      (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) 
      : undefined;
    
    // Sign the request
    const signedHeaders = await signRequest(method, url, headers, body);
    
    // Create the fetch request with signed headers
    const response = await fetch(url, {
      ...options,
      headers: signedHeaders
    });
    
    return response;
  } catch (error) {
    console.error('Error in fetchWithSigV4:', error);
    throw error;
  }
} 