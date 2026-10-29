'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { isTokenExpired, getTokenRemainingMs } from '@/lib/auth/jwt';

const PUBLIC_PATHS = ['/login', '/register', '/verify-otp'];

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const logout = useAuthStore((s) => s.logout);

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname?.startsWith(p + '/')
  );

  useEffect(() => {
    if (!isHydrated) return;

    // 1. Kiểm tra tính hợp lệ của token
    const tokenValid = Boolean(accessToken && !isTokenExpired(accessToken));

    // Nếu có token nhưng đã hết hạn -> logout sạch
    if (accessToken && !tokenValid) {
      logout();
    }

    // 2. Chặn trang bảo vệ nếu chưa đăng nhập
    if (!tokenValid && !isPublicPath) {
      const redirectPath = pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${redirectPath}`);
      return;
    }

    // 3. Chặn /login và /register nếu đã đăng nhập hợp lệ
    if (tokenValid && (pathname === '/login' || pathname === '/register')) {
      const target = searchParams?.get('redirect') || '/';
      const safeTarget = target.startsWith('/') ? target : '/';
      router.replace(safeTarget);
      return;
    }

    // 4. Lên lịch tự động đăng xuất khi token chạm ngưỡng hết hạn
    if (tokenValid && accessToken) {
      const remainingMs = getTokenRemainingMs(accessToken);
      if (remainingMs > 0) {
        const timer = setTimeout(() => {
          logout();
          router.replace(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
        }, remainingMs);
        return () => clearTimeout(timer);
      }
    }
  }, [accessToken, isAuthenticated, isHydrated, isPublicPath, logout, pathname, router, searchParams]);

  // Lắng nghe sự kiện người dùng quay lại tab (tab focus / visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentToken = useAuthStore.getState().accessToken;
        if (currentToken && isTokenExpired(currentToken)) {
          useAuthStore.getState().logout();
          if (!isPublicPath) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isPublicPath, pathname, router]);

  return <>{children}</>;
}
