/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  },
  
  // Environment variables that should be available on both client and server
  env: {
    // Add any additional environment variables here if needed
  },
  
  // Configure image domains if using next/image
  images: {
    domains: [
      // Add any external image domains here
      'localhost',
    ],
  },
  
  // Configure redirects if needed
  async redirects() {
    return [
      // Add any redirects here
    ];
  },
  
  // Configure rewrites if needed
  async rewrites() {
    return [
      // Add any rewrites here
    ];
  },
  
  // Configure headers if needed
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  
  // Output configuration for static export if needed
  // output: 'export',
  // trailingSlash: true,
  
  // Webpack configuration if needed
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add any custom webpack configuration here
    return config;
  },
};

module.exports = nextConfig;