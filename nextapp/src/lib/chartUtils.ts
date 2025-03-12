import moment from 'moment';

/**
 * Format timestamp to display time in HH:MM:SS format
 */
export function formatChartTime(timestamp: string): string {
  if (!timestamp) return '00:00:00';
  return moment(timestamp).format('HH:mm:ss');
}

/**
 * Format timestamp to display full date and time
 */
export function formatDate(timestamp: string): string {
  if (!timestamp) return 'N/A';
  return moment(timestamp).format('MMM D, YYYY h:mm A');
}

/**
 * Format duration in milliseconds to human-readable format
 */
export function formatDuration(duration: number): string {
  if (!duration) return '0 ms';
  if (duration < 1000) return `${Math.round(duration)} ms`;
  return `${(duration / 1000).toFixed(2)} s`;
}

/**
 * Calculate percentage of progress between start and end dates
 */
export function calculateTimePercentage(
  timestamp: string, 
  startTime: string, 
  endTime: string
): number {
  if (!timestamp || !startTime || !endTime) return 0;
  
  const time = moment(timestamp).valueOf();
  const start = moment(startTime).valueOf();
  const end = moment(endTime).valueOf();
  
  if (start >= end) return 0;
  return Math.min(100, Math.max(0, ((time - start) / (end - start)) * 100));
}

/**
 * Convert a time range percentage to actual timestamps
 * @param range Percentage range [start, end] between 0-100
 * @param startTime Starting timestamp for the full range
 * @param endTime Ending timestamp for the full range
 * @returns Object with calculated start and end timestamps
 */
export function calculateTimeRange(
  range: [number, number], 
  startTime: string, 
  endTime: string
): { start: string; end: string } {
  if (!startTime || !endTime) {
    return { start: '', end: '' };
  }
  
  const start = moment(startTime).valueOf();
  const end = moment(endTime).valueOf();
  const duration = end - start;
  
  const rangeStart = moment(start + (duration * range[0] / 100)).format();
  const rangeEnd = moment(start + (duration * range[1] / 100)).format();
  
  return { 
    start: rangeStart,
    end: rangeEnd
  };
} 