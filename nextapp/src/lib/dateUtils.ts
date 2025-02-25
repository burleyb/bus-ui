import moment from 'moment';

/**
 * Format a timestamp for display
 * @param timestamp - Timestamp to format (string, number, or Date)
 * @param format - Optional format string (defaults to 'YYYY-MM-DD HH:mm:ss')
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!timestamp) return 'N/A';
  return moment(timestamp).format(format);
}

/**
 * Get a relative time string (e.g., "5 minutes ago")
 * @param timestamp - Timestamp to format (string, number, or Date)
 * @returns Relative time string
 */
export function getRelativeTime(timestamp: string | number | Date): string {
  if (!timestamp) return 'N/A';
  return moment(timestamp).fromNow();
}

/**
 * Get a time range for a specified period
 * @param period - Time period (hour, day, week, month)
 * @returns Object with begin and end timestamps
 */
export function getTimeRange(period: 'hour' | 'day' | 'week' | 'month'): { begin: string; end: string } {
  const end = moment();
  let begin;

  switch (period) {
    case 'hour':
      begin = moment().subtract(1, 'hour');
      break;
    case 'day':
      begin = moment().subtract(1, 'day');
      break;
    case 'week':
      begin = moment().subtract(1, 'week');
      break;
    case 'month':
      begin = moment().subtract(1, 'month');
      break;
    default:
      begin = moment().subtract(1, 'hour');
  }

  return {
    begin: begin.toISOString(),
    end: end.toISOString()
  };
}

/**
 * Convert a time interval string to a human-readable format
 * @param interval - Interval string (e.g., 'minute_15')
 * @returns Human-readable interval string
 */
export function formatInterval(interval: string): string {
  if (!interval) return 'N/A';
  
  const parts = interval.split('_');
  if (parts.length !== 2) return interval;
  
  const [unit, value] = parts;
  return `${value} ${unit}${parseInt(value) !== 1 ? 's' : ''}`;
}

export default {
  formatTimestamp,
  getRelativeTime,
  getTimeRange,
  formatInterval
}; 