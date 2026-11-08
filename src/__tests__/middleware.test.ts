import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

function createMockJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = Buffer.from('mock-signature').toString('base64url');
  return `${header}.${body}.${sig}`;
}

describe('Server Middleware (src/middleware.ts)', () => {
  const validToken = createMockJwt({
    sub: 'user-123',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const expiredToken = createMockJwt({
    sub: 'user-123',
    exp: Math.floor(Date.now() / 1000) - 3600,
  });

  describe('Unauthenticated requests', () => {
    it('Unauthenticated GET / -> 307 redirect to /login', () => {
      const req = new NextRequest('http://localhost:3000/');
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('Unauthenticated GET /messages -> 307 redirect to /login?redirect=%2Fmessages', () => {
      const req = new NextRequest('http://localhost:3000/messages');
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fmessages');
    });

    it('Unauthenticated GET /offline -> NextResponse.next()', () => {
      const req = new NextRequest('http://localhost:3000/offline');
      const res = middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('Unauthenticated GET /complete-profile -> NextResponse.next()', () => {
      const req = new NextRequest('http://localhost:3000/complete-profile');
      const res = middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('Unauthenticated GET /invite/test-token -> NextResponse.next()', () => {
      const req = new NextRequest('http://localhost:3000/invite/test-token');
      const res = middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('Unauthenticated GET /u/testuser -> NextResponse.next()', () => {
      const req = new NextRequest('http://localhost:3000/u/testuser');
      const res = middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('Authenticated requests', () => {
    it('Authenticated GET /login -> redirect to /', () => {
      const req = new NextRequest('http://localhost:3000/login', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('Authenticated GET /login?redirect=%2Fsettings -> redirect to /settings', () => {
      const req = new NextRequest('http://localhost:3000/login?redirect=%2Fsettings', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/settings');
    });

    it('Authenticated GET /login with valid redirect=/messages -> redirects to /messages', () => {
      const req = new NextRequest('http://localhost:3000/login?redirect=%2Fmessages', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/messages');
    });

    it('Authenticated GET /login with open redirect //attacker.com -> sanitizes and redirects to /', () => {
      const req = new NextRequest('http://localhost:3000/login?redirect=//attacker.com', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('Authenticated GET /login with open redirect /\\attacker.com -> sanitizes and redirects to /', () => {
      const req = new NextRequest('http://localhost:3000/login?redirect=/\\attacker.com', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('Authenticated GET /login with loop redirect=/login -> redirects to /', () => {
      const req = new NextRequest('http://localhost:3000/login?redirect=%2Flogin', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('Authenticated GET /login with loop redirect=/register -> redirects to /', () => {
      const req = new NextRequest('http://localhost:3000/login?redirect=%2Fregister', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('Authenticated GET /register with open redirect //attacker.com -> redirects to /', () => {
      const req = new NextRequest('http://localhost:3000/register?redirect=//attacker.com', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('Authenticated GET /messages -> NextResponse.next()', () => {
      const req = new NextRequest('http://localhost:3000/messages', {
        headers: {
          cookie: `checked_token=${validToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('Expired token requests', () => {
    it('Expired token GET /messages -> redirect to /login?redirect=%2Fmessages and delete cookie', () => {
      const req = new NextRequest('http://localhost:3000/messages', {
        headers: {
          cookie: `checked_token=${expiredToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fmessages');

      // Check cookie deletion
      const setCookie = res.headers.get('set-cookie');
      const cookieObj = res.cookies.get('checked_token');
      const isDeleted = (cookieObj && cookieObj.value === '' && cookieObj.maxAge === 0) || (setCookie && setCookie.includes('checked_token=;'));
      expect(isDeleted).toBeTruthy();
    });

    it('Expired token GET / -> redirect to /login (no redirect param) and delete cookie', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: {
          cookie: `checked_token=${expiredToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');

      const setCookie = res.headers.get('set-cookie');
      const cookieObj = res.cookies.get('checked_token');
      const isDeleted = (cookieObj && cookieObj.value === '' && cookieObj.maxAge === 0) || (setCookie && setCookie.includes('checked_token=;'));
      expect(isDeleted).toBeTruthy();
    });

    it('Expired token GET /login -> NextResponse.next() and delete cookie', () => {
      const req = new NextRequest('http://localhost:3000/login', {
        headers: {
          cookie: `checked_token=${expiredToken}`,
        },
      });
      const res = middleware(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();

      const setCookie = res.headers.get('set-cookie');
      const cookieObj = res.cookies.get('checked_token');
      const isDeleted = (cookieObj && cookieObj.value === '' && cookieObj.maxAge === 0) || (setCookie && setCookie.includes('checked_token=;'));
      expect(isDeleted).toBeTruthy();
    });
  });
});
