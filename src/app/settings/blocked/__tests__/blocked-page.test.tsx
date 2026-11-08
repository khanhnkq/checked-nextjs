import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BlockedUsersPage from '../page';
import * as friendshipApi from '@/lib/api/friendship-api';
import { haptics } from '@/lib/utils/haptics';
import type { FriendProfile } from '@/types/friendship';

// 1. Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

// 2. Mock Haptics
vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    selection: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// 3. Mock API
vi.mock('@/lib/api/friendship-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/friendship-api')>();
  return {
    ...actual,
    getBlockedUsers: vi.fn(),
    unblockUser: vi.fn(),
  };
});

// 4. Mock Auth Store
interface MockAuthStateType {
  user: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const defaultAuthState: MockAuthStateType = {
  user: {
    id: 'user-current',
    displayName: 'Quốc Khánh',
    username: 'khanhnkq',
  },
  isAuthenticated: true,
  isHydrated: true,
};

let currentAuthState = { ...defaultAuthState };

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (state: MockAuthStateType) => unknown) => {
    if (typeof selector === 'function') {
      return selector(currentAuthState);
    }
    return currentAuthState;
  },
}));

describe('BlockedUsersPage (/settings/blocked)', () => {
  let queryClient: QueryClient;

  const mockBlockedUsers: FriendProfile[] = [
    {
      id: 'blocked-1',
      username: 'user_one',
      displayName: 'Người Dùng Một',
      avatarUrl: 'https://cdn.checked.com/avatar1.jpg',
    },
    {
      id: 'blocked-2',
      username: 'user_two',
      displayName: 'Người Dùng Hai',
      avatarUrl: null,
    },
  ];

  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthState = { ...defaultAuthState };
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
  });

  it('redirects to /login?redirect=/settings/blocked when unauthenticated', async () => {
    currentAuthState = {
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    };

    renderWithClient(<BlockedUsersPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/settings/blocked');
    });
  });

  it('renders top bar with title "Tài khoản đã bị chặn" and back button navigating to /settings', async () => {
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce([]);

    renderWithClient(<BlockedUsersPage />);

    expect(screen.getByRole('heading', { name: 'Tài khoản đã bị chặn' })).toBeInTheDocument();

    const backButton = screen.getByRole('button', { name: 'Quay lại' });
    expect(backButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(backButton);

    expect(haptics.click).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('renders loading skeleton while fetching blocked users', () => {
    // Return a promise that does not resolve immediately
    vi.mocked(friendshipApi.getBlockedUsers).mockReturnValue(new Promise(() => {}));

    renderWithClient(<BlockedUsersPage />);

    expect(screen.getByTestId('blocked-users-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when blocked users list is empty', async () => {
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce([]);

    renderWithClient(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Chưa có tài khoản nào bị chặn')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Những người bạn chặn sẽ không thể tìm thấy bạn hoặc gửi lời mời kết bạn cho bạn.'
      )
    ).toBeInTheDocument();
  });

  it('renders list of blocked users when data is loaded', async () => {
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce(mockBlockedUsers);

    renderWithClient(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Người Dùng Một')).toBeInTheDocument();
    });

    expect(screen.getByText('@user_one')).toBeInTheDocument();
    expect(screen.getByText('Người Dùng Hai')).toBeInTheDocument();
    expect(screen.getByText('@user_two')).toBeInTheDocument();
  });

  it('opens confirmation dialog when clicking "Bỏ chặn" on a blocked user row', async () => {
    const user = userEvent.setup();
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce(mockBlockedUsers);

    renderWithClient(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Người Dùng Một')).toBeInTheDocument();
    });

    const unblockButtons = screen.getAllByRole('button', { name: /Bỏ chặn/i });
    await user.click(unblockButtons[0]);

    // Check confirmation dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Bỏ chặn Người Dùng Một?' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Sau khi bỏ chặn, hai bạn sẽ có thể tìm thấy nhau và gửi lời mời kết bạn.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();
    expect(screen.getByTestId('dialog-confirm-unblock-button')).toBeInTheDocument();
  });

  it('dismisses dialog when clicking "Hủy" without calling unblockUser', async () => {
    const user = userEvent.setup();
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce(mockBlockedUsers);

    renderWithClient(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Người Dùng Một')).toBeInTheDocument();
    });

    const unblockButtons = screen.getAllByRole('button', { name: /Bỏ chặn/i });
    await user.click(unblockButtons[0]);

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    await user.click(cancelButton);

    expect(haptics.click).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(friendshipApi.unblockUser).not.toHaveBeenCalled();
  });

  it('calls unblockUser, triggers haptics.light, and invalidates query cache on confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce(mockBlockedUsers);
    vi.mocked(friendshipApi.unblockUser).mockResolvedValueOnce(undefined);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderWithClient(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Người Dùng Một')).toBeInTheDocument();
    });

    const unblockButtons = screen.getAllByRole('button', { name: /Bỏ chặn/i });
    await user.click(unblockButtons[0]);

    const confirmButton = screen.getByTestId('dialog-confirm-unblock-button');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(friendshipApi.unblockUser).toHaveBeenCalledWith('blocked-1');
    });

    expect(haptics.light).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['/api/v1/friendships', 'blocked'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['/api/v1/friendships', 'friends'],
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('adheres to Zero Border, Zero Shadow, Zero Blur styling rules', async () => {
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce(mockBlockedUsers);

    const { container } = renderWithClient(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Người Dùng Một')).toBeInTheDocument();
    });

    const html = container.innerHTML;
    expect(html).not.toMatch(/border-[1-9]/);
    expect(html).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner)\b/);
    expect(html).not.toMatch(/backdrop-blur/);
  });
});
