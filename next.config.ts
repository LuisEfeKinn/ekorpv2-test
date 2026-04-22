import type { NextConfig } from 'next';

const isStaticExport = false;

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: isStaticExport ? 'export' : undefined,
  env: {
    BUILD_STATIC_EXPORT: JSON.stringify(isStaticExport),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  // Keep heavy SDKs out of the server bundle so the SSR Lambda cold-start stays below the 10s init limit.
  serverExternalPackages: [
    'firebase',
    'firebase-admin',
    '@aws-amplify/ui-react',
    '@aws-amplify/ui-react-liveness',
    '@google/generative-ai',
    'openai',
    '@auth0/auth0-react',
    '@auth0/nextjs-auth0',
    '@supabase/supabase-js',
  ],
  experimental: {
    optimizePackageImports: [
      '@aws-amplify/ui-react-liveness',
      '@mui/material',
      '@mui/icons-material',
      '@mui/lab',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      'lodash',
      'date-fns',
    ],
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
