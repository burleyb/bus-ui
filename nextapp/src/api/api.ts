// API client for making requests to the backend
import { ApiError, logError } from '@/lib/errorUtils';
import { buildApiUrl } from '@/lib/apiUtils';
import { getAwsCredentials } from '@/lib/awsAuth';
import { API_REGION, API_SERVICE } from '@/config';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
};

// Generic fetch function with error handling and AWS signature
const fetchData = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const fullUrl = buildApiUrl(url);
    
    // Get AWS credentials (will use cached credentials if available)
    const credentials = await getAwsCredentials();
    
    // Create headers with AWS credentials and CORS headers
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('X-Amz-Access-Token', credentials.sessionToken);
    headers.append('X-Amz-Access-Key', credentials.accessKeyId);
    
    // Add CORS headers
    headers.append('Access-Control-Allow-Origin', '*');
    headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Amz-Access-Token, X-Amz-Access-Key');
    
    // Add any additional headers from options
    if (options.headers) {
      const optionHeaders = options.headers as Record<string, string>;
      Object.keys(optionHeaders).forEach(key => {
        headers.append(key, optionHeaders[key]);
      });
    }
    
    // Make the request with AWS credentials in headers
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      // Add CORS mode
      mode: 'cors',
    });
    
    return handleResponse(response);
  } catch (error) {
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
      body: JSON.stringify(botIds),
    });
  },
  
  // Dashboard
  getDashboard: async (id: string, range: string, count: string | number, timestamp: string) => {
    return fetchData(`api/dashboard/${id}?range=${range}&count=${count || 1}&timestamp=${timestamp}`);
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
    const params = new URLSearchParams();
    if (queryString.start) params.append('start', queryString.start.toString());
    
    return fetchData(`api/logs/${logId}/${botId === 'all' ? 'all' : encodeURIComponent(botId)}?${params.toString()}`);
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
    return fetchData(`api/stats_v2?range=${range}&count=${count || 1}&timestamp=${timestamp}`);
  },
  
  // Stats with next part
  getStatsNextPart: async (nextPart: string) => {
    return fetchData(`api/stats_v2?nextPart=${nextPart}`);
  },
  
  // Cron Save Overrides
  saveCronOverrides: async (data: any) => {
    return fetchData('api/cron/saveOverrides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Search
  search: async (serverId: string, resumptionToken: string, searchText: string, agg?: any) => {
    const aggParam = agg ? `?agg=${encodeURIComponent(JSON.stringify(agg))}` : '';
    return fetchData(`api/search/${encodeURIComponent(serverId)}/${encodeURIComponent(resumptionToken)}/${encodeURIComponent(searchText)}${aggParam}`);
  },
};

export default api; 