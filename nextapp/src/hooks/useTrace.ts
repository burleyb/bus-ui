/**
 * Hooks for trace-related actions
 */
import { useQuery } from '@tanstack/react-query';
import { awsNativeFetch } from '@/lib/authUtils';

// API function for getting trace data
const getTrace = async (queueId: string, eventId: string, children?: string) => {
  try {
    let url = `/api/trace/${encodeURIComponent(queueId)}/${encodeURIComponent(eventId)}`;
    
    // Add children parameter if provided
    if (children) {
      // Format the children path parameter 
      // The path should be a comma-separated list of node IDs
      // This matches the format expected by the API: api/trace/queueName/eid?children=nodePath
      url += `?children=${encodeURIComponent(children)}`;
    }
    
    const response = await awsNativeFetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch trace data: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching trace data:', error);
    throw error;
  }
};

/**
 * Hook to fetch trace data for an event
 * @param queueId The queue ID
 * @param eventId The event ID
 * @param children Optional comma-separated list of child node IDs to include
 */
export function useTrace(queueId: string, eventId: string, children?: string) {
  return useQuery({
    queryKey: ['trace', queueId, eventId, children],
    queryFn: () => getTrace(queueId, eventId, children),
    enabled: !!(queueId && eventId),
    refetchOnWindowFocus: false,
    staleTime: Infinity // Don't auto-refetch as trace data is static for a specific event
  });
} 