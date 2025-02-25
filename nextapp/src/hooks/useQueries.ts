import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/api';
import moment from 'moment';

// Define types for the stats data
interface StatsData {
  nodes?: {
    bot?: Record<string, any>;
    queue?: Record<string, any>;
    system?: Record<string, any>;
  };
  [key: string]: any;
}

// Refresh intervals in milliseconds
const REFRESH_INTERVAL = 30 * 1000; // 30 seconds
const STATS_REFRESH_INTERVAL = 10 * 1000; // 10 seconds

// Access Config
export const useAccessConfig = () => {
  return useQuery({
    queryKey: ['accessConfig'],
    queryFn: api.getAccessConfig,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Change Log
export const useChangeLog = (timestamp: string) => {
  return useQuery({
    queryKey: ['changeLog', timestamp],
    queryFn: () => api.getChangeLog(timestamp),
    enabled: !!timestamp,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Bot
export const useBot = (botIds: { ids: string[] }) => {
  return useQuery({
    queryKey: ['bot', botIds],
    queryFn: () => api.getBot(botIds),
    enabled: !!botIds && botIds.ids.length > 0,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Dashboard
export const useDashboard = (id: string, range: string = 'minute', count: string | number = 15) => {
  return useQuery({
    queryKey: ['dashboard', id, range, count],
    queryFn: () => api.getDashboard(id, range, count, moment().format()),
    enabled: !!id,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Cron
export const useCron = (id: string) => {
  return useQuery({
    queryKey: ['cron', id],
    queryFn: () => api.getCron(id),
    enabled: !!id,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Queue Schema
export const useQueueSchema = (id: string) => {
  return useQuery({
    queryKey: ['queueSchema', id],
    queryFn: () => api.getQueueSchema(id),
    enabled: !!id,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Event Settings
export const useEventSettings = () => {
  return useQuery({
    queryKey: ['eventSettings'],
    queryFn: api.getEventSettings,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Logs
export const useLogs = (botId: string, customTimeFrame?: { begin: string; end: string }) => {
  // In the original app, logId is derived from botId or settings
  // For simplicity, we'll use botId as logId here
  const logId = botId;
  
  const queryString = customTimeFrame 
    ? { start: customTimeFrame.begin }
    : { start: moment().subtract(5, 'minutes').valueOf() };
  
  return useQuery({
    queryKey: ['logs', logId, botId, queryString],
    queryFn: () => api.getLogs(logId, botId, queryString),
    enabled: !!botId,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// SDK Config
export const useSdkConfig = () => {
  return useQuery({
    queryKey: ['sdkConfig'],
    queryFn: api.getSdkConfig,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Settings
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// Stats
export const useStats = (range: string = 'minute', count: string | number = 15) => {
  return useQuery<StatsData>({
    queryKey: ['stats', range, count],
    queryFn: () => api.getStats(range, count, moment().format()),
    refetchInterval: STATS_REFRESH_INTERVAL, // More frequent updates for stats
  });
};

// Save Cron Overrides mutation
export const useSaveCronOverrides = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.saveCronOverrides(data),
    onSuccess: () => {
      // Invalidate relevant queries after successful mutation
      queryClient.invalidateQueries({ queryKey: ['cron'] });
    },
  });
};

// Search
export const useSearch = (serverId: string, resumptionToken: string, searchText: string, agg?: any) => {
  return useQuery({
    queryKey: ['search', serverId, resumptionToken, searchText, agg],
    queryFn: () => api.search(serverId, resumptionToken, searchText, agg),
    enabled: !!serverId && !!resumptionToken,
    refetchInterval: REFRESH_INTERVAL,
  });
};

// For compatibility with existing components, we'll add these convenience hooks
export const useNodes = () => {
  // In the original app, nodes come from the stats API
  const { data, isLoading, error } = useStats();
  
  const botNodes = data?.nodes?.bot || {};
  const queueNodes = data?.nodes?.queue || {};
  const systemNodes = data?.nodes?.system || {};
  
  return {
    data: { ...botNodes, ...queueNodes, ...systemNodes },
    isLoading,
    error,
  };
};

export const useBots = () => {
  // In the original app, bots come from the stats API
  const { data, isLoading, error } = useStats();
  
  return {
    data: data?.nodes?.bot || {},
    isLoading,
    error,
  };
};

export const useNode = (nodeId: string) => {
  const { data: nodes, isLoading, error } = useNodes();
  
  return {
    data: nodeId ? nodes?.[nodeId] : undefined,
    isLoading,
    error,
  };
};

// Catalog - this is a custom hook for the new app, but we'll keep it for compatibility
export const useCatalog = () => {
  // We'll derive catalog data from the nodes
  const { data: nodes, isLoading, error } = useNodes();
  
  const catalogData = {
    items: Object.entries(nodes || {}).map(([id, node]: [string, any]) => ({
      id,
      name: node.label || id,
      type: node.type,
      description: node.description,
      lastUpdated: node.latest_write || node.last_run?.start,
    })),
  };
  
  return {
    data: catalogData,
    isLoading,
    error,
  };
};