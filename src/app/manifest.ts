import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Checked - Chia sẻ khoảnh khắc & tài chính',
    short_name: 'Checked',
    description: 'Mạng xã hội chia sẻ khoảnh khắc, chi tiêu và calo cùng bạn bè',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#EDE9DF',
    theme_color: '#EDE9DF',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
