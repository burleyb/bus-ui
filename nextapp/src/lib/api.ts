export interface QueueEvent {
  id: string;
  queueId: string;
  eventId: string;
  timestamp: string;
  payload: any;
  metadata: Record<string, any>;
}

export interface QueueEventsResponse {
  results: QueueEvent[];
  resumptionToken?: string;
  last_time?: number;
  count?: number;
  agg?: Record<string, any>;
}

// Import the awsNativeFetch function
import { awsNativeFetch } from './authUtils';

export const API = {
  /**
   * Search for events in a queue
   * @param queueId The queue ID to search in (format: queue:name)
   * @param eid The event ID to search from (optional)
   * @param searchText Text to search for in the events (optional)
   * @param count The maximum number of events to return (optional, default 100)
   * @returns Promise with the search results
   */
  searchQueueEvents: async (
    queueId: string,
    eid?: string, 
    searchText?: string,
    count: number = 100
  ): Promise<QueueEventsResponse> => {
    if (!queueId) {
      console.error('No queueId provided to searchQueueEvents');
      return { results: [] };
    }
    
    // Ensure queueId starts with queue: prefix
    if (!queueId.startsWith('queue:')) {
      queueId = `queue:${queueId}`;
    }
    
    // Build the URL - Note: The API path starts with /api/search, not just /search
    let url = `/api/search/${queueId}`;
    
    // Add EID parameter if provided
    if (eid) {
      url += `/${eid}`;
      
      // Add search text if provided
      if (searchText) {
        url += `/${encodeURIComponent(searchText)}`;
      }
    }
    
    // Add count as a query parameter
    url += `?count=${count}`;
    
    console.log(`[API] Searching queue events at URL: ${url}`);
    
    try {
      const response = await awsNativeFetch(url);
      
      if (!response.ok) {
        console.error(`[API] Error searching queue events: ${response.status} ${response.statusText}`);
        return { results: [] };
      }
      
      const data = await response.json();
      console.log(`[API] Queue events response:`, {
        status: response.status,
        dataStructure: data.results ? 'Has results array' : 'No results array',
        resultCount: data.results ? data.results.length : 0,
        resumptionToken: data.resumptionToken || 'none'
      });
      
      // Check if the response has a results array, if not, return an empty results array
      if (!data || !data.results) {
        console.warn('[API] Response does not contain a results array', data);
        return { results: [] };
      }
      
      return data;
    } catch (error) {
      console.error('[API] Error searching queue events:', error);
      return { results: [] };
    }
  },
  
  /**
   * Save node settings
   * @param nodeId The node ID (format: bot:name, queue:name, system:name)
   * @param settings The settings to save
   * @returns Promise with the save result
   */
  saveNodeSettings: async (
    nodeId: string,
    settings: Record<string, any>
  ): Promise<any> => {
    if (!nodeId) {
      console.error('No nodeId provided to saveNodeSettings');
      return { error: 'No node ID provided' };
    }
    
    // Build the URL
    const url = `/api/cron/save`;
    
    // Create payload with node ID and settings
    const payload = {
      id: nodeId,
      ...settings
    };
    
    console.log(`[API] Saving node settings:`, payload);
    
    try {
      const response = await awsNativeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.error(`[API] Error saving node settings: ${response.status} ${response.statusText}`);
        return { error: `Failed to save settings: ${response.statusText}` };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[API] Error saving node settings:', error);
      return { error: 'Failed to save settings' };
    }
  },
  
  /**
   * Execute a node immediately
   * @param nodeId The node ID (format: bot:name)
   * @returns Promise with the execution result
   */
  executeNodeNow: async (nodeId: string): Promise<any> => {
    return API.saveNodeSettings(nodeId, { executeNow: true });
  },
  
  /**
   * Toggle node pause state
   * @param nodeId The node ID
   * @param paused Whether the node should be paused
   * @returns Promise with the toggle result
   */
  toggleNodePause: async (nodeId: string, paused: boolean): Promise<any> => {
    return API.saveNodeSettings(nodeId, { paused });
  },
  
  /**
   * Reset node checkpoint
   * @param nodeId The node ID
   * @param eid The event ID to set as the checkpoint
   * @returns Promise with the reset result
   */
  resetNodeCheckpoint: async (nodeId: string, eid: string): Promise<any> => {
    return API.saveNodeSettings(nodeId, { eid });
  },
  
  /**
   * Get current node checkpoint
   * @param nodeId The node ID
   * @returns Promise with the checkpoint information
   */
  getNodeCheckpoint: async (nodeId: string): Promise<any> => {
    if (!nodeId) {
      console.error('No nodeId provided to getNodeCheckpoint');
      return { error: 'No node ID provided' };
    }
    
    // Build the URL
    const url = `/api/cron/checkpoint/${nodeId}`;
    
    try {
      const response = await awsNativeFetch(url);
      
      if (!response.ok) {
        console.error(`[API] Error getting node checkpoint: ${response.status} ${response.statusText}`);
        return { error: `Failed to get checkpoint: ${response.statusText}` };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[API] Error getting node checkpoint:', error);
      return { error: 'Failed to get checkpoint' };
    }
  }
}; 