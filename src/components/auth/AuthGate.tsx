'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { isTokenExpired, getTokenRemainingMs } from '@/lib/auth/jwt';
import { HomeSkeleton } from '@/components/home/HomeSkeleton';

const PUBLIC_PATHS = ['/login', '/register', '/verify-otp', '/complete-profile', '/offline'];

export function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return true;
  }
  if (pathname.startsWith('/invite') || pathname.startsWith('/u/')) {
    return true;
  }
  return false;
}

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

  const isPublic = isPublicRoute(pathname);
  const tokenValid = Boolean(accessToken && !isTokenExpired(accessToken));

  useEffect(() => {
    if (!isHydrated) return;

    // 1. Kiểm tra tính hợp lệ của token
    // Nếu có token nhưng đã hết hạn -> logout sạch
    if (accessToken && !tokenValid) {
      logout();
    }

    // 2. Chặn trang bảo vệ nếu chưa đăng nhập
    if (!tokenValid && !isPublic) {
      const redirectPath = pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${redirectPath}`);
      return;
    }

    // 3. Chặn /login và /register nếu đã đăng nhập hợp lệ
    if (tokenValid && (pathname === '/login' || pathname === '/register')) {
      const target = searchParams?.get('redirect') || '/';
      const safeTarget = target.startsWith('/') && !target.startsWith('//') ? target : '/';
      const isTargetAuthPage = safeTarget === '/login' || safeTarget.startsWith('/login/') || safeTarget === '/register' || safeTarget.startsWith('/register/');
      router.replace(isTargetAuthPage ? '/' : safeTarget);
      return;
    }

    // 4. Lên lịch tự động đăng xuất khi token chạm ngưỡng hết hạn
    if (tokenValid && accessToken) {
      const remainingMs = getTokenRemainingMs(accessToken);
      if (remainingMs > 0) {
        const timer = setTimeout(() => {
          logout();
          if (!isPublic) {
            const redirectPath = pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
            router.replace(`/login${redirectPath}`);
          }
        }, remainingMs);
        return () => clearTimeout(timer);
      }
    }
  }, [accessToken, isAuthenticated, isHydrated, isPublic, logout, pathname, router, searchParams, tokenValid]);

  // Lắng nghe sự kiện người dùng quay lại tab (tab focus / visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentToken = useAuthStore.getState().accessToken;
        if (currentToken && isTokenExpired(currentToken)) {
          useAuthStore.getState().logout();
          if (!isPublicRoute(pathname)) {
            const redirectPath = pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
            router.replace(`/login${redirectPath}`);
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
  }, [pathname, router]);

  // Strict Rendering Gate:
  // 1. Khi ở public route: luôn render children
  if (isPublic) {
    return <>{children}</>;
  }

  // 2. Khi ở protected route (!isPublic):
  // - Nếu chưa hydrate (!isHydrated): KHÔNG render children, trả về <HomeSkeleton />
  // - Nếu đã hydrate nhưng token không hợp lệ (!tokenValid): KHÔNG render children, trả về <HomeSkeleton />
  if (!isHydrated || !tokenValid) {
    return <HomeSkeleton />;
  }

  // 3. Chỉ khi isHydrated && tokenValid: render children
  return <>{children}</>;
}
