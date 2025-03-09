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
  },

  // Add the rewrites configuration
  async rewrites() {
    return [
      {
        source: '/prod/api/:path*',
        destination: 'https://server-18-172-170-14.sea73.r.cloudfront.net/prod/api/:path*' // Replace with actual API domain
      }
    ]
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
