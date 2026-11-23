import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  /** Chuyển các đường dẫn /api sang API nội bộ khi web và API chạy chung container. */
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
