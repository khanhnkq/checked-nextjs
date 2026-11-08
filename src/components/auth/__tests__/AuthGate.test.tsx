import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import { AuthGate, isPublicRoute } from '../AuthGate';
import { useAuthStore } from '@/stores/auth-store';

// 1. Mock Next.js navigation
let mockPathname = '/';
let mockSearchParams = new URLSearchParams();
const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// Helper to create JWT tokens
function createValidJwt(expiresInSeconds = 3600): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) + expiresInSeconds })
  ).toString('base64url');
  return `${header}.${payload}.sig`;
}

function createExpiredJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 100 })
  ).toString('base64url');
  return `${header}.${payload}.sig`;
}

describe('isPublicRoute helper', () => {
  it('identifies public paths correctly', () => {
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/login/oauth')).toBe(true);
    expect(isPublicRoute('/register')).toBe(true);
    expect(isPublicRoute('/verify-otp')).toBe(true);
    expect(isPublicRoute('/complete-profile')).toBe(true);
    expect(isPublicRoute('/offline')).toBe(true);
    expect(isPublicRoute('/invite')).toBe(true);
    expect(isPublicRoute('/invite/abc-123')).toBe(true);
    expect(isPublicRoute('/u/khanhnkq')).toBe(true);
  });

  it('identifies protected paths correctly', () => {
    expect(isPublicRoute('/')).toBe(false);
    expect(isPublicRoute('/calorie')).toBe(false);
    expect(isPublicRoute('/expense')).toBe(false);
    expect(isPublicRoute('/settings')).toBe(false);
    expect(isPublicRoute('/profile')).toBe(false);
    expect(isPublicRoute('/u')).toBe(false);
    expect(isPublicRoute('')).toBe(false);
    expect(isPublicRoute(null)).toBe(false);
  });
});

describe('AuthGate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
    mockSearchParams = new URLSearchParams();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders skeleton and blocks children rendering on protected route when isHydrated is false', () => {
    const childMountFn = vi.fn();
    function SecretChild() {
      useEffect(() => {
        childMountFn();
      }, []);
      return <div data-testid="protected-child">Secret Child</div>;
    }

    mockPathname = '/';
    useAuthStore.setState({
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,
    });

    render(
      <AuthGate>
        <SecretChild />
      </AuthGate>
    );

    // Skeleton must be rendered
    expect(screen.getByLabelText('Đang tải giao diện chính')).toBeInTheDocument();
    // Child component must NOT be rendered in DOM
    expect(screen.queryByTestId('protected-child')).not.toBeInTheDocument();
    // Child effect must NOT run
    expect(childMountFn).not.toHaveBeenCalled();
    // Router replace should not be called yet while hydrating
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders skeleton, blocks children and redirects to /login on root protected route when unauthenticated', async () => {
    mockPathname = '/';
    useAuthStore.setState({
      accessToken: null,
      isAuthenticated: false,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div data-testid="protected-child">Protected Content</div>
      </AuthGate>
    );

    // Skeleton is shown
    expect(screen.getByLabelText('Đang tải giao diện chính')).toBeInTheDocument();
    // Child is blocked
    expect(screen.queryByTestId('protected-child')).not.toBeInTheDocument();
    // Redirects to /login (no ?redirect= for root path '/')
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('renders skeleton, blocks children and redirects with redirect query on subpath protected route when unauthenticated', async () => {
    mockPathname = '/calorie';
    useAuthStore.setState({
      accessToken: null,
      isAuthenticated: false,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div data-testid="protected-child">Calorie Content</div>
      </AuthGate>
    );

    expect(screen.getByLabelText('Đang tải giao diện chính')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-child')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Fcalorie');
    });
  });

  it('renders children normally on protected route when hydrated and token is valid', () => {
    mockPathname = '/';
    const validToken = createValidJwt();
    useAuthStore.setState({
      accessToken: validToken,
      isAuthenticated: true,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div data-testid="protected-child">Welcome Home</div>
      </AuthGate>
    );

    expect(screen.getByTestId('protected-child')).toBeInTheDocument();
    expect(screen.queryByLabelText('Đang tải giao diện chính')).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders children immediately on public routes (/login, /register, /offline, /invite/...) even if unauthenticated', () => {
    mockPathname = '/login';
    useAuthStore.setState({
      accessToken: null,
      isAuthenticated: false,
      isHydrated: true,
    });

    const { rerender } = render(
      <AuthGate>
        <div data-testid="public-content">Login Form</div>
      </AuthGate>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    expect(screen.queryByLabelText('Đang tải giao diện chính')).not.toBeInTheDocument();

    // Also on /invite/123
    mockPathname = '/invite/abc-xyz';
    rerender(
      <AuthGate>
        <div data-testid="public-content">Invite Content</div>
      </AuthGate>
    );
    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    expect(screen.queryByLabelText('Đang tải giao diện chính')).not.toBeInTheDocument();
  });

  it('redirects authenticated user away from /login to safe target', async () => {
    mockPathname = '/login';
    mockSearchParams = new URLSearchParams('redirect=/settings');
    const validToken = createValidJwt();
    useAuthStore.setState({
      accessToken: validToken,
      isAuthenticated: true,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div>Login Page</div>
      </AuthGate>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/settings');
    });
  });

  it('prevents open redirect on /login and falls back to /', async () => {
    mockPathname = '/login';
    mockSearchParams = new URLSearchParams('redirect=//malicious-site.com');
    const validToken = createValidJwt();
    useAuthStore.setState({
      accessToken: validToken,
      isAuthenticated: true,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div>Login Page</div>
      </AuthGate>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('prevents redirect loops when target is /login or /register and falls back to /', async () => {
    mockPathname = '/login';
    mockSearchParams = new URLSearchParams('redirect=/login');
    const validToken = createValidJwt();
    useAuthStore.setState({
      accessToken: validToken,
      isAuthenticated: true,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div>Login Page</div>
      </AuthGate>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('calls logout and redirects to /login when token is expired', async () => {
    mockPathname = '/expense';
    const expiredToken = createExpiredJwt();
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout');

    useAuthStore.setState({
      accessToken: expiredToken,
      isAuthenticated: true,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div data-testid="protected-child">Expense Dashboard</div>
      </AuthGate>
    );

    expect(screen.getByLabelText('Đang tải giao diện chính')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-child')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Fexpense');
    });
  });

  it('handles visibilitychange and logs out if token has expired while in background', async () => {
    mockPathname = '/calorie';
    const validToken = createValidJwt();
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout');

    useAuthStore.setState({
      accessToken: validToken,
      isAuthenticated: true,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div data-testid="child">Calorie</div>
      </AuthGate>
    );

    // Simulate token expiring in background and user switching back to tab
    const expiredToken = createExpiredJwt();

    act(() => {
      useAuthStore.setState({ accessToken: expiredToken });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Fcalorie');
    });
  });

  it('schedules timer to auto logout when token expires', () => {
    vi.useFakeTimers();
    mockPathname = '/settings';
    // 60 seconds token remaining
    const token = createValidJwt(60);
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout');

    useAuthStore.setState({
      accessToken: token,
      isAuthenticated: true,
      isHydrated: true,
    });

    render(
      <AuthGate>
        <div>Settings</div>
      </AuthGate>
    );

    // Advance time past remaining time
    act(() => {
      vi.advanceTimersByTime(70000);
    });

    expect(logoutSpy).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Fsettings');

    vi.useRealTimers();
  });
});
