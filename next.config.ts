import type { NextConfig } from "next";

// Add Cloudflare Dev Platform bindings for next dev
if (process.env.NODE_ENV === 'development') {
  import('@cloudflare/next-on-pages/next-dev').then(({ setupDevPlatform }) => {
    setupDevPlatform();
  }).catch(err => {
    console.error('Failed to setup Cloudflare dev platform', err);
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
