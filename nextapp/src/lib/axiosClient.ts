import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  RawAxiosRequestHeaders,
  InternalAxiosRequestConfig,
  AxiosHeaders
} from 'axios';
import leoCognito from './leoCognito';
import { signRequest } from './awsSignature';

// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Create a custom Axios instance
const axiosClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 60000,
  responseType: 'json',
  headers: {
    'Accept': 'application/json'
  }
});

// Log the base URL being used (in development only)
if (process.env.NODE_ENV !== 'production') {
  console.log(`API calls will be directed to: ${API_BASE_URL || 'current origin'}`);
}

// Interceptor for request - will add AWS signature to each request
axiosClient.interceptors.request.use(async (config) => {
  try {
    // Only sign requests to the API
    const shouldSign = config.url?.includes('/api/') || false;
    
    if (!shouldSign) {
      return config;
    }
    
    // Ensure we have a full URL for signing
    let fullUrl = config.url || '';
    
    if (!fullUrl.startsWith('http')) {
      // Prepend the baseURL if it's a relative URL
      fullUrl = `${config.baseURL}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
    }
    
    // Parse the URL for better header handling
    const parsedUrl = new URL(fullUrl);
    
    // Log the request being signed in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Signing axios request:', {
        method: config.method,
        url: fullUrl,
        path: parsedUrl.pathname,
        query: parsedUrl.search
      });
    }
    
    // Collect the headers
    const headers: Record<string, string> = {};
    
    // Start with the default headers from the axios instance
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        if (typeof value === 'string') {
          headers[key.toLowerCase()] = value;
        }
      }
    }
    
    // Ensure we have accept header
    if (!headers['accept']) {
      headers['accept'] = 'application/json';
    }
    
    // Add host header (required for AWS signing)
    if(parsedUrl.hostname === 'localhost') {
      headers['host'] = 'botmon.lablpx.com';
    } else {
      headers['host'] = parsedUrl.host;
    }
    
    // For GET requests with no body, make sure content-type is explicitly set to empty string
    if (config.method?.toUpperCase() === 'GET' && !config.data) {
      headers['content-type'] = '';
    } else if (config.data && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }
    
    // Convert the request body to a string if needed
    let bodyString: string | undefined;
    
    if (config.data) {
      if (typeof config.data === 'string') {
        bodyString = config.data;
      } else {
        bodyString = JSON.stringify(config.data);
      }
    }

    console.log('==== headers ====', headers, fullUrl);
    
    // Sign the request
    const signedHeaders = await signRequest(
      config.method?.toUpperCase() || 'GET',
      fullUrl,
      headers,
      bodyString
    );
    
    // Log the final signed headers in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Final signed headers:', signedHeaders);
    }
    
    // Update the config with the signed headers
    if (config.headers) {
      // First clear existing headers that will be replaced by signed ones
      Object.keys(config.headers).forEach(key => {
        if (typeof config.headers === 'object') {
          delete config.headers[key];
        }
      });
      
      // Now add each signed header to the config
      Object.entries(signedHeaders).forEach(([key, value]) => {
        if (config.headers && typeof config.headers === 'object') {
          config.headers[key] = value;
        }
      });
    }
    
    return config;
  } catch (error) {
    console.error('Error in axios request interceptor:', error);
    return config;
  }
});

// Response interceptor for handling common error cases
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Log detailed error information in development
    if (process.env.NODE_ENV !== 'production') {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('API Error Response:', {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('API Error Request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('API Error:', error.message);
      }
    }

    // Handle error cases such as 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Refresh credentials or redirect to login
      leoCognito.refreshCredentials().catch(() => {
        console.error('Failed to refresh credentials');
      });
    }
    
    return Promise.reject(error);
  }
);

// Helper function to make requests with this client
export async function awsAxios(url: string, options: AxiosRequestConfig = {}) {
  try {
    const response = await axiosClient({
      url,
      ...options
    });
    
    return response;
  } catch (error) {
    throw error;
  }
}

export default axiosClient; 