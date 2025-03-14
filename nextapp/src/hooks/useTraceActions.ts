/**
 * Hooks for trace-related actions
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  formatDateToEid, 
  getEidForTimeRange,
  TIME_RANGES
} from '@/lib/dateUtils';
import { useSearchQueueEvents } from '@/context/ApiContext';

/**
 * Hook to handle trace search with time-based filtering
 * @param queueId The queue ID to search
 * @param initialTimeRange Initial time range to use ('5m', '1h', etc.)
 * @param initialCustomDate Optional custom date to use instead of time range
 * @param initialSearchText Optional search text
 */
export function useTraceSearch(
  queueId: string,
  initialTimeRange: string = '5m',
  initialCustomDate: Date | null = null,
  initialSearchText: string = ''
) {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [customDate, setCustomDate] = useState<Date | null>(initialCustomDate);
  const [searchText, setSearchText] = useState(initialSearchText);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchText);
  const [isSearching, setIsSearching] = useState(false);

  // Calculate the EID based on selected time range or custom date
  const eid = useMemo(() => {
    if (customDate) {
      return formatDateToEid(customDate);
    }
    
    // Use time range
    const minutes = TIME_RANGES[timeRange as keyof typeof TIME_RANGES] || 5;
    return getEidForTimeRange(minutes);
  }, [customDate, timeRange]);

  // Fetch events using the hook
  const { 
    data, 
    isLoading,
    isError,
    error,
    refetch
  } = useSearchQueueEvents(
    queueId, 
    eid, // Use the memoized EID value
    debouncedSearch.length > 0 ? debouncedSearch : undefined
  );

  // Process events to ensure they have consistent structure
  const events = (data?.results || []).map((event: any) => {
    // Create a unique ID for the event
    const eventId = event.eventId || event.eid || event.id || 
                    (event.payload && event.payload.id) || 
                    Math.random().toString(36).substring(2, 9);
    
    // Ensure we have a timestamp
    const timestamp = event.timestamp || 
                     event.created_at || 
                     event.time || 
                     (event.payload && event.payload.timestamp) || 
                     new Date().toISOString();
    
    // Ensure we have a source timestamp
    const event_source_timestamp = event.event_source_timestamp || 
                                  event.timestamp || 
                                  event.created_at || 
                                  new Date().toISOString();
    
    // Get the payload - could be directly on event or in a payload/data field
    const payload = event.payload || event.data || event;
    
    return {
      ...event,
      eventId,
      timestamp,
      event_source_timestamp,
      payload
    };
  });

  // Handle time range change
  const handleTimeRangeChange = useCallback((range: string) => {
    setTimeRange(range);
    setCustomDate(null);
    setIsSearching(true);
    
    // Trigger a refetch after a short delay to ensure state updates
    setTimeout(() => {
      refetch().finally(() => {
        setIsSearching(false);
      });
    }, 10);
  }, [refetch]);

  // Handle custom date selection
  const handleDateSelect = useCallback((date: Date | null) => {
    setCustomDate(date);
    setTimeRange('');
    setIsSearching(true);
    
    // Trigger a refetch after a short delay to ensure state updates
    setTimeout(() => {
      refetch().finally(() => {
        setIsSearching(false);
      });
    }, 10);
  }, [refetch]);

  // Handle search text change with debounce
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    
    // Debounce search
    const timer = setTimeout(() => {
      setDebouncedSearch(text);
      setIsSearching(true);
      
      refetch().finally(() => {
        setIsSearching(false);
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [refetch]);

  // Manually trigger refresh
  const refreshEvents = useCallback(() => {
    setIsSearching(true);
    refetch().finally(() => {
      setIsSearching(false);
    });
  }, [refetch]);

  return {
    events,
    isLoading: isLoading || isSearching,
    isError,
    error,
    refetch: refreshEvents,
    timeRange,
    customDate,
    searchText,
    setSearchText: handleSearchChange,
    setTimeRange: handleTimeRangeChange,
    setCustomDate: handleDateSelect
  };
} 