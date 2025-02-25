/**
 * Environment utility functions
 */

/**
 * Get the current environment (development, production, test)
 */
export const getEnvironment = (): 'development' | 'production' | 'test' => {
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
};

/**
 * Check if the current environment is development
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * Check if the current environment is production
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * Check if the current environment is test
 */
export const isTest = (): boolean => {
  return getEnvironment() === 'test';
};

/**
 * Get a public environment variable
 * @param key The environment variable key (without NEXT_PUBLIC_ prefix)
 * @param defaultValue The default value if the environment variable is not set
 */
export const getPublicEnv = (key: string, defaultValue: string = ''): string => {
  const fullKey = `NEXT_PUBLIC_${key}`;
  return process.env[fullKey] || defaultValue;
};

export default {
  getEnvironment,
  isDevelopment,
  isProduction,
  isTest,
  getPublicEnv,
}; 