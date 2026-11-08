import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { PwaUpdateManager } from '@/components/pwa';
import { CameraProvider } from '@/contexts/CameraContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#EDE9DF',
};

export const metadata: Metadata = {
  title: 'Checked - Chia sẻ khoảnh khắc & tài chính',
  description: 'Mạng xã hội chia sẻ khoảnh khắc, chi tiêu và calo cùng bạn bè',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Checked',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="bg-[#EDE9DF]">
      <body className="bg-[#EDE9DF] text-[#141613] antialiased min-h-screen selection:bg-[#D4EB70] selection:text-[#141613]">
        <Providers>
          <CameraProvider>
            <PwaUpdateManager />
            <main className="w-full min-h-screen relative flex flex-col">
              {children}
            </main>
          </CameraProvider>
        </Providers>
      </body>
    </html>
  );
}
