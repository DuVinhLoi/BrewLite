import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrewLite – Đặt đồ uống',
    short_name: 'BrewLite',
    start_url: '/',
    display: 'standalone',
    theme_color: '#8a3d12',
    background_color: '#faf6f1',
    lang: 'vi',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
