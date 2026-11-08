import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenExpired } from '@/lib/auth/jwt';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/verify-otp',
  '/complete-profile',
  '/offline',
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Bỏ qua các file static, nội bộ Next.js, public API và semi-public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/u/')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('checked_token')?.value;
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );
  const isAuth = Boolean(token && !isTokenExpired(token));

  // 2. Token tồn tại nhưng đã hết hạn hoặc không hợp lệ -> Xóa cookie để chặn lặp vô tận
  if (token && isTokenExpired(token)) {
    if (!isPublicPath) {
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('checked_token');
      return response;
    } else {
      const response = NextResponse.next();
      response.cookies.delete('checked_token');
      return response;
    }
  }

  // 3. Người dùng chưa đăng nhập truy cập trang cần bảo vệ -> Điều hướng đến /login
  if (!isAuth && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Người dùng đã đăng nhập hợp lệ truy cập /login hoặc /register -> Chuyển về trang đích
  if (isAuth && (pathname === '/login' || pathname === '/register')) {
    const redirectTarget = searchParams.get('redirect') || '/';
    const safeTarget = redirectTarget.startsWith('/') ? redirectTarget : '/';
    return NextResponse.redirect(new URL(safeTarget, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
