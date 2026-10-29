import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Checked',
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
          <main className="w-full min-h-screen relative flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
