import numeral from 'numeral';

/**
 * Format a number with commas
 * @param value - Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return numeral(value).format('0,0');
}

/**
 * Format a number as a percentage
 * @param value - Number to format (0-1)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return numeral(value).format('0.0%');
}

/**
 * Format a number with a specific precision
 * @param value - Number to format
 * @param precision - Number of decimal places
 * @returns Formatted number string
 */
export function formatWithPrecision(value: number | string | undefined | null, precision = 2): string {
  if (value === undefined || value === null) return 'N/A';
  return numeral(value).format(`0,0.${'0'.repeat(precision)}`);
}

/**
 * Format a file size (bytes to KB, MB, GB, etc.)
 * @param bytes - Number of bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number | string | undefined | null): string {
  if (bytes === undefined || bytes === null) return 'N/A';
  return numeral(bytes).format('0.0b');
}

/**
 * Format a duration in milliseconds to a human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number | string | undefined | null): string {
  if (ms === undefined || ms === null) return 'N/A';
  
  const milliseconds = typeof ms === 'string' ? parseInt(ms, 10) : ms;
  
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else if (milliseconds < 3600000) {
    return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s`;
  } else {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
}

export default {
  formatNumber,
  formatPercent,
  formatWithPrecision,
  formatFileSize,
  formatDuration
}; 