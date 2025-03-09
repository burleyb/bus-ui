"use client";

import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-browser";
import leoCognito from './leoCognito';
import { HeaderBag } from "@aws-sdk/types";
import axiosClient from './axiosClient';

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
    
    // Parse the URL
    const parsedUrl = new URL(url);
    
    // Log signing attempt in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Signing request with AWS SigV4', {
        method,
        url,
        path: parsedUrl.pathname,
        query: parsedUrl.search,
        region,
        service
      });
    }
    
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
      applyChecksum: false
    });
    
    // Prepare headers as HeaderBag object
    const requestHeaders: HeaderBag = {};
    
    // Add all provided headers, normalizing to lowercase
    Object.entries(headers).forEach(([key, value]) => {
      // Convert header name to lowercase
      requestHeaders[key.toLowerCase()] = value;
    });
    
    // Set host header if not provided
    if (!requestHeaders['host']) {
      requestHeaders['host'] = parsedUrl.host;
    }
    console.log('==== USE_CORS_PROXY ====', process.env.NEXT_PUBLIC_USE_CORS_PROXY);
    console.log('==== CORS_PROXY_HOST ====', process.env.NEXT_PUBLIC_CORS_PROXY_HOST);
    console.log('==== CORS_PROXY_PATH ====', process.env.NEXT_PUBLIC_CORS_PROXY_PATH);
    if(parsedUrl.hostname === 'localhost' && process.env.NEXT_PUBLIC_USE_CORS_PROXY == 'true') {
      requestHeaders['host'] = process.env.NEXT_PUBLIC_CORS_PROXY_HOST || 'botmon.lablpx.com';
    }
    
    // Explicitly ensure content-type is set for GET requests
    if (method === 'GET' && !requestHeaders['content-type']) {
      requestHeaders['content-type'] = '';
    }
    
    // Create query parameters object - preserving order
    const queryParams: Record<string, string[]> = {};
    
    // Convert URL search params to the expected format
    // Need to maintain the order and handle multiple parameters with the same name
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      if (!queryParams[key]) {
        queryParams[key] = [];
      }
      queryParams[key].push(value);
    }
    
    // Log the canonical query parameters in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Query parameters for signing:', queryParams);
    }
    
    // Convert multi-valued parameters to the format expected by the signer
    const signerQuery: Record<string, string | string[]> = {};
    for (const [key, values] of Object.entries(queryParams)) {
      if (values.length === 1) {
        signerQuery[key] = values[0];
      } else {
        signerQuery[key] = values;
      }
    }

    console.log('==== hsotname ====', parsedUrl.hostname, parsedUrl.pathname, signerQuery);

    let hostname = parsedUrl.hostname;
    let pathname = parsedUrl.pathname;
    if(parsedUrl.hostname === 'localhost' && process.env.NEXT_PUBLIC_USE_CORS_PROXY == 'true') {
      hostname = process.env.NEXT_PUBLIC_CORS_PROXY_HOST || 'botmon.lablpx.com';
      pathname = parsedUrl.pathname.replace('proxy', (process.env.NEXT_PUBLIC_CORS_PROXY_PATH || 'prod'))    
    }
    
    let headersToSign = {
      method: method,
      hostname: hostname,
      path: pathname,
      query: signerQuery as any,
      headers: requestHeaders,
      body: body
    }

    console.log('==== headersToSign ====', headersToSign);
    // Sign the request
    const signed = await signer.sign(headersToSign);

    // Convert the signed headers back to a simple Record for compatibility
    const signedHeaders: Record<string, string> = {};
    Object.entries(signed.headers).forEach(([key, value]) => {
      // Skip headers that may cause CORS issues
      if (key.toLowerCase() === 'x-amz-content-sha256') {
        return; // Skip this header
      }
      
      if (Array.isArray(value)) {
        signedHeaders[key] = value.join(',');
      } else {
        signedHeaders[key] = value;
      }
    });
    
    console.log('==== signedHeaders ====', signedHeaders);
    // Return the signed headers
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
    
    // const signedHeaders = await signRequest(method, url, headers, body);
    
    // Use a fresh axios instance to avoid double signing
    const axiosResponse = await axiosClient({
      url,
      method,
      headers: headers,
      data: body,
      responseType: 'text',
    });
    
    // Convert axios response to fetch Response
    const response = new Response(axiosResponse.data, {
      status: axiosResponse.status,
      statusText: axiosResponse.statusText,
      headers: new Headers(axiosResponse.headers as any),
    });
    
    return response;
  } catch (error: any) {
    console.error('Error in fetchWithSigV4:', error);
    
    // Handle axios errors by creating an error Response
    if (error.response) {
      return new Response(JSON.stringify(error.response.data), {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: new Headers(error.response.headers),
      });
    }
    
    throw error;
  }
} 