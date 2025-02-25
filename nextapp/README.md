# Bot Monitoring UI

A modern React application for monitoring and managing bots, built with Next.js, TypeScript, Tailwind CSS, and TanStack Query.

## Features

- **Dashboard**: Overview of bot activity and system health
- **Node View**: Interactive visualization of the node network
- **Catalog**: Browse and manage available resources
- **Trace View**: Track and debug event flows
- **SDK Info**: Documentation for integrating with the system

## Technology Stack

- **Next.js**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Data fetching and caching
- **D3.js**: Data visualization
- **Context API**: State management
- **AWS Authentication**: Cognito and AWS Signature Version 4

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd nextapp
npm install
```

### Configuration

The application uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

```
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_REGION=us-east-1
NEXT_PUBLIC_API_SERVICE=execute-api
```

You can copy the `.env.example` file as a starting point:

```bash
cp .env.example .env.local
```

#### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:8080` |
| `NEXT_PUBLIC_API_REGION` | AWS Region for API Gateway | `us-east-1` |
| `NEXT_PUBLIC_API_SERVICE` | AWS Service name | `execute-api` |
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | Enable mock data for development | `false` |
| `NEXT_PUBLIC_DEBUG_MODE` | Enable debug mode | `false` |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout in milliseconds | `30000` |

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

### Running in Production

```bash
npm start
```

## Project Structure

- `src/app`: Next.js App Router pages
- `src/components`: React components organized by feature
- `src/context`: React Context providers
- `src/hooks`: Custom React hooks
- `src/api`: API client and utilities
- `src/lib`: Utility functions and shared code

## AWS Authentication

This application uses AWS Cognito for authentication and AWS Signature Version 4 for signing API requests. The authentication flow works as follows:

1. The application uses the leoCognito library to authenticate directly with AWS Cognito using an unauthenticated identity pool
2. The leoCognito library provides temporary AWS credentials (access key, secret key, and session token)
3. These credentials are used to sign all API requests using AWS Signature Version 4
4. Credentials are automatically refreshed when they expire

### Authentication Components

The authentication system consists of several key components:

- **AuthContext**: A React context that provides authentication state and methods throughout the application
- **AuthProvider**: A context provider that manages authentication state and wraps the application
- **useAuth**: A custom hook that provides access to authentication state and methods
- **AuthStatus**: A UI component that displays the current authentication status
- **awsAuth.ts**: Utilities for AWS authentication and request signing

### Authentication Methods

The authentication system provides the following methods:

- **isAuthenticated()**: Checks if the user is currently authenticated
- **signIn()**: Refreshes AWS credentials from the identity pool
- **signOut()**: Clears cached credentials and refreshes them
- **getAwsCredentials()**: Retrieves the current AWS credentials
- **createSignedFetch()**: Creates a fetch function that automatically signs requests with AWS Signature Version 4

### Configuration

The authentication system requires the following environment variables:

```
NEXT_PUBLIC_API_REGION=us-east-1
NEXT_PUBLIC_API_SERVICE=execute-api
NEXT_PUBLIC_AWS_IDENTITY_POOL_ID=us-east-1:3425a7c9-40c1-4aa0-b7c7-62e28e353b9e
```

### Troubleshooting Authentication

If you encounter authentication issues:

1. Check the Auth Status indicator in the header
2. Look for authentication errors in the browser console
3. Try refreshing credentials using the Auth Status component
4. Check that your AWS Cognito identity pool is correctly configured
5. Verify that your API Gateway is configured to accept AWS Signature Version 4 authentication
6. Clear your browser cache and cookies

### leoCognito Library

The leoCognito library is a client-side JavaScript library that handles AWS Cognito authentication. It provides:

- Authentication with AWS Cognito using an unauthenticated identity pool
- Secure storage of tokens and credentials
- Automatic token refresh
- Integration with AWS Signature Version 4 for API requests

The library is imported dynamically to avoid issues with server-side rendering in Next.js.

## Migrated from Legacy Application

This application is a modern rewrite of a legacy React application, with the following improvements:

- Replaced MobX and Redux with React Context and hooks
- Replaced direct API calls with TanStack Query
- Replaced jQuery DOM manipulation with React patterns
- Replaced custom CSS with Tailwind CSS
- Upgraded to the latest versions of React and Next.js
- Improved component organization and code structure

## API Integration

This application maintains compatibility with the original API endpoints. The API client in `src/api/api.ts` makes the same exact calls as the original application, ensuring a smooth transition. Key API endpoints include:

- `api/accessConfig` - Get access configuration
- `api/search/{queue}/{start}` - Search for events in a queue
- `api/bot` - Get bot information
- `api/dashboard/{id}` - Get dashboard data
- `api/cron/{id}` - Get cron information
- `api/queueSchema/{id}` - Get queue schema
- `api/eventSettings` - Get event settings
- `api/logs/{logId}/{botId}` - Get logs
- `api/sdkConfig` - Get SDK configuration
- `api/settings` - Get settings
- `api/stats_v2` - Get statistics

The application uses TanStack Query to manage API calls, providing caching, background updates, and optimistic UI updates while maintaining the same API contract as the original application.

## Client and Server Components

This application uses Next.js App Router with a mix of client and server components:

- **Server Components**: Used for static content and data fetching where interactivity is not needed
- **Client Components**: Used for interactive UI elements that need state, event handlers, or hooks

All components that use React hooks, event handlers, or browser APIs are marked with the `'use client'` directive at the top of the file:

```jsx
'use client'
import { useState } from 'react';

export default function InteractiveComponent() {
  const [state, setState] = useState(initialState);
  // ...
}
```

### Common Issues

- **Error: "Only plain objects can be passed to Client Components from Server Components"**: This occurs when trying to pass non-serializable data from a server component to a client component. Make sure all data passed between components is serializable.

- **Error: "useState is not defined"**: This occurs when using React hooks in a server component. Add the `'use client'` directive to the top of the file.
