/**
 * API utility functions
 */
import { API_BASE_URL } from '@/config';
import axios from 'axios';

/**
 * Build a full API URL from a path
 * @param path The API path (without leading slash)
 * @returns The full API URL
 */
export const buildApiUrl = (path: string): string => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Ensure the base URL doesn't end with a slash
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Check if the API is reachable
 * @returns Promise that resolves to true if the API is reachable, false otherwise
 */
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a simple endpoint that should always be available
    const response = await axios({
      url: buildApiUrl('api/settings'),
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

export default {
  buildApiUrl,
  checkApiConnection,
}; 