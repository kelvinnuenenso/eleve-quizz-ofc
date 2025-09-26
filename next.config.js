/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para usar com Vite
  distDir: '.next',
  
  // Configuração de API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/src/pages/api/:path*',
      },
    ];
  },
  
  // Configuração para desenvolvimento
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // Configuração experimental para usar com Vite
  experimental: {
    externalDir: true,
  },
  
  // Configuração de output para Vercel
  output: 'standalone',
};

module.exports = nextConfig;