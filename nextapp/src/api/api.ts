// API client for making requests to the backend
import { ApiError, logError } from '@/lib/errorUtils';
import { buildApiUrl } from '@/lib/apiUtils';
import { getCredentials } from '@/lib/leoCognito';
import { API_REGION, API_SERVICE } from '@/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { AwsCredentials } from '@/lib/leoCognito';

// Module-level credentials cache
let cachedCredentials: AwsCredentials | null = null;
let credentialsExpiration: Date | null = null;
let credentialsFetchPromise: Promise<AwsCredentials> | null = null;

// Helper function to handle API responses
const handleResponse = async (response: AxiosResponse) => {
  return response.data;
};

// Get credentials with efficient caching
const getCredentialsEfficiently = async (): Promise<AwsCredentials> => {
  // If we have a pending fetch, return that promise to avoid multiple parallel requests
  if (credentialsFetchPromise) {
    return credentialsFetchPromise;
  }
  
  // If we have valid cached credentials, use them
  if (cachedCredentials && credentialsExpiration && new Date() < credentialsExpiration) {
    console.log('Using cached credentials, expires in:', 
      Math.round((credentialsExpiration.getTime() - new Date().getTime()) / 60000), 'minutes');
    return cachedCredentials;
  }
  
  // Otherwise, fetch new credentials
  try {
    console.log('Fetching new credentials...');
    credentialsFetchPromise = getCredentials();
    const credentials = await credentialsFetchPromise;
    
    // Cache the credentials
    cachedCredentials = credentials;
    
    // Set expiration time (credentials typically expire after 1 hour)
    if (credentials.expiration) {
      credentialsExpiration = credentials.expiration;
      console.log('Credentials will expire at:', credentialsExpiration);
      console.log('Expires in:', 
        Math.round((credentialsExpiration.getTime() - new Date().getTime()) / 60000), 'minutes');
    } else {
      // Default to 55 minutes if no expiration provided
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 55);
      credentialsExpiration = expiration;
      console.log('No expiration provided, using default 55 minutes');
    }
    
    return credentials;
  } finally {
    // Clear the promise when done (whether successful or not)
    credentialsFetchPromise = null;
  }
};

// Generic axios function with error handling and AWS signature
const fetchData = async <T>(url: string, options: AxiosRequestConfig = {}): Promise<T> => {
  try {
    const fullUrl = buildApiUrl(url);
    
    // Get AWS credentials (will use cached credentials if available)
    const credentials = await getCredentialsEfficiently();
    
    // Create headers with AWS credentials and CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Amz-Access-Token': credentials.sessionToken,
      'X-Amz-Access-Key': credentials.accessKeyId,
      
      // Add CORS headers
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Access-Token, X-Amz-Access-Key',
      
      // Add any additional headers from options
      ...(options.headers || {})
    };
    
    // Make the request with AWS credentials in headers
    const response = await axios({
      url: fullUrl,
      method: options.method || 'GET',
      headers,
      data: options.data,
      params: options.params,
      // Add CORS settings
      withCredentials: false,
      timeout: options.timeout,
    });
    
    return handleResponse(response);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data || {};
      throw new ApiError(
        errorData.message || `Request failed with status ${error.response.status}`,
        error.response.status,
        errorData
      );
    }
    logError(error, { url, method: options.method || 'GET' });
    throw error;
  }
};

// API functions that match the original application
export const api = {
  // Access Config
  getAccessConfig: async () => {
    return fetchData('api/accessConfig');
  },
  
  // Change Log
  getChangeLog: async (timestamp: string) => {
    return fetchData(`api/search/${encodeURIComponent('queue:BotChangeLog')}/${encodeURIComponent(timestamp)}`);
  },
  
  // Bot
  getBot: async (botIds: { ids: string[] }) => {
    return fetchData('api/bot', {
      method: 'POST',
      data: botIds,
    });
  },
  
  // Dashboard
  getDashboard: async (id: string, range: string, count: string | number, timestamp: string) => {
    return fetchData(`api/dashboard/${id}`, {
      params: {
        range,
        count: count || 1,
        timestamp
      }
    });
  },
  
  // Cron
  getCron: async (id: string) => {
    return fetchData(`api/cron/${encodeURIComponent(id)}`);
  },
  
  // Queue Schema
  getQueueSchema: async (id: string) => {
    return fetchData(`api/queueSchema/${encodeURIComponent(id)}`);
  },
  
  // Event Settings
  getEventSettings: async () => {
    return fetchData('api/eventSettings');
  },
  
  // Logs
  getLogs: async (logId: string, botId: string, queryString: any) => {
    const params: Record<string, string> = {};
    if (queryString.start) params.start = queryString.start.toString();
    
    return fetchData(`api/logs/${logId}/${botId === 'all' ? 'all' : encodeURIComponent(botId)}`, {
      params
    });
  },
  
  // SDK Config
  getSdkConfig: async () => {
    return fetchData('api/sdkConfig');
  },
  
  // Settings
  getSettings: async () => {
    return fetchData('api/settings');
  },
  
  // Stats
  getStats: async (range: string, count: string | number, timestamp: string) => {
    return fetchData('api/stats_v2', {
      params: {
        range,
        count: count || 1,
        timestamp
      }
    });
  },
  
  // Stats with next part
  getStatsNextPart: async (nextPart: string) => {
    return fetchData('api/stats_v2', {
      params: {
        nextPart
      }
    });
  },
  
  // Cron Save Overrides
  saveCronOverrides: async (data: any) => {
    return fetchData('api/cron/saveOverrides', {
      method: 'POST',
      data,
    });
  },
  
  // Search
  search: async (serverId: string, resumptionToken: string, searchText: string, agg?: any) => {
    const params: Record<string, string> = {};
    if (agg) params.agg = JSON.stringify(agg);
    
    return fetchData(`api/search/${encodeURIComponent(serverId)}/${encodeURIComponent(resumptionToken)}/${encodeURIComponent(searchText)}`, {
      params
    });
  },
  
  // Expose the credentials function for other components
  getCredentials: getCredentialsEfficiently
};

export default api; 