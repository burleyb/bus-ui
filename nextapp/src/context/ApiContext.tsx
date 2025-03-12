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

// Helper function for fetching and parsing API responses
const fetchAndParse = async (url: string, options?: RequestInit) => {
  const response = await awsNativeFetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  try {
    return await response.json();
  } catch (jsonError: unknown) {
    console.error(`JSON parsing error for ${url}:`, jsonError);
    const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON parse error';
    throw new Error(`Invalid JSON response from ${url}: ${errorMessage}`);
  }
};

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
    
    return fetchAndParse(url);
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
    
    return fetchAndParse(url);
  },

  // Trace related
  getTraceEvents: async (queueId: string, startTime?: string, endTime?: string) => {
    // Create URL parameters
    const params = new URLSearchParams();
    if (startTime) params.append('start', startTime);
    if (endTime) params.append('end', endTime);
    
    const queryString = params.toString();
    const url = `/api/trace/${queueId}/events${queryString ? `?${queryString}` : ''}`;
    
    return fetchAndParse(url);
  },
  
  getEventDetails: async (queueId: string, eventId: string) => {
    return fetchAndParse(`/api/queue/${queueId}/event/${eventId}`);
  },

  // Settings related
  getSettings: async () => {
    return fetchAndParse('/api/settings');
  },

  // SDK related
  getSdkConfig: async () => {
    return fetchAndParse('/api/sdk_config');
  },

  // Cron related
  getCron: async (id: string) => {
    return fetchAndParse(`/api/cron/${id}`);
  },
  
  saveCron: async (data: { 
    id: string; 
    paused?: boolean;
    checkpoint?: Record<string, string>;
    executeNow?: boolean;
  }) => {
    
    const response = await awsNativeFetch('/api/cron/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save cron data: ${response.statusText}`);
    }
    return response.json();
  },
  
  // Metrics data related
  getMetricsData: async (nodeId: string, timePeriodConfig: { range: string; count: number }) => {
    try {
      // Generate current timestamp for the API call
      const timestamp = new Date().toISOString();
      const { range, count } = timePeriodConfig;
      
      // Build API URL with the current time period
      const apiUrl = `/api/dashboard/${nodeId}?range=${range}&count=${count}&timestamp=${encodeURIComponent(timestamp)}`;
      
      // Fetch the data using authenticated request
      const response = await awsNativeFetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics data: ${response.status}`);
      }
      
      // Return the raw API response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      throw error;
    }
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
  getStats: async (range: string, count: number, timestamp: string) => {
    const url = `/api/stats_v2?range=${range}&count=${count}&timestamp=${encodeURIComponent(timestamp)}`;
    return fetchAndParse(url);
  },

  getNodes: async () => {
    return fetchAndParse('/api/nodes');
  },

  getBots: async () => {
    return fetchAndParse('/api/bots');
  },

  getQueues: async () => {
    return fetchAndParse('/api/queues');
  },

  getSystems: async () => {
    return fetchAndParse('/api/systems');
  },

  getNodeDashboard: async (nodeId: string, range: string, count: number, timestamp: string) => {
    const url = `/api/dashboard/${nodeId}?range=${range}&count=${count}&timestamp=${encodeURIComponent(timestamp)}`;
    return fetchAndParse(url);
  },

  getNodeConnections: async (nodeId: string) => {
    return fetchAndParse(`/api/connections/${nodeId}`);
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
  // useSdkConfig();
  
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
  console.log('Initializing useStats hook');
  const { state, dispatch } = useAppContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchFn, setRefetchFn] = useState<() => void>(() => {});
  
  // Helper function to format a date with timezone information
  function formatDateWithTimezone(date: Date): string {
    const pad = (num: number) => (num < 10 ? `0${num}` : `${num}`);
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    // Get timezone offset in minutes and convert to hours and minutes
    const tzOffset = date.getTimezoneOffset();
    const tzSign = tzOffset <= 0 ? '+' : '-';
    const tzHours = pad(Math.abs(Math.floor(tzOffset / 60)));
    const tzMinutes = pad(Math.abs(tzOffset % 60));
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${tzSign}${tzHours}:${tzMinutes}`;
  }

  // Default values for range and count
  let range = 'minute';
  let count = 15;
  let timePeriodString = '';
  let currentInterval = '';
  let hourCount = 1; // Track if we're looking at 1 or 6 hours

  // Only run browser-specific code if window is defined
  if (typeof window !== 'undefined') {
    try {
      // Try to get interval from URL hash first
      const hashValue = decodeURIComponent(window.location.hash.replace('#', ''));
      if (hashValue) {
        const hashObj = JSON.parse(hashValue);
        if (hashObj?.timePeriod?.interval) {
          const interval = hashObj.timePeriod.interval;
          currentInterval = interval;
          
          // Parse intervals with underscore format (like hour_6, hour_12, etc.)
          if (interval.includes('_')) {
            const [base, countStr] = interval.split('_');
            const parsedCount = parseInt(countStr, 10);
            
            if (!isNaN(parsedCount)) {
              currentInterval = base;
              hourCount = parsedCount;
              console.log(`Parsed underscore format: ${interval} -> range=${base}, count=${parsedCount}`);
            }
          }
          
          // Also check by time difference as a fallback
          if (hashObj?.timePeriod?.start && hashObj?.timePeriod?.end) {
            const startDate = new Date(hashObj.timePeriod.start);
            const endDate = new Date(hashObj.timePeriod.end);
            
            // Calculate difference in hours/minutes/etc based on currentInterval
            if (currentInterval === 'hour') {
              const diffHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
              if (diffHours > 1 && hourCount === 1) {
                hourCount = diffHours;
                console.log(`Detected multi-hour interval by time difference: ${diffHours} hours`);
              }
            }
          }
          
          // Convert interval to a format that parseTimePeriod can understand
          if (currentInterval === 'minute') {
            timePeriodString = '15m';
          } else if (currentInterval === 'hour') {
            timePeriodString = `${hourCount}hr`;
          } else if (currentInterval === 'day') {
            timePeriodString = '1d';
          } else if (currentInterval === 'week') {
            timePeriodString = '1w';
          }
          
          // Use the existing parseTimePeriod function for consistency
          const { range: parsedRange, count: parsedCount } = parseTimePeriod(timePeriodString);
          range = parsedRange;
          count = parsedCount;
          
          console.log(`Using interval from URL hash: ${interval}, mapped to timePeriod: ${timePeriodString}, range: ${range}, count: ${count}`);
          
          // Also log the begin and end times if available
          if (hashObj?.timePeriod?.begin && hashObj?.timePeriod?.end) {
            const beginDate = new Date(hashObj.timePeriod.begin);
            const endDate = new Date(hashObj.timePeriod.end);
            console.log(`Time period: ${beginDate.toLocaleString()} to ${endDate.toLocaleString()}`);
          }
        }
      }
    } catch (e) {
      console.error('Error parsing URL hash for interval:', e);
    }
  }

  // Fallback to state.urlObj if direct hash parsing failed
  if (!timePeriodString && state?.urlObj?.timePeriod?.interval) {
    const interval = state.urlObj.timePeriod.interval;
    currentInterval = interval;
    
    // Parse intervals with underscore format (like hour_6, hour_12, etc.)
    if (interval.includes('_')) {
      const [base, countStr] = interval.split('_');
      const parsedCount = parseInt(countStr, 10);
      
      if (!isNaN(parsedCount)) {
        currentInterval = base;
        hourCount = parsedCount;
        console.log(`Parsed underscore format from state: ${interval} -> range=${base}, count=${parsedCount}`);
      }
    }
    
    // Also check by time difference as a fallback
    if (state?.urlObj?.timePeriod && 
        'begin' in state.urlObj.timePeriod && 
        'end' in state.urlObj.timePeriod) {
      const beginDate = new Date(state.urlObj.timePeriod.begin as string);
      const endDate = new Date(state.urlObj.timePeriod.end as string);
      
      // Calculate difference based on currentInterval
      if (currentInterval === 'hour') {
        const diffHours = Math.round((endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60));
        if (diffHours > 1 && hourCount === 1) {
          hourCount = diffHours;
          console.log(`Detected multi-hour interval by time difference from state: ${diffHours} hours`);
        }
      }
    }
    
    // Convert interval to a format that parseTimePeriod can understand
    if (currentInterval === 'minute') {
      timePeriodString = '15m';
    } else if (currentInterval === 'hour') {
      timePeriodString = `${hourCount}hr`;
    } else if (currentInterval === 'day') {
      timePeriodString = '1d';
    } else if (currentInterval === 'week') {
      timePeriodString = '1w';
    }
    
    // Use the existing parseTimePeriod function for consistency
    const { range: parsedRange, count: parsedCount } = parseTimePeriod(timePeriodString);
    range = parsedRange;
    count = parsedCount;
    
    console.log(`Using interval from state.urlObj: ${interval}, mapped to timePeriod: ${timePeriodString}, range: ${range}, count: ${count}`);
  }
  
  // Debug log the detection of multi-hour interval
  if (currentInterval === 'hour' && hourCount > 1) {
    console.log(`Will use range=hour&count=${hourCount} for API query`);
  }

  // Get timestamp from URL hash using state.urlObj
  let timestamp = null;
  
  // Check if we have timePeriod data in the state
  if (state?.urlObj?.timePeriod && 'end' in state.urlObj.timePeriod) {
    let selectedTime = new Date(state.urlObj.timePeriod.end as string);
    let endTime;
    
    // Find the appropriate bucket based on the interval
    switch (currentInterval) {
      case 'minute':
        // For 15-minute interval: find the 15-minute bucket that contains the selected time
        // Buckets are: 00-14, 15-29, 30-44, 45-59
        const minutes = selectedTime.getMinutes();
        const bucketIndex = Math.floor(minutes / 15);
        // End of the bucket is (bucketIndex * 15) + 14 minutes, 59 seconds
        endTime = new Date(selectedTime.getFullYear(), selectedTime.getMonth(), selectedTime.getDate(),
                        selectedTime.getHours(), bucketIndex * 15 + 14, 59, 999);
        console.log('Found 15-minute bucket ending at:', endTime.toLocaleString());
        break;
        
      case 'hour':
        // For hour interval: go to the end of the hour containing the selected time
        endTime = new Date(selectedTime.getFullYear(), selectedTime.getMonth(), selectedTime.getDate(),
                         selectedTime.getHours(), 59, 59, 999);
        console.log('Found hour bucket ending at:', endTime.toLocaleString());
        break;
        
      case 'day':
        // For day interval: go to the end of the day containing the selected time
        endTime = new Date(selectedTime.getFullYear(), selectedTime.getMonth(), selectedTime.getDate(), 
                        23, 59, 59, 999);
        console.log('Found day bucket ending at:', endTime.toLocaleString());
        break;
        
      case 'week':
        // For week interval: find the end of the week containing the selected time
        // In this case, we use the end of the day as the timestamp
        // We need to find the Saturday of the week (end of week)
        const dayOfWeek = selectedTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
        let endOfWeek;
        
        if (dayOfWeek === 6) { // If it's already Saturday
          endOfWeek = new Date(selectedTime);
        } else {
          // Calculate days until Saturday
          const daysUntilSaturday = 6 - dayOfWeek;
          endOfWeek = new Date(selectedTime);
          endOfWeek.setDate(selectedTime.getDate() + daysUntilSaturday);
        }
        
        // Set to end of the day
        endTime = new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(),
                         23, 59, 59, 999);
        console.log('Found week bucket ending at:', endTime.toLocaleString());
        break;
        
      default:
        // Default to using the selected time as is
        endTime = selectedTime;
        console.log('Using selected timestamp as-is for unknown interval:', endTime.toLocaleString());
    }
    
    timestamp = formatDateWithTimezone(endTime);
    console.log('Using timestamp for API query:', timestamp);
  }

  // Final fallback to current time if all else fails
  if (!timestamp) {
    let now = new Date();
    let endTime;
    
    // Find the appropriate bucket based on the interval
    switch (currentInterval) {
      case 'minute':
        // For 15-minute interval: find the current 15-minute bucket
        const minutes = now.getMinutes();
        const bucketIndex = Math.floor(minutes / 15);
        // End of the bucket is (bucketIndex * 15) + 14 minutes, 59 seconds
        endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                         now.getHours(), bucketIndex * 15 + 14, 59, 999);
        console.log('Found current 15-minute bucket ending at:', endTime.toLocaleString());
        break;
        
      case 'hour':
        // For hour interval: go to the end of the current hour
        endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                         now.getHours(), 59, 59, 999);
        console.log('Found current hour bucket ending at:', endTime.toLocaleString());
        break;
        
      case 'day':
        // For day interval: go to the end of the current day
        endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                        23, 59, 59, 999);
        console.log('Found current day bucket ending at:', endTime.toLocaleString());
        break;
        
      case 'week':
        // For week interval: find the end of the current week
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        let endOfWeek;
        
        if (dayOfWeek === 6) { // If it's already Saturday
          endOfWeek = new Date(now);
        } else {
          // Calculate days until Saturday
          const daysUntilSaturday = 6 - dayOfWeek;
          endOfWeek = new Date(now);
          endOfWeek.setDate(now.getDate() + daysUntilSaturday);
        }
        
        // Set to end of the day
        endTime = new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(),
                         23, 59, 59, 999);
        console.log('Found current week bucket ending at:', endTime.toLocaleString());
        break;
        
      default:
        // Default to using the current time as is
        endTime = now;
        console.log('Using current timestamp as-is for unknown interval:', endTime.toLocaleString());
    }
    
    timestamp = formatDateWithTimezone(endTime);
    console.log('Using current time as timestamp:', timestamp);
  }

  const query = useQuery({
    queryKey: ['stats_v2', range, count, timestamp, state?.statsPollingPaused],
    queryFn: async () => {
      try {
        setLoading(true);
        
        // Set query parameters based on the interval
        let queryRange, queryCount;
        
        // Set parameters exactly according to the requirements
        switch (currentInterval) {
          case 'minute':
            // 15 minute interval: range=minute&count=15
            queryRange = 'minute';
            queryCount = 15;
            break;
            
          case 'hour':
            if (hourCount > 1) {
              // 6 hour interval: range=hour&count=6
              queryRange = 'hour';
              queryCount = hourCount;
            } else {
              // 1 hour interval: range=hour&count=1
              queryRange = 'hour';
              queryCount = 1;
            }
            break;
            
          case 'day':
            // 1 day interval: range=day&count=1
            queryRange = 'day';
            queryCount = 1;
            break;
            
          case 'week':
            // 1 week interval: range=day&count=7
            queryRange = 'day';
            queryCount = 7;
            break;
            
          default:
            // Default to 15-minute view if unknown
            queryRange = 'minute';
            queryCount = 15;
            console.log('Using default range and count for unknown interval:', currentInterval);
        }
        
        console.log(`Setting query parameters: range=${queryRange}, count=${queryCount} for interval ${currentInterval}`);
        
        let url = `/api/stats_v2?range=${queryRange}&count=${queryCount}`;
        if (timestamp) {
          url += `&timestamp=${encodeURIComponent(timestamp)}`;
        }
        
        console.log('Fetching stats with URL:', url);
        const response = await awsNativeFetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        console.log('Received stats data:', jsonData);
        
        handleStatsData(jsonData, dispatch);
        setData(jsonData);
        return jsonData;
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError((err as Error).message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 9500,
    refetchOnWindowFocus: false,
    refetchInterval: state?.statsPollingPaused ? undefined : 10000
  });

  // Store the refetch function
  useEffect(() => {
    if (query.refetch) {
      setRefetchFn(() => query.refetch);
    }
  }, [query.refetch]);

  // Process the stats data when it becomes available
  useEffect(() => {
    if (data && dispatch) {
      handleStatsData(data, dispatch);
    }
  }, [data, dispatch]);

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
    const stateUpdates: Partial<any> = {};
    let hasChanges = false;

    // Process bots data if available
    if (data.nodes?.bot) {
      console.log('Processing bot data:', Object.keys(data.nodes.bot).length, 'bots found');
      
      const botsData = Object.values(data.nodes.bot);
      const bots = botsData.map((bot: any) => {
        // First set archived based on either the status or the archived flag
        const isArchived = bot.status === 'archived' || bot.archived;
        
        // Set paused based on status or paused flag, including archived as paused
        const isPaused = bot.paused || bot.status === 'paused' || bot.status === 'archived';
        
        // Check for errors
        const isErrored = (bot.logs && bot.logs.errors && bot.logs.errors.length > 0) || bot.rogue === true;
        
        // Determine effective status
        let effectiveStatus = bot.status;
        
        // Apply logic from the old postProcess function
        if (isArchived) {
          effectiveStatus = 'archived';
        } else if (bot.rogue === true) {
          effectiveStatus = 'rogue';
        } else if (bot.logs && bot.logs.errors && bot.logs.errors.length) {
          effectiveStatus = 'blocked';
        } else if (bot.isAlarmed && (bot.status === 'running' || bot.status === 'paused')) {
          effectiveStatus = 'danger';
        } else if (isPaused) {
          effectiveStatus = 'paused';
        } else {
          // Apply the new status mapping
          effectiveStatus = bot.status === 'running' && bot.executions > 0 ? 'active' : 
                            bot.status === 'running' ? 'idle' :
                            (bot.alarms && Object.keys(bot.alarms).length > 0) ? 'alarmed' : 
                            'inactive';
        }
        
        return {
          ...bot,
          status: effectiveStatus,
          archived: isArchived,
          paused: isPaused,
          errored: isErrored,
          // Extract tags from any available fields for filtering
          tags: [
            ...(bot.templateId ? [bot.templateId] : []),
            ...(bot.owner ? [bot.owner] : []),
            bot.rogue ? 'rogue' : '',
            bot.source ? 'source' : ''
          ].filter(Boolean)
        };
      });

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
      const queues = queuesData.map((queue: any) => {
        // First set archived based on either the status or the archived flag
        const isArchived = queue.status === 'archived' || queue.archived;
        
        // Determine effective status
        let effectiveStatus;
        if (isArchived) {
          effectiveStatus = 'archived';
        } else if (queue.alarms && Object.keys(queue.alarms).length > 0) {
          effectiveStatus = 'alarmed';
        } else {
          effectiveStatus = 'active';
        }
        
        return {
          ...queue,
          // Add computed/derived fields
          status: effectiveStatus,
          archived: isArchived,
          // Extract tags for filtering
          tags: [
            ...(queue.tags ? queue.tags.split(',').filter(Boolean) : []),
            ...(queue.owner ? [queue.owner] : [])
          ].filter(Boolean),
          // Extract connections from link_to for visualization
          connections: queue.link_to?.children ? 
            Object.keys(queue.link_to.children) : []
        };
      });

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
      const systems = systemsData.map((system: any) => {
        // First set archived based on either the status or the archived flag
        const isArchived = system.status === 'archived' || system.archived;
        
        // Determine effective status
        let effectiveStatus;
        if (isArchived) {
          effectiveStatus = 'archived';
        } else if (system.rogue === true) {
          effectiveStatus = 'rogue';
        } else if (system.logs && system.logs.errors && system.logs.errors.length) {
          effectiveStatus = 'blocked';
        } else {
          effectiveStatus = system.status || 'active';
        }
        
        return {
          ...system,
          status: effectiveStatus,
          type: 'system',
          archived: isArchived,
          errored: (system.logs && system.logs.errors && system.logs.errors.length > 0) || system.rogue === true
        };
      });

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
    data: data,
    isLoading: loading,
    isError: !!error,
    error: error,
    refetch: refetchFn
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
  const statsQuery = useStats();
  
  // Create a derived query that just returns the bot data from global state
  // but also provides the refetch capability from stats query
  return {
    data: state?.bots || [],
    isLoading: state?.updatingStats || false,
    isError: false,
    error: null,
    // Forward the refetch method from the stats query
    refetch: statsQuery.refetch
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
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError: unknown) {
          console.error(`JSON parsing error in bot details for ${botId}:`, jsonError);
          const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON parse error';
          throw new Error(`Invalid JSON response for bot ${botId}: ${errorMessage}`);
        }
        
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
    refetchInterval: state?.statsPollingPaused ? Infinity : 10000,
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
        // Use the new API endpoint for event settings
        const response = await awsNativeFetch(`/api/eventsettings/${encodeURIComponent(queueId)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch queue details: ${response.statusText}`);
        }
        
        // Check response content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          console.warn(`Unexpected content type for queue details: ${contentType}`);
        }

        // Clone the response to get the text
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        
        // If the response is empty, return a fallback object instead of throwing
        if (!responseText || responseText.trim() === '') {
          console.warn(`Empty response for queue ${queueId}, using fallback data`);
          
          // Fallback to basic data if available in the state
          const basicInfo = state.nodes[queueId];
          if (basicInfo && Object.keys(basicInfo).length > 0) {
            console.log('Using basic queue info from state');
            return { ...basicInfo, _fromFallback: true };
          }
          
          // Create minimal data if nothing else is available
          console.log('Creating minimal queue data for:', queueId);
          return {
            id: queueId,
            name: queueId.split(':').pop() || queueId,
            type: 'queue',
            status: 'active',
            _fromFallback: true,
            _emptyResponse: true
          };
        }
        
        try {
          // Attempt to parse the JSON manually
          const data = JSON.parse(responseText);
          console.log(`Successfully fetched queue details for: ${queueId}`, data);
          
          // Transform the data structure to match what the app expects
          const transformedData = {
            id: data.event || queueId,
            name: data.name || queueId.split(':').pop() || queueId,
            type: 'queue',
            status: 'active',
            max_eid: data.max_eid,
            v: data.v,
            timestamp: data.timestamp,
            tags: data.tags || '',
            // Keep any other fields that might be present
            ...data
          };
          
          return transformedData;
        } catch (jsonError: unknown) {
          console.error(`JSON parsing error in queue details for ${queueId}:`, jsonError);
          console.error(`Raw response text: "${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}"`);
          
          // For JSON parse errors, also use fallback data instead of throwing
          console.warn(`Invalid JSON response for queue ${queueId}, using fallback data`);
          
          // Fallback to basic data if available
          const basicInfo = state.nodes[queueId];
          if (basicInfo && Object.keys(basicInfo).length > 0) {
            console.log('Using basic queue info from state');
            return { ...basicInfo, _fromFallback: true, _jsonParseError: true };
          }
          
          // Create minimal data if nothing else is available
          return {
            id: queueId,
            name: queueId.split(':').pop() || queueId,
            type: 'queue',
            status: 'active',
            _fromFallback: true,
            _jsonParseError: true
          };
        }
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
    refetchInterval: state?.statsPollingPaused ? Infinity : 10000,
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
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError: unknown) {
          console.error(`JSON parsing error in system details for ${systemId}:`, jsonError);
          const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown JSON parse error';
          throw new Error(`Invalid JSON response for system ${systemId}: ${errorMessage}`);
        }
        
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
    refetchInterval: state?.statsPollingPaused ? Infinity : 10000,
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

// Add mutation hooks here
export function useBotPause() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; paused: boolean }) => API.saveCron(data),
    onSuccess: (data, variables) => {
      // Invalidate the bot details query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['bot-details', variables.id]
      });
      
      // Update the app state to reflect the paused status
      console.log(`Bot ${variables.id} paused status updated to ${variables.paused}`);
    }
  });
}

// Hook for updating bot checkpoint
export function useBotCheckpoint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; checkpoint: Record<string, string> }) => API.saveCron(data),
    onSuccess: (data, variables) => {
      // Invalidate the bot details query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['bot-details', variables.id]
      });
      
      console.log(`Bot ${variables.id} checkpoint updated`);
    }
  });
}

// Hook for forcing bot execution
export function useBotForceRun() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; executeNow: boolean }) => API.saveCron(data),
    onSuccess: (data, variables) => {
      // Invalidate the bot details query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['bot-details', variables.id]
      });
      
      console.log(`Bot ${variables.id} force run initiated`);
    }
  });
}

// Helper to parse time period string into range and count
export function parseTimePeriod(timePeriod: string): { range: string; count: number } {
  let range = 'minute';
  let count = 15;
  
  if (timePeriod) {
    if (timePeriod.endsWith('m')) {
      range = 'minute';
      count = parseInt(timePeriod.replace('m', ''), 10);
    } else if (timePeriod.endsWith('hr')) {
      range = 'hour';
      count = parseInt(timePeriod.replace('hr', ''), 10);
    } else if (timePeriod.endsWith('d')) {
      range = 'day';
      count = parseInt(timePeriod.replace('d', ''), 10);
    } else if (timePeriod.endsWith('w')) {
      range = 'week';
      count = parseInt(timePeriod.replace('w', ''), 10);
    }
  }
  
  return { range, count };
}

// Function to process API response into a usable format with historical data
export function processMetricsData(apiData: any): any {
  // Return processed data with history
  return {
    ...apiData,
  };
}

/**
 * Hook for fetching and processing metrics data for a node
 * @param nodeId The ID of the node to fetch metrics for
 * @param timePeriod The time period for metrics data (e.g., '15m', '1hr')
 * @param refetchInterval Optional refetch interval in milliseconds
 */
export function useMetricsData(
  nodeId: string,
  timePeriod: string = '15m',
  refetchInterval: number | false = false
) {
  // Parse the time period string into range and count
  const timePeriodConfig = parseTimePeriod(timePeriod);
  
  // Use React Query to fetch and cache the metrics data
  return useQuery({
    queryKey: ['metrics', nodeId, timePeriod],
    queryFn: async () => {
      const data = await API.getMetricsData(nodeId, timePeriodConfig);
      return processMetricsData(data);
    },
    enabled: !!nodeId,
    refetchInterval,
    // Keep data fresh while in view
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData, // Show previous data while refetching
  });
}

/**
 * Custom hook to fetch node details data with auto-refresh
 * @param nodeId The ID of the node to fetch data for
 * @param nodeType The type of node (bot, queue, system)
 * @param timePeriod The time period for details data (e.g., '15m', '1hr')
 * @param refetchInterval Optional refetch interval in milliseconds
 */
export function useNodeDetailsData(
  nodeId: string,
  nodeType: 'bot' | 'queue' | 'system',
  timePeriod: string = '15m',
  refetchInterval: number | false = false
) {
  // Parse the time period string into range and count
  const timePeriodConfig = parseTimePeriod(timePeriod);
  const timestamp = new Date().toISOString();
  const { state } = useAppContext();
  
  return useQuery({
    queryKey: ['nodeDetails', nodeId, nodeType, timePeriod],
    queryFn: async () => {
      if (!nodeId) return null;
      
      try {
        // Build the URL
        const apiUrl = `/api/dashboard/${nodeId}?range=${timePeriodConfig.range}&count=${timePeriodConfig.count}&timestamp=${encodeURIComponent(timestamp)}`;
        
        const response = await awsNativeFetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch node details: ${response.status}`);
        }
        
        // Check response content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          console.warn(`Unexpected content type for node details: ${contentType}`);
        }

        // Clone the response to get the text
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        
        // If the response is empty, return an empty object instead of failing
        if (!responseText || responseText.trim() === '') {
          console.warn(`Empty response for node ${nodeId}, using fallback data`);
          
          // Check if we have basic data in state
          const basicInfo = state?.nodes?.[nodeId];
          if (basicInfo && Object.keys(basicInfo).length > 0) {
            console.log(`Using basic ${nodeType} info from state`);
            return {
              ...basicInfo,
              _fromFallback: true,
              _emptyResponse: true
            };
          }
          
          // Return minimal valid data structure needed by the dashboard
          return {
            id: nodeId,
            name: nodeId.split(':').pop() || nodeId,
            type: nodeType,
            status: 'active',
            parentNodes: [],
            childNodes: [],
            _fromFallback: true,
            _emptyResponse: true,
            // Common dashboard data structure
            executions: [],
            errors: [],
            duration: []
          };
        }
        
        try {
          // Attempt to parse the JSON manually
          const data = JSON.parse(responseText);
          return data;
        } catch (jsonError: unknown) {
          console.error(`JSON parsing error in node details for ${nodeId}:`, jsonError);
          console.error(`Raw response text: "${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}"`);
          
          // For JSON parse errors, use fallback data instead of throwing
          console.warn(`Invalid JSON response for ${nodeType} ${nodeId}, using fallback data`);
          
          // Check if we have basic data in state
          const basicInfo = state?.nodes?.[nodeId];
          if (basicInfo && Object.keys(basicInfo).length > 0) {
            console.log(`Using basic ${nodeType} info from state`);
            return {
              ...basicInfo,
              _fromFallback: true,
              _jsonParseError: true
            };
          }
          
          // Return minimal valid data structure needed by the dashboard
          return {
            id: nodeId,
            name: nodeId.split(':').pop() || nodeId,
            type: nodeType,
            status: 'active',
            parentNodes: [],
            childNodes: [],
            _fromFallback: true,
            _jsonParseError: true,
            // Common dashboard data structure
            executions: [],
            errors: [],
            duration: []
          };
        }
      } catch (error) {
        console.error(`Error fetching ${nodeType} details:`, error);
        
        // Check if we have basic data in state
        const basicInfo = state?.nodes?.[nodeId];
        if (basicInfo && Object.keys(basicInfo).length > 0) {
          console.log(`Using basic ${nodeType} info from state`);
          return {
            ...basicInfo,
            _fromFallback: true,
            _fetchError: true
          };
        }
        
        // Return minimal valid data structure
        return {
          id: nodeId,
          name: nodeId.split(':').pop() || nodeId,
          type: nodeType,
          status: 'unknown',
          parentNodes: [],
          childNodes: [],
          _fromFallback: true,
          _fetchError: true,
          // Common dashboard data structure
          executions: [],
          errors: [],
          duration: []
        };
      }
    },
    enabled: !!nodeId,
    refetchInterval,
    // Keep data fresh while in view
    staleTime: 1000 * 10 , 
    placeholderData: (previousData) => previousData, // Show previous data while refetching
  });
}

export function useEventDetails(queueId: string, eventId: string) {
  return useQuery({
    queryKey: ['eventDetails', queueId, eventId],
    queryFn: () => API.getEventDetails(queueId, eventId),
    enabled: !!queueId && !!eventId
  });
}