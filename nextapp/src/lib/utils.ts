import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for merging class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a timestamp into a human-readable "time ago" string
 * @param timestamp Unix timestamp in milliseconds or ISO date string
 * @returns Human-readable "time ago" string (e.g., "5 minutes ago")
 */
export function formatTimeAgo(timestamp: number | string): string {
  if (!timestamp) return 'never';
  
  // Convert to milliseconds if necessary
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Handle future dates
  if (seconds < 0) {
    return 'in the future';
  }
  
  // Define time intervals
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];
  
  // Find the appropriate interval
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Truncate a string to a specified length with an ellipsis
 * @param str String to truncate
 * @param maxLength Maximum length (default 50)
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, maxLength: number = 50): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Convert a camelCase or snake_case string to Title Case
 * @param str String to convert
 * @returns Title cased string
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  // Handle camelCase
  const fromCamelCase = str.replace(/([A-Z])/g, ' $1');
  
  // Handle snake_case
  const fromSnakeCase = fromCamelCase.replace(/_/g, ' ');
  
  // Capitalize first letter of each word
  return fromSnakeCase
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format a number as a percentage
 * @param value Value to format
 * @param decimals Number of decimal places (default 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value === undefined || value === null) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Create a debounced version of a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds (default 300ms)
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(...args: Parameters<T>): void {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
} 