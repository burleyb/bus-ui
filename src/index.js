import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client'; 
import moment from 'moment';
import momenttz from 'moment-timezone';
import { DataProvider } from './stores/DataContext.jsx';
import { DialogProvider } from './stores/DialogContext.jsx';
import App from './components/main.jsx';
import LEOCognito from './components/utils/leoCognito';
import ErrorBoundary from './components/utils/ErrorBoundary.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import leoConfig from 'leo-config';

// Import necessary CSS files and other assets here
import './css/main.less';

// Load necessary scripts directly as npm packages, or use script loaders if needed
import 'c3';
import 'd3';

function Root() {
    useEffect(() => {
        console.log("[leoConfig]", leoConfig);

        // Initialize LEOCognito
        if (LEOCognito) {
            LEOCognito.start(
                leoConfig.cognitoId || 'us-east-1:8e3283a9-9fbf-48f4-af41-97860020622b',
                () => { return { 
                                    Logins: {
                                        "cognito-idp.us-east-1.amazonaws.com/us-east-1_UIw8wHLpw": "eyJraWQiOiIxbUZoYjZxNlBFTElnR1BzbFA3Z2Y4SWR1ZGZoYmdHYkJCNlZha25ZaVdnPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJjMGYwYjk1Yy0zZjIxLTRhNzUtYWQ0Yy0yZmFhMjZiM2NmNTkiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtd2VzdC0yLmFtYXpvbmF3cy5jb21cL3VzLXdlc3QtMl9VSXc4d0hMcHciLCJjb2duaXRvOnVzZXJuYW1lIjoibmplbnNlbkBwaWN0dXJlaXRsaWtldGhpcy5jb20iLCJnaXZlbl9uYW1lIjoiTmF0aGFuIiwiYXVkIjoiN2lzNzJyb3VvdDY5aTBwYnY4amk0NmxjYm8iLCJldmVudF9pZCI6ImYwYTFhZjE3LTAyZWUtMTFlOC04YzcwLWExZDBmMzViMDE1YSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTE3MDM2MzU1LCJjdXN0b206ZGVhbGVyc2hpcCI6IkcwNCIsImV4cCI6MTUxNzAzOTk1NSwiaWF0IjoxNTE3MDM2MzU1LCJmYW1pbHlfbmFtZSI6IkplbnNlbiIsImVtYWlsIjoibmplbnNlbkBwaWN0dXJlaXRsaWtldGhpcy5jb20ifQ.VcJKZinNYo10LIm56MgvvedlQNHGp3yik1c34cMvwxuJLF5naEyTZWt55ypwZWJ66K762pgS3vzQfTT2bvVHqkt6O3A4pKUIMJvTvYlJIxkTMSYVKBHN-Dxv84WWJJs6f01McYvaCKwB6AsU2dOHBcKDZBkYdo5HgM_4DtxIzPmSfk7hZnorp3qrNqoobVVGOTNDs2F72OIpfprA6c8hsRFGL5eVqLkSfNRAH3QX3Mo_NOpfyB67rKNUB708mATdg7Cid1KTSti08oexDg1GEIveeWgCQN9-_XJxDm3G1F8HJjFF3r_PbplaM5p81h91V8WLAGYXBt6HPdyjLhc-nQ"
                                    },
                                    IdentityId: "us-east-1:fbbb3289-bc46-461c-8bf5-08292bb6643a", 
                                };
                },
                {
                    apiUri: "api/",
                    region: leoConfig.region || 'us-east-1',
                    cognito_region: leoConfig.cognito_region || 'us-east-1',
                },
                function () {
                    console.log("LEOCognito initialized");
                }
            );
        }

    }, []);

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

