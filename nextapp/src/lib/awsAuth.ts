'use client';

/**
 * AWS Authentication utilities
 */
import { getCredentials, clearCredentialsCache } from './leoCognito';
import type { AwsCredentials } from './leoCognito';

/**
 * Check if the user is authenticated with AWS Cognito
 * This function will return true if valid credentials are available
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    // This will use cached credentials if available
    await getAwsCredentials();
    return true;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

/**
 * Get AWS credentials
 * This function will use cached credentials if they're still valid
 */
export async function getAwsCredentials(): Promise<AwsCredentials> {
  try {
    return await getCredentials();
  } catch (error) {
    console.error('Failed to get AWS credentials:', error);
    throw error;
  }
}

/**
 * Sign in with AWS Cognito
 * For unauthenticated identity pools, this just gets fresh credentials
 */
export async function signIn(): Promise<void> {
  try {
    // Clear any cached credentials first
    clearCredentialsCache();
    // Get fresh credentials
    await getAwsCredentials();
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
}

/**
 * Sign out from AWS Cognito
 * For unauthenticated identity pools, this just clears the cached credentials
 */
export async function signOut(): Promise<void> {
  clearCredentialsCache();
}

/**
 * Refresh AWS credentials
 * This function will force a refresh of the credentials
 */
export async function refreshCredentials(): Promise<AwsCredentials> {
  try {
    // Clear cached credentials
    clearCredentialsCache();
    // Get fresh credentials
    return await getAwsCredentials();
  } catch (error) {
    console.error('Failed to refresh AWS credentials:', error);
    throw error;
  }
}

export default {
  isAuthenticated,
  getAwsCredentials,
  signIn,
  signOut,
  refreshCredentials
}; 