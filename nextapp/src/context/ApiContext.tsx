"use client";

import React, { 
  ReactNode, 
  createContext, 
  useContext, 
  useEffect,
  useMemo,
  useState
} from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useMutation, 
  useQuery,
  useQueryClient,
  UseQueryResult
} from '@tanstack/react-query';
import { useAppContext } from './AppContext';
import type { AppState } from './AppContext';
import { awsNativeFetch } from '@/lib/authUtils';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Define API methods - all are using axios now via the awsNativeFetch wrapper
const API = {
  // Dashboard related
  getDashboard: async (id: string, rangeCount?: any, timestamp?: any) => {
    // Create URL parameters
    const params = new URLSearchParams();
    if (id) params.append('id', id);
    if (rangeCount) params.append('rangeCount', rangeCount);
    if (timestamp) params.append('timestamp', timestamp);
    
    const queryString = params.toString();
    const url = `/api/dashboard${queryString ? `?${queryString}` : ''}`;
    
    const response = await awsNativeFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
    }
    return response.json();
  },

  // Logs related
  getLogs: async (botId: string, result?: string, customTimeFrame?: any) => {
    // Create URL parameters
    const params = new URLSearchParams();
    if (result) params.append('result', result);
    if (customTimeFrame) {
      if (customTimeFrame.from) params.append('from', customTimeFrame.from);
      if (customTimeFrame.to) params.append('to', customTimeFrame.to);
    }
    
    const queryString = params.toString();
    const url = `/api/logs/${botId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await awsNativeFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }
    return response.json();
  },

  // Trace related
  getTraceEvents: async (queueId: string, startTime?: string, endTime?: string) => {
    // Create URL parameters
    const params = new URLSearchParams();
    if (startTime) params.append('start', startTime);
    if (endTime) params.append('end', endTime);
    
    const queryString = params.toString();
    const url = `/api/trace/${queueId}/events${queryString ? `?${queryString}` : ''}`;
    
    const response = await awsNativeFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch trace events: ${response.statusText}`);
    }
    return response.json();
  },
  
  getEventDetails: async (queueId: string, eventId: string) => {
    const response = await awsNativeFetch(`/api/trace/${queueId}/events/${eventId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch event details: ${response.statusText}`);
    }
    return response.json();
  },

  // Settings related
  getSettings: async () => {
    const response = await awsNativeFetch('/api/settings');
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }
    return response.json();
  },

  // SDK related
  getSdkConfig: async () => {
    const response = await awsNativeFetch('/api/sdkConfig');
    if (!response.ok) {
      throw new Error(`Failed to fetch SDK configuration: ${response.statusText}`);
    }
    return response.json();
  },

  // Cron related
  getCron: async (id: string) => {
    const response = await awsNativeFetch(`/api/cron/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cron data: ${response.statusText}`);
    }
    return response.json();
  },
  
  // Search Queue Events - new function to search for events in a queue
  searchQueueEvents: async (queueId: string, eid?: string, searchText?: string, count?: number) => {
    try {
      // Format the URL with the required parameters
      let url = `/api/search/${encodeURIComponent(queueId)}`;
      
      // Add the EID if provided
      if (eid) {
        url += `/${encodeURIComponent(eid)}`;
        
        // Add the search text if provided
        if (searchText) {
          url += `/${encodeURIComponent(searchText)}`;
        }
      }
      
      // Add count as a query parameter if specified
      const params = new URLSearchParams();
      if (count) {
        params.append('count', count.toString());
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Searching queue events:', url);
      }
      
      const response = await awsNativeFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error searching queue events:', error);
      throw error;
    }
  },

  searchSystemEvents: async (systemId: string, eid?: string, searchText?: string, count?: number) => {
    try {
      // Format the URL with the required parameters
      let url = `/api/search/${encodeURIComponent(systemId)}`;
      
      // Add the EID if provided
      if (eid) {
        url += `/${encodeURIComponent(eid)}`;
        
        // Add the search text if provided
        if (searchText) {
          url += `/${encodeURIComponent(searchText)}`;
        }
      }
      
      // Add count as a query parameter if specified
      const params = new URLSearchParams();
      if (count) {
        params.append('count', count.toString());
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Searching queue events:', url);
      }
      
      const response = await awsNativeFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error searching queue events:', error);
      throw error;
    }
  },
  
  // Stats related - provides essential system data
  getStats: async (range?: string, count?: number | string, timestamp?: string) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (range) params.append('range', range);
      if (count) params.append('count', count.toString());
      if (timestamp) params.append('timestamp', timestamp);
      
      // Build API URL with relative path
      const queryString = params.toString();
      const apiUrl = `/api/stats_v2${queryString ? `?${queryString}` : ''}`;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Preparing to fetch stats from:', apiUrl);
      }
      
      // Use our custom fetch implementation with AWS SigV4
      const response = await awsNativeFetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },
};

// Create provider
interface ApiProviderProps {
  children: ReactNode;
}

// Create a ApiInitializer component to initialize API calls
function ApiInitializer() {
  console.log('ApiInitializer: Starting global API initialization');
  
  // Get app context for state
  const { state } = useAppContext();
  
  // Initialize stats polling (primary system data)
  useStats();
  
  // Initialize settings (global application settings)
  useSettings();
  
  // Initialize SDK configuration
  useSdkConfig();
  
  // Initialize bots data
  // This is conditional since it may depend on other data being loaded first
  const shouldLoadBots = state && state.hasData;
  const botsQuery = useBots();
  
  // Log initialization status
  useEffect(() => {
    console.log('ApiInitializer: Global API calls initialized');
    return () => {
      console.log('ApiInitializer: Cleaning up global API calls');
    };
  }, []);
  
  return null; // This component doesn't render anything
}

export function ApiProvider({ children }: ApiProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiInitializer />
      {children}
    </QueryClientProvider>
  );
}

// Create custom hooks to use the API
export function useDashboard(id: string, rangeCount?: any, timestamp?: any) {
  const { state, dispatch } = useAppContext();
  
  return useQuery({
    queryKey: ['dashboard', id, rangeCount, timestamp],
    queryFn: () => API.getDashboard(id, rangeCount, timestamp),
    enabled: !!id
  });
}

export function useStats() {
  const { state, dispatch } = useAppContext();
  
  // Add console log to track hook initialization
  console.log('useStats hook initialized');

  // Extract time period from application state (default to 15 minutes if not set)
  const timePeriod = useMemo(() => 
    state?.urlObj?.timePeriod?.interval || 'minute_15',
  [state?.urlObj?.timePeriod?.interval]);
  
  // Parse the time period into range and count
  const [range, countStr] = useMemo(() => {
    const parts = timePeriod.split('_');
    return parts.length > 1 ? [parts[0], parts[1]] : ['minute', '15'];
  }, [timePeriod]);
  
  const count = useMemo(() => 
    parseInt(countStr, 10),
  [countStr]);
  
  // Create query with time period parameters
  const query = useQuery<StatsData, Error, StatsData, [string, string, number]>({
    queryKey: ['stats', range, count],
    queryFn: async () => {
      try {
        // Only set loading if this is the first load or if it's been more than 5 seconds since the last update
        const shouldShowLoading = !state?.nodes || Object.keys(state?.nodes || {}).length === 0 || 
                               (!state?.lastStatsUpdate || 
                                (new Date().getTime() - (state?.lastStatsUpdate || 0)) > 5000);
        
        if (shouldShowLoading && dispatch) {
          dispatch({ type: 'UPDATE_STATE', payload: { updatingStats: true } });
        }
        
        // Call API with time period parameters and current timestamp
        return await API.getStats(range, count, new Date().toISOString());
      } finally {
        // Record the time of this update
        if (dispatch) {
          const now = new Date().getTime();
          dispatch({ 
            type: 'UPDATE_STATE', 
            payload: { 
              updatingStats: false,
              lastStatsUpdate: now
            } 
          });
        }
      }
    },
    // Poll every 10 seconds
    refetchInterval: 10000,
    // Data stays fresh for 9.5 seconds
    staleTime: 9500,
    // Don't refetch on window focus as we're already polling
    refetchOnWindowFocus: false,
  });

  // Process the stats data when it becomes available
  useEffect(() => {
    if (query.data && dispatch) {
      handleStatsData(query.data, dispatch);
    }
  }, [query.data, dispatch]);

  // Define the expected shape of the stats data
  interface StatsData {
    start?: number;
    end?: number;
    period?: string;
    nodes?: {
      bot?: Record<string, any>;
      queue?: Record<string, any>;
      system?: Record<string, any>;
    };
    nextPart?: string;
    totalEvents?: number;
    systemTypes?: any;
  }

  // Deep equality check for objects
  const areObjectsEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      const val1 = obj1[key];
      const val2 = obj2[key];
      
      if (typeof val1 === 'object' && typeof val2 === 'object') {
        if (!areObjectsEqual(val1, val2)) return false;
      } else if (val1 !== val2) {
        return false;
      }
    }
    
    return true;
  };

  // Process the stats data and update global state
  const handleStatsData = (data: StatsData, dispatch: React.Dispatch<any>) => {
    // Prepare a single state update to apply at the end
    const stateUpdates: Partial<AppState> = {};
    let hasChanges = false;

    // Process bots data if available
    if (data.nodes?.bot) {
      console.log('Processing bot data:', Object.keys(data.nodes.bot).length, 'bots found');
      
      const botsData = Object.values(data.nodes.bot);
      const bots = botsData.map((bot: any) => ({
        ...bot,
        // Normalize status field for UI consistency
        status: bot.status === 'running' && bot.executions > 0 ? 'active' : 
                bot.status === 'running' ? 'idle' :
                (bot.alarms && Object.keys(bot.alarms).length > 0) ? 'alarmed' : 
                'inactive',
        // Extract tags from any available fields for filtering
        tags: [
          ...(bot.templateId ? [bot.templateId] : []),
          ...(bot.owner ? [bot.owner] : []),
          bot.rogue ? 'rogue' : '',
          bot.source ? 'source' : ''
        ].filter(Boolean)
      }));

      // Check if bots have actually changed
      if (!areObjectsEqual(bots, state.bots)) {
        dispatch({ type: 'SET_BOTS', payload: bots });
        hasChanges = true;
      }

      const active = bots.filter((bot: any) => bot.status === 'active' || bot.status === 'idle');
      const alarmed = bots.filter((bot: any) => 
        bot.status === 'alarmed' || 
        (bot.alarms && Object.keys(bot.alarms).length > 0)
      );
      
      // Create nodes object for state update
      const nodesObj = bots.reduce((acc: Record<string, any>, bot: any) => {
        acc[bot.id] = {
          ...bot,
          type: 'bot', // Ensure type is explicitly set
          // Add additional computed fields for UI components
          eventCount: bot.executions || 0,
          errorCount: bot.errors || 0,
          processingTime: bot.duration?.avg || 0,
          // Extract connections from link_to for visualization
          connections: bot.link_to?.children ? 
            Object.keys(bot.link_to.children) : []
        };
        return acc;
      }, {});
      
      console.log('Processed bot data:', Object.keys(nodesObj).length, 'bots ready for state update');
      
      // Only update if values have changed
      if (active.length !== state.activeBotCount) {
        stateUpdates.activeBotCount = active.length;
        hasChanges = true;
      }
      
      if (!areObjectsEqual(alarmed, state.alarmed)) {
        stateUpdates.alarmed = alarmed;
        stateUpdates.alarmedCount = alarmed.length;
        hasChanges = true;
      }
      
      // Only update nodes if they've changed
      const currentBotNodes = Object.fromEntries(
        Object.entries(state.nodes || {}).filter(([_, node]) => node.type === 'bot')
      );
      
      if (!areObjectsEqual(nodesObj, currentBotNodes)) {
        const updatedNodes = { ...(state.nodes || {}), ...nodesObj };
        stateUpdates.nodes = updatedNodes;
        hasChanges = true;
      }
    } else {
      console.log('No bot data found in stats response');
    }

    // Process queues data if available
    if (data.nodes?.queue) {
      const queuesData = Object.values(data.nodes.queue);
      const queues = queuesData.map((queue: any) => ({
        ...queue,
        // Add computed/derived fields
        status: queue.alarms && Object.keys(queue.alarms).length > 0 ? 'alarmed' : 'active',
        // Extract tags for filtering
        tags: [
          ...(queue.tags ? queue.tags.split(',').filter(Boolean) : []),
          ...(queue.owner ? [queue.owner] : [])
        ].filter(Boolean),
        // Extract connections from link_to for visualization
        connections: queue.link_to?.children ? 
          Object.keys(queue.link_to.children) : []
      }));

      // Only update if queues have changed
      if (!areObjectsEqual(queues, state.queues)) {
        stateUpdates.queues = queues;
        hasChanges = true;
        
        // Update nodes lookup to include queues, preserving any existing nodes
        const queueNodes = queues.reduce((acc: Record<string, any>, queue: any) => {
          acc[queue.id] = {
            ...queue,
            type: 'queue'
          };
          return acc;
        }, {});
        
        // Check if queue nodes have changed
        const currentQueueNodes = Object.fromEntries(
          Object.entries(state.nodes || {}).filter(([_, node]) => node.type === 'queue')
        );
        
        if (!areObjectsEqual(queueNodes, currentQueueNodes)) {
          stateUpdates.nodes = {
            ...(stateUpdates.nodes || state.nodes || {}),
            ...queueNodes
          };
          hasChanges = true;
        }
      }
    }

    // Process systems data if available
    if (data.nodes?.system) {
      const systemsData = Object.values(data.nodes.system);
      const systems = systemsData.map((system: any) => ({
        ...system,
        // Normalize status field for UI consistency
        status: system.status || 'active',
        type: 'system'
      }));

      // Only update if systems have changed
      if (!areObjectsEqual(systems, state.systems)) {
        stateUpdates.systems = systems;
        hasChanges = true;
        
        // Update nodes lookup to include systems
        const systemNodes = systems.reduce((acc: Record<string, any>, system: any) => {
          acc[system.id] = system;
          return acc;
        }, {});
        
        // Check if system nodes have changed
        const currentSystemNodes = Object.fromEntries(
          Object.entries(state.nodes || {}).filter(([_, node]) => node.type === 'system')
        );
        
        if (!areObjectsEqual(systemNodes, currentSystemNodes)) {
          stateUpdates.nodes = {
            ...(stateUpdates.nodes || state.nodes || {}),
            ...systemNodes
          };
          hasChanges = true;
        }
      }
    }
    
    // Apply all state updates in a single dispatch only if there are changes
    if (hasChanges && Object.keys(stateUpdates).length > 0) {
      console.log('Updating state with changes:', Object.keys(stateUpdates).join(', '));
      dispatch({ type: 'UPDATE_STATE', payload: stateUpdates });
    } else {
      console.log('No state changes detected in stats update');
    }
  };

  return {
    data: query.data,
    isLoading: state.updatingStats,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}

export function useLogs(botId: string, result?: string, customTimeFrame?: any) {
  return useQuery({
    queryKey: ['logs', botId, result, customTimeFrame],
    queryFn: () => API.getLogs(botId, result, customTimeFrame),
    enabled: !!botId
  });
}

export function useTraceEvents(queueId: string, startTime?: string, endTime?: string) {
  return useQuery({
    queryKey: ['traceEvents', queueId, startTime, endTime],
    queryFn: () => API.getTraceEvents(queueId, startTime, endTime),
    enabled: !!queueId,
    placeholderData: { events: [] }
  });
}

export function useEventDetails(queueId: string, eventId: string) {
  return useQuery({
    queryKey: ['eventDetails', queueId, eventId],
    queryFn: () => API.getEventDetails(queueId, eventId),
    enabled: !!queueId && !!eventId
  });
}

export function useSettings() {
  console.log('useSettings hook initialized');
  
  return useQuery({
    queryKey: ['settings'],
    queryFn: API.getSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3
  });
}

export function useSdkConfig() {
  console.log('useSdkConfig hook initialized');
  
  return useQuery({
    queryKey: ['sdk-config'],
    queryFn: API.getSdkConfig,
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 3
  });
}

export function useCron(id: string) {
  return useQuery({
    queryKey: ['cron', id],
    queryFn: () => API.getCron(id),
    enabled: !!id,
  });
}

// Add the missing useBots function
export function useBots() {
  console.log('useBots hook initialized');
  const { state } = useAppContext();
  
  // Create a derived query that just returns the bot data from global state
  // This matches the structure that CatalogList.tsx expects
  return {
    data: state?.bots || [],
    isLoading: state?.updatingStats || false,
    isError: false,
    error: null
  };
}

// Add hooks for fetching detailed node information
export function useBotDetails(botId: string) {
  const { state } = useAppContext();
  
  return useQuery({
    queryKey: ['bot-details', botId],
    queryFn: async () => {
      try {
        console.log(`Fetching bot details for: ${botId}`);
        // Use the correct API endpoint format
        const response = await awsNativeFetch(`/api/cron/${botId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch bot details: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched bot details for: ${botId}`, data);
        return data;
      } catch (error) {
        console.error('Error fetching bot details:', error);
        
        // Fallback to basic data if available
        const basicInfo = state.nodes[botId];
        if (basicInfo && Object.keys(basicInfo).length > 0) {
          console.log('Falling back to basic bot info from state');
          return { ...basicInfo, _fromFallback: true };
        }
        
        // Create minimal data if nothing else is available
        console.log('Creating minimal bot data for:', botId);
        return {
          id: botId,
          name: botId.split(':').pop() || botId,
          type: 'bot',
          status: 'unknown',
          _fromFallback: true
        };
      }
    },
    enabled: !!botId,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000)
  });
}

export function useQueueDetails(queueId: string) {
  const { state } = useAppContext();
  
  return useQuery({
    queryKey: ['queue-details', queueId],
    queryFn: async () => {
      try {
        console.log(`Fetching queue details for: ${queueId}`);
        // Use the correct API endpoint format
        const response = await awsNativeFetch(`/api/cron/${queueId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch queue details: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched queue details for: ${queueId}`, data);
        return data;
      } catch (error) {
        console.error('Error fetching queue details:', error);
        
        // Fallback to basic data if available
        const basicInfo = state.nodes[queueId];
        if (basicInfo && Object.keys(basicInfo).length > 0) {
          console.log('Falling back to basic queue info from state');
          return { ...basicInfo, _fromFallback: true };
        }
        
        // Create minimal data if nothing else is available
        console.log('Creating minimal queue data for:', queueId);
        return {
          id: queueId,
          name: queueId.split(':').pop() || queueId,
          type: 'queue',
          status: 'unknown',
          _fromFallback: true
        };
      }
    },
    enabled: !!queueId,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000)
  });
}

export function useSystemDetails(systemId: string) {
  const { state } = useAppContext();
  
  return useQuery({
    queryKey: ['system-details', systemId],
    queryFn: async () => {
      try {
        console.log(`Fetching system details for: ${systemId}`);
        // Use the correct API endpoint format
        const response = await awsNativeFetch(`/api/cron/${systemId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch system details: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched system details for: ${systemId}`, data);
        return data;
      } catch (error) {
        console.error('Error fetching system details:', error);
        
        // Fallback to basic data if available
        const basicInfo = state.nodes[systemId];
        if (basicInfo && Object.keys(basicInfo).length > 0) {
          console.log('Falling back to basic system info from state');
          return { ...basicInfo, _fromFallback: true };
        }
        
        // Create minimal data if nothing else is available
        console.log('Creating minimal system data for:', systemId);
        return {
          id: systemId,
          name: systemId.split(':').pop() || systemId,
          type: 'system',
          status: 'unknown',
          _fromFallback: true
        };
      }
    },
    enabled: !!systemId,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000)
  });
}

// Unified hook that returns the right query based on node type
export function useNodeDetails(nodeId: string, nodeType?: 'bot' | 'queue' | 'system') {
  const botDetailsQuery = useBotDetails(nodeType === 'bot' ? nodeId : '');
  const queueDetailsQuery = useQueueDetails(nodeType === 'queue' ? nodeId : '');
  const systemDetailsQuery = useSystemDetails(nodeType === 'system' ? nodeId : '');
  
  // Return the appropriate query based on node type
  if (nodeType === 'bot') return botDetailsQuery;
  if (nodeType === 'queue') return queueDetailsQuery;
  if (nodeType === 'system') return systemDetailsQuery;
  
  // If no type is provided, return a placeholder
  return {
    data: null,
    isLoading: false,
    isError: false,
    error: null
  };
}

/**
 * Hook to search for events in a queue
 * @param queueId The queue ID to search in
 * @param eid The EID to search from (optional)
 * @param searchText Text to search for in events (optional)
 * @param count Maximum number of events to return (default: 100)
 */
export function useSearchQueueEvents(
  queueId?: string,
  eid?: string,
  searchText?: string,
  count: number = 100
) {
  // Create a query key for caching and refetching
  const queryKey = ['queue-events', queueId, eid, searchText, count];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!queueId) {
        console.warn('[HOOK] No queue ID provided for useSearchQueueEvents');
        return { results: [], resumptionToken: null };
      }
      
      try {
        console.log(`[HOOK] Searching queue events:`, { queueId, eid, searchText, count });
        const response = await API.searchQueueEvents(queueId, eid, searchText, count);
        
        if (!response) {
          console.warn('[HOOK] No data returned from searchQueueEvents');
          return { results: [], resumptionToken: null };
        }
        
        // Check if the response has a results array
        if (!response.results) {
          console.warn('[HOOK] Response does not contain a results array:', response);
          return { results: [], resumptionToken: response.resumptionToken || null };
        }
        
        if (!Array.isArray(response.results)) {
          console.warn('[HOOK] Results is not an array:', response.results);
          return { results: [], resumptionToken: response.resumptionToken || null };
        }
        
        console.log(`[HOOK] Found ${response.results.length} queue events, resumptionToken: ${response.resumptionToken || 'none'}`);
        return response;
      } catch (error) {
        console.error('[HOOK] Error searching queue events:', error);
        throw error; // Let React Query handle the error state
      }
    },
    enabled: !!queueId, // Only run the query if we have a queueId
    staleTime: 1000 * 60, // 1 minute
    refetchOnMount: true,
    retry: 1,            // Retry failed requests once
  });
} 

/**
 * Hook to search for events in a system
 * @param systemId The system ID to search in
 * @param eid The EID to search from (optional)
 * @param searchText Text to search for in events (optional)
 * @param count Maximum number of events to return (default: 100)
 */
export function useSearchSystemEvents(
  systemId?: string,
  eid?: string,
  searchText?: string,
  count: number = 100
) {
  // Create a query key for caching and refetching
  const queryKey = ['queue-events', systemId, eid, searchText, count];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!systemId) {
        console.warn('[HOOK] No system ID provided for useSearchSystemEvents');
        return { results: [], resumptionToken: null };
      }
      
      try {
        console.log(`[HOOK] Searching system events:`, { systemId, eid, searchText, count });
        const response = await API.searchSystemEvents(systemId, eid, searchText, count);
        
        if (!response) {
          console.warn('[HOOK] No data returned from searchSystemEvents');
          return { results: [], resumptionToken: null };
        }
        
        // Check if the response has a results array
        if (!response.results) {
          console.warn('[HOOK] Response does not contain a results array:', response);
          return { results: [], resumptionToken: response.resumptionToken || null };
        }
        
        if (!Array.isArray(response.results)) {
          console.warn('[HOOK] Results is not an array:', response.results);
          return { results: [], resumptionToken: response.resumptionToken || null };
        }
        
        console.log(`[HOOK] Found ${response.results.length} system events, resumptionToken: ${response.resumptionToken || 'none'}`);
        return response;
      } catch (error) {
        console.error('[HOOK] Error searching system events:', error);
        throw error; // Let React Query handle the error state
      }
    },
    enabled: !!systemId, // Only run the query if we have a systemId
    staleTime: 1000 * 60, // 1 minute
    refetchOnMount: true,
    retry: 1,            // Retry failed requests once
  });
} 