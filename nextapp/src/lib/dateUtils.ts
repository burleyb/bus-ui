/**
 * Utilities for working with dates and EIDs in the event bus system
 */

/**
 * Format a date as an EID string for use in queue searching
 * Format: z/YYYY/MM/DD/HH/mm/timestamp
 */
export function formatDateToEid(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const timestamp = date.getTime(); // milliseconds since Unix epoch
  
  return `z/${year}/${month}/${day}/${hours}/${minutes}/${timestamp}`;
}

/**
 * Get the EID for a specific time range from the current time
 * @param minutes Number of minutes in the past to get the EID for
 */
export function getEidForTimeRange(minutes: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return formatDateToEid(date);
}

/**
 * Predefined time ranges in minutes
 */
export const TIME_RANGES = {
  '30s': 0.5,  // 30 seconds
  '1m': 1,     // 1 minute
  '5m': 5,     // 5 minutes
  '1h': 60,    // 1 hour
  '6h': 360,   // 6 hours
  '1d': 1440,  // 1 day (24 hours)
  '1w': 10080, // 1 week (7 days)
};

/**
 * Check if a string is likely an EID
 */
export function isEid(str: string): boolean {
  return /^z\/\d{4}\/\d{2}\/\d{2}\/\d{2}\/\d{2}\/\d+/.test(str);
}

/**
 * Format a date for display
 */
export function formatDateTime(date: Date | string | number): string {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
} 