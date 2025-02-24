import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useData } from '../stores/DataContext';
import Layout from './Layout';
import ErrorBoundary from './utils/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30000,
      refetchOnWindowFocus: false
    }
  }
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Layout />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
