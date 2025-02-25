/**
 * Application configuration
 * 
 * This file contains environment-specific configuration settings.
 * Values can be overridden using environment variables.
 */
import { getPublicEnv, isDevelopment } from '@/lib/envUtils';

// API configuration
export const API_BASE_URL = getPublicEnv('API_BASE_URL', 'http://localhost:8080/botmon');
export const API_REGION = getPublicEnv('API_REGION', 'us-east-1');
export const API_SERVICE = getPublicEnv('API_SERVICE', 'execute-api');
export const AWS_IDENTITY_POOL_ID = getPublicEnv('AWS_IDENTITY_POOL_ID', 'us-east-1:3425a7c9-40c1-4aa0-b7c7-62e28e353b9e');
export const AWS_REGION = getPublicEnv('AWS_REGION', 'us-east-1');

// Feature flags
export const FEATURES = {
  enableMockData: getPublicEnv('ENABLE_MOCK_DATA', 'false') === 'true',
  debugMode: getPublicEnv('DEBUG_MODE', isDevelopment() ? 'true' : 'false') === 'true',
};

// Timeouts
export const TIMEOUTS = {
  apiRequest: Number(getPublicEnv('API_TIMEOUT', '30000')), // 30 seconds
};

// Default settings
export const DEFAULTS = {
  timeRange: 'hour_6',
  refreshInterval: 60000, // 1 minute
};

export default {
  API_BASE_URL,
  API_REGION,
  API_SERVICE,
  AWS_IDENTITY_POOL_ID,
  AWS_REGION,
  FEATURES,
  TIMEOUTS,
  DEFAULTS,
}; 