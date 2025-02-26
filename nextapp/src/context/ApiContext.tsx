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
  useQueryClient
} from '@tanstack/react-query';
import { useAppContext } from './AppContext';
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
    const response = await awsNativeFetch('/api/sdk/config');
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

export function ApiProvider({ children }: ApiProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
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
  const timePeriod = state.urlObj.timePeriod.interval || 'minute_15';
  
  // Parse the time period into range and count
  const [range, countStr] = timePeriod.split('_');
  const count = parseInt(countStr, 10);
  
  // Create query with time period parameters
  const query = useQuery<StatsData, Error, StatsData, [string, string, number]>({
    queryKey: ['stats', range, count],
    queryFn: async () => {
      // Set loading indicator
      dispatch({ type: 'UPDATE_STATE', payload: { updatingStats: true } });
      
      try {
        // Call API with time period parameters and current timestamp
        return await API.getStats(range, count, new Date().toISOString());
      } finally {
        // Clear loading indicator when done (success or error)
        dispatch({ type: 'UPDATE_STATE', payload: { updatingStats: false } });
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
    if (query.data) {
      handleStatsData(query.data);
    }
  }, [query.data]);

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

  // Process the stats data and update global state
  const handleStatsData = (data: StatsData) => {
    // Process and save bots data
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
      
      dispatch({ type: 'SET_BOTS', payload: bots });
      dispatch({ 
        type: 'UPDATE_STATE', 
        payload: { 
          activeBotCount: active.length,
          alarmed,
          alarmedCount: alarmed.length,
          // Store nodes lookup by ID for easy access by components
          nodes: nodesObj
        } 
      });
    } else {
      console.log('No bot data found in stats response');
    }

    // Process and save queues data
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

      dispatch({ type: 'UPDATE_STATE', payload: { 
        queues,
        // Update nodes lookup to include queues
        nodes: {
          ...state.nodes,
          ...queues.reduce((acc: Record<string, any>, queue: any) => {
            acc[queue.id] = {
              ...queue,
              type: 'queue'
            };
            return acc;
          }, {})
        }
      }});
    }

    // Process and save systems data
    if (data.nodes?.system) {
      const systemsData = Object.values(data.nodes.system);
      const systems = systemsData.map((system: any) => ({
        ...system,
        // Normalize status field for UI consistency
        status: system.status || 'active',
        type: 'system'
      }));

      dispatch({ type: 'UPDATE_STATE', payload: { 
        systems,
        // Update nodes lookup to include systems
        nodes: {
          ...state.nodes,
          ...systems.reduce((acc: Record<string, any>, system: any) => {
            acc[system.id] = system;
            return acc;
          }, {})
        }
      }});
    }

    // Update total events counter
    if (data.totalEvents !== undefined) {
      dispatch({ type: 'UPDATE_STATE', payload: { totalEvents: data.totalEvents } });
    }

    // Update system types
    if (data.systemTypes) {
      dispatch({ type: 'UPDATE_STATE', payload: { systemTypes: data.systemTypes } });
    }

    // Save the entire stats response
    dispatch({ type: 'SET_STATS', payload: data });
  };

  return query;
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
  return useQuery({
    queryKey: ['settings'],
    queryFn: API.getSettings,
  });
}

export function useSdkConfig() {
  return useQuery({
    queryKey: ['sdk-config'],
    queryFn: API.getSdkConfig,
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
  const { state } = useAppContext();
  
  // Create a derived query that just returns the bot data from global state
  // This matches the structure that CatalogList.tsx expects
  return {
    data: state.bots || [],
    isLoading: state.updatingStats,
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