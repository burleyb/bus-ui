/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Format an error message for display
 * @param error - Error object
 * @returns Formatted error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `API Error (${error.status}): ${error.message}`;
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'An unknown error occurred';
  }
}

/**
 * Log an error to the console with additional context
 * @param error - Error object
 * @param context - Additional context information
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  console.error('Error:', formatErrorMessage(error));
  
  if (context) {
    console.error('Context:', context);
  }
  
  if (error instanceof Error) {
    console.error('Stack:', error.stack);
  }
}

/**
 * Check if an error is a network error
 * @param error - Error object
 * @returns True if the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed')
    );
  }
  return false;
}

/**
 * Check if an error is an authentication error
 * @param error - Error object
 * @returns True if the error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403;
  }
  return false;
}

export default {
  ApiError,
  formatErrorMessage,
  logError,
  isNetworkError,
  isAuthError
}; 