import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return process.env.BREWLITE_SINGLE_CONTAINER === 'true'
      ? [{ source: '/api/:path*', destination: 'http://127.0.0.1:4000/:path*' }]
      : [];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
};

export default nextConfig;
