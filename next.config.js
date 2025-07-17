/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['openai', 'anthropic-ai']
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  images: {
    domains: [
      'localhost', 
      'supabase.co', 
      'randomuser.me', 
      'via.placeholder.com',
      'replicate.delivery',
      'pbxt.replicate.delivery'
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-key',
  },
}

module.exports = nextConfig 