'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Toast strictly without border, blur, or shadows */}
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            '!bg-white !text-[#141613] !rounded-2xl !p-4 !shadow-none !backdrop-blur-none !border-none font-medium',
        }}
      />
    </QueryClientProvider>
  );
}

