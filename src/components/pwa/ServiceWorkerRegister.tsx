'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister
 * Tự động đăng ký Service Worker (/sw.js) trên client.
 * Tương thích 100% với Next.js 15 và React 19 mà không gây conflict Turbopack / HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (process.env.NODE_ENV === 'production' || window.location.search.includes('pwa_test=true'))
    ) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((error) => {
            console.warn('[PWA] ServiceWorker registration skipped:', error);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}
