'use client'

import { Component, ErrorInfo, ReactNode } from 'react';
import { API_BASE_URL } from '@/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Check if the error is related to API connection
      const isApiConnectionError = 
        this.state.error?.message.includes('Failed to fetch') ||
        this.state.error?.message.includes('Network Error') ||
        this.state.error?.message.includes('ECONNREFUSED');

      // Check if the error is related to AWS authentication
      const isAwsAuthError =
        this.state.error?.message.includes('AWS authentication failed') ||
        this.state.error?.message.includes('Failed to get AWS credentials') ||
        this.state.error?.message.includes('Missing Authentication Token') ||
        this.state.error?.message.includes('The security token included in the request is invalid');

      if (isAwsAuthError) {
        return (
          <div className="p-8 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
            <h2 className="text-2xl font-bold text-yellow-700 mb-4">Authentication Error</h2>
            <p className="text-yellow-600 mb-4">
              Unable to authenticate with AWS. Your session may have expired.
            </p>
            <div className="bg-white p-4 rounded-md border border-yellow-200 text-left mb-4">
              <p className="font-medium mb-2">Possible solutions:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Refresh the page to get new credentials</li>
                <li>Clear your browser cache and cookies</li>
                <li>Log out and log back in</li>
                <li>Contact your administrator if the problem persists</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        );
      }

      if (isApiConnectionError) {
        return (
          <div className="p-8 bg-red-50 rounded-lg border border-red-200 text-center">
            <h2 className="text-2xl font-bold text-red-700 mb-4">API Connection Error</h2>
            <p className="text-red-600 mb-4">
              Unable to connect to the API server at <code className="bg-red-100 px-2 py-1 rounded">{API_BASE_URL}</code>
            </p>
            <div className="bg-white p-4 rounded-md border border-red-200 text-left mb-4">
              <p className="font-medium mb-2">Possible solutions:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Make sure the API server is running at the configured URL</li>
                <li>Check your network connection</li>
                <li>Verify that CORS is properly configured on the API server</li>
                <li>Update the API URL in your environment configuration</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        );
      }

      // Default error fallback
      return this.props.fallback || (
        <div className="p-8 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong</h2>
          <p className="text-red-600 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 