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
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Enable CORS credentials if needed
  withCredentials: false,
});

// Log the base URL being used (in development only)
if (process.env.NODE_ENV !== 'production') {
  console.log(`API calls will be directed to: ${API_BASE_URL || 'current origin'}`);
}

// Interceptor for request - will add AWS signature to each request
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Extract request details for signing
      const method = config.method?.toUpperCase() || 'GET';
      
      // Construct full URL from baseURL and path
      let fullUrl = '';
      
      // Handle relative URLs properly
      if (config.url?.startsWith('http')) {
        fullUrl = config.url;
      } else {
        const baseUrl = config.baseURL || '';
        const path = config.url || '';
        fullUrl = baseUrl + path;
      }
      
      // Build headers object for signing
      const headers: Record<string, string> = {};
      
      // Copy existing headers to the headers object
      if (config.headers) {
        Object.entries(config.headers as AxiosHeaders).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value;
          }
        });
      }
      
      // Prepare request body if exists
      const body = config.data ? 
        (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) 
        : undefined;
      
      // For debugging in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug('Signing API request', {
          method,
          url: fullUrl,
          body: body ? (body.length > 100 ? body.substring(0, 100) + '...' : body) : undefined
        });
      }
      
      // Sign the request using our new AWS SDK v3 implementation
      const signedHeaders = await signRequest(
        method,
        fullUrl,
        headers,
        body
      );
      
      // Replace all headers with the signed headers, ensuring compatibility with CORS
      const finalHeaders = new AxiosHeaders();
      
      // Add each signed header, normalizing names to be compatible with API Gateway
      Object.entries(signedHeaders).forEach(([key, value]) => {
        const headerKey = key.toLowerCase();
        
        // Skip any problematic headers that aren't in the allowed list
        if (headerKey === 'x-amz-content-sha256') {
          return;
        }
        
        // Make sure we use the correct case for Authorization header
        if (headerKey === 'authorization') {
          finalHeaders.set('Authorization', value);
        }
        // Make sure we use the correct case for Date header
        else if (headerKey === 'x-amz-date') {
          finalHeaders.set('X-Amz-Date', value);
        }
        // Make sure we use the correct case for Security Token
        else if (headerKey === 'x-amz-security-token') {
          // If API Gateway doesn't allow this header, we need to find another solution
          finalHeaders.set('X-Amz-Security-Token', value); 
        } 
        else {
          finalHeaders.set(key, value);
        }
      });
      
      config.headers = finalHeaders;
      
      return config;
    } catch (error) {
      console.error('Error signing request:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

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