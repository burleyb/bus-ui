import type { NextConfig } from "next";
import https from 'https';

// Define runtimeConfig for client-side env access
// Process all NEXT_PUBLIC_ env variables automatically
const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    turbo: {
      "treeShaking": true,
    },
  },

  // Explicitly make env vars available to the client
  // Next.js 13+ automatically exposes NEXT_PUBLIC_ vars to the client
  env: {
    NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION,
    NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_USE_CORS_PROXY: process.env.NEXT_PUBLIC_USE_CORS_PROXY,
    NEXT_PUBLIC_CORS_PROXY_HOST: process.env.NEXT_PUBLIC_CORS_PROXY_HOST,
    NEXT_PUBLIC_CORS_PROXY_PATH: process.env.NEXT_PUBLIC_CORS_PROXY_PATH, 
    NEXT_PUBLIC_AGGRID_LICENSE_KEY: process.env.NEXT_PUBLIC_AGGRID_LICENSE_KEY,
  },

  serverRuntimeConfig: {
    httpAgent: new https.Agent({
      rejectUnauthorized: false // Only use this in development!
    })
  },

  // If needed, add custom webpack config for any special requirements
  webpack: (config: any, { isServer }: any) => {
    // Add any custom webpack config here
    return config;
  },
}

export default nextConfig;
