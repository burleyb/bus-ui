import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client'; 

import { DataProvider  } from './stores/DataContext.jsx';
import { DialogProvider } from './stores/DialogContext.jsx';
import App from './components/main.jsx';
import ErrorBoundary from './components/utils/ErrorBoundary.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import necessary CSS files and other assets here
import './css/main.less';

function Root() {
    const queryClient = new QueryClient();

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <DataProvider>
                    <DialogProvider>
                        <App />
                    </DialogProvider>
                </DataProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

// Mount the React component
const container = document.getElementById('EventBus');
const root = createRoot(container); // Creates a root instance and renders the app
root.render(<Root />);
