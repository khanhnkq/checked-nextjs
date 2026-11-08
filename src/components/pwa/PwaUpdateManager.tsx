'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

/**
 * PwaUpdateManager
 * Quản trị vòng đời cập nhật PWA & Tự động phục hồi lỗi ChunkLoadError:
 * - Đăng ký native Service Worker (/sw.js)
 * - Kiểm tra bản mới khi app resume trên iOS Standalone (visibilitychange)
 * - Kiểm tra định kỳ 15 phút
 * - Tự động bắt lỗi ChunkLoadError / Loading chunk để reload sạch sẽ
 * - Hiển thị Pill thông báo cập nhật tuân thủ phong cách Checked (Zero Border, Zero Shadow, Zero Blur)
 */
export function PwaUpdateManager() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const currentVersionRef = useRef<string | null>(null);

  // Kiểm tra /version.json
  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.version) {
        if (currentVersionRef.current && data.version !== currentVersionRef.current) {
          setHasUpdate(true);
        } else if (!currentVersionRef.current) {
          currentVersionRef.current = data.version;
        }
      }
    } catch {
      // Bỏ qua lỗi kết nối offline
    }
  }, []);

  // Xử lý reload khi người dùng bấm "Cập nhật"
  const handleUpdate = useCallback(() => {
    if (registrationRef.current?.waiting) {
      registrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, []);

  // Xử lý đóng thông báo
  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Tự động phục hồi khi gặp lỗi ChunkLoadError hoặc Loading chunk
    const reloadOnChunkError = () => {
      const lastReload = sessionStorage.getItem('pwa_chunk_reload_timestamp');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('pwa_chunk_reload_timestamp', String(now));
        window.location.reload();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message;
      const isChunkError =
        (typeof error === 'string' &&
          (error.includes('ChunkLoadError') || error.includes('Loading chunk'))) ||
        (error &&
          typeof error === 'object' &&
          (error.name === 'ChunkLoadError' ||
            (typeof error.message === 'string' &&
              (error.message.includes('ChunkLoadError') ||
                error.message.includes('Loading chunk')))));

      if (isChunkError) {
        reloadOnChunkError();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const isChunkError =
        reason &&
        (reason.name === 'ChunkLoadError' ||
          (typeof reason.message === 'string' &&
            (reason.message.includes('ChunkLoadError') ||
              reason.message.includes('Loading chunk'))));

      if (isChunkError) {
        reloadOnChunkError();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // 2. Đăng ký Service Worker và lắng nghe cập nhật
    const isSupported = 'serviceWorker' in navigator;
    const shouldRegister =
      isSupported &&
      (process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'test' ||
        window.location.search.includes('pwa_test=true'));

    if (shouldRegister) {
      // Khởi tạo lấy version hiện tại
      checkVersion();

      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            registrationRef.current = registration;

            // Nếu đã có Service Worker mới đang chờ kích hoạt
            if (registration.waiting) {
              setHasUpdate(true);
            }

            // Lắng nghe bản cập nhật mới đang tải
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (
                    installingWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    setHasUpdate(true);
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.warn('[PWA] ServiceWorker registration skipped:', error);
          });
      };

      if (document.readyState === 'complete' || process.env.NODE_ENV === 'test') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }

      // Lắng nghe khi controller thay đổi
      const handleControllerChange = () => {
        // SW mới đã kích hoạt và claim clients
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // 3. Lắng nghe visibilitychange: khi user quay lại app trên iOS Standalone
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          if (registrationRef.current) {
            registrationRef.current.update().catch(() => {});
          }
          checkVersion();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // 4. Kiểm tra định kỳ 15 phút
      const CHECK_INTERVAL = 15 * 60 * 1000;
      const intervalId = setInterval(() => {
        if (registrationRef.current) {
          registrationRef.current.update().catch(() => {});
        }
        checkVersion();
      }, CHECK_INTERVAL);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('load', registerSW);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(intervalId);
      };
    }

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [checkVersion]);

  if (!hasUpdate || dismissed) {
    return null;
  }

  return (
    <div
      className="fixed left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none transition-all duration-300"
      style={{ top: 'calc(max(env(safe-area-inset-top), 14px) + 68px)' }}
    >
      <div
        role="alert"
        className="pointer-events-auto bg-[#2C2825] text-[#FAF8F5] px-4 py-2.5 rounded-full flex items-center gap-3 z-[100] animate-fadeIn select-none"
      >
        <span className="text-xs font-semibold tracking-wide">⚡ Đã có phiên bản mới</span>
        <button
          type="button"
          onClick={handleUpdate}
          className="bg-[#D9E872] text-[#2C2825] font-bold text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform cursor-pointer"
        >
          Cập nhật
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Đóng thông báo"
          className="text-[#FAF8F5]/60 hover:text-[#FAF8F5] text-xs px-1 cursor-pointer transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
