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
import { awsFetch, awsNativeFetch } from '@/lib/authUtils';

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

// Define API methods - all are using axios now via the awsFetch wrapper
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
    
    const response = await awsFetch(url);
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
    
    const response = await awsFetch(url);
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
    
    const response = await awsFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch trace events: ${response.statusText}`);
    }
    return response.json();
  },
  
  getEventDetails: async (queueId: string, eventId: string) => {
    const response = await awsFetch(`/api/trace/${queueId}/events/${eventId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch event details: ${response.statusText}`);
    }
    return response.json();
  },

  // Settings related
  getSettings: async () => {
    const response = await awsFetch('/api/settings');
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }
    return response.json();
  },

  // SDK related
  getSdkConfig: async () => {
    const response = await awsFetch('/api/sdk/config');
    if (!response.ok) {
      throw new Error(`Failed to fetch SDK configuration: ${response.statusText}`);
    }
    return response.json();
  },

  // Cron related
  getCron: async (id: string) => {
    const response = await awsFetch(`/api/cron/${id}`);
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
      
      // Build API URL
      const queryString = params.toString();
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stats_v2${queryString ? `?${queryString}` : ''}`;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Fetching stats with URL:', apiUrl);
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
      
      dispatch({ type: 'SET_BOTS', payload: bots });
      dispatch({ 
        type: 'UPDATE_STATE', 
        payload: { 
          activeBotCount: active.length,
          alarmed,
          alarmedCount: alarmed.length,
          // Store nodes lookup by ID for easy access by components
          nodes: bots.reduce((acc: Record<string, any>, bot: any) => {
            acc[bot.id] = {
              ...bot,
              // Add additional computed fields for UI components
              eventCount: bot.executions || 0,
              errorCount: bot.errors || 0,
              processingTime: bot.duration?.avg || 0,
              // Extract connections from link_to for visualization
              connections: bot.link_to?.children ? 
                Object.keys(bot.link_to.children) : []
            };
            return acc;
          }, {})
        } 
      });
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