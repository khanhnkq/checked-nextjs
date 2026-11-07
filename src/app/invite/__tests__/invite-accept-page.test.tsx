import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import FriendInviteAcceptPage from '../[token]/page';
import type { FriendInvitePreview, AcceptInviteResponse } from '@/types/friendship';

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

// 3. Mock Auth Store
interface MockAuthStateType {
  user: {
    id: string;
    displayName: string;
    username: string;
    isGoldMember: boolean;
  } | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const defaultAuthState: MockAuthStateType = {
  user: {
    id: 'user-current',
    displayName: 'Quốc Khánh',
    username: 'khanhnkq',
    isGoldMember: false,
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

// 4. Mock useFriendInvite
const samplePreview: FriendInvitePreview = {
  inviter: {
    id: 'user-inviter-1',
    displayName: 'Thùy Chi',
    username: 'thuychi',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    isGoldMember: true,
  },
  status: 'ACTIVE',
  expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
};

const mockAcceptToken = vi.fn().mockResolvedValue({
  friendshipId: 'fs-accept-1',
  status: 'ACCEPTED',
  friend: samplePreview.inviter,
  acceptedAt: new Date().toISOString(),
} as AcceptInviteResponse);

const mockRefetchPreview = vi.fn().mockResolvedValue(undefined);

interface MockInviteReturnType {
  preview: FriendInvitePreview | null;
  previewTokenQuery: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: typeof mockRefetchPreview;
  };
  acceptToken: typeof mockAcceptToken;
  acceptTokenMutation: {
    isPending: boolean;
  };
}

let mockInviteData: MockInviteReturnType = {
  preview: samplePreview,
  previewTokenQuery: {
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockRefetchPreview,
  },
  acceptToken: mockAcceptToken,
  acceptTokenMutation: {
    isPending: false,
  },
};

vi.mock('@/hooks/useFriendInvite', () => ({
  useFriendInvite: () => mockInviteData,
}));

describe('FriendInviteAcceptPage Integration (/invite/[token])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthState = { ...defaultAuthState };
    mockInviteData = {
      preview: { ...samplePreview },
      previewTokenQuery: {
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetchPreview,
      },
      acceptToken: mockAcceptToken,
      acceptTokenMutation: {
        isPending: false,
      },
    };
  });

  const renderComponent = async (token = 'token_test_123') => {
    const paramsPromise = Promise.resolve({ token });
    let view: ReturnType<typeof render>;
    await act(async () => {
      view = render(<FriendInviteAcceptPage params={paramsPromise} />);
    });
    return view!;
  };

  // 1. Loading state
  it('renders loading skeleton/spinner when preview is loading', async () => {
    mockInviteData = {
      ...mockInviteData,
      preview: null,
      previewTokenQuery: {
        ...mockInviteData.previewTokenQuery,
        isLoading: true,
      },
    };

    await renderComponent();

    expect(screen.getByTestId('invite-accept-loading')).toBeInTheDocument();
    expect(screen.getByText('Đang kiểm tra lời mời...')).toBeInTheDocument();
  });

  // 2. Error state
  it('renders error view when invite token is invalid or expired', async () => {
    mockInviteData = {
      ...mockInviteData,
      preview: null,
      previewTokenQuery: {
        isLoading: false,
        isError: true,
        error: new Error('Liên kết mời không tồn tại hoặc đã hết hạn'),
        refetch: mockRefetchPreview,
      },
    };

    await renderComponent();

    expect(screen.getByTestId('invite-accept-error')).toBeInTheDocument();
    expect(screen.getByText('Không thể mở lời mời')).toBeInTheDocument();
    expect(
      screen.getByText('Liên kết mời không tồn tại hoặc đã hết hạn')
    ).toBeInTheDocument();
  });

  // 3. Retry on error
  it('triggers refetch when clicking Thử lại on error view', async () => {
    const user = userEvent.setup();
    mockInviteData = {
      ...mockInviteData,
      preview: null,
      previewTokenQuery: {
        isLoading: false,
        isError: true,
        error: new Error('Mạng không ổn định'),
        refetch: mockRefetchPreview,
      },
    };

    await renderComponent();

    const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
    await user.click(retryBtn);

    expect(mockRefetchPreview).toHaveBeenCalledTimes(1);
  });

  // 4. Preview card render
  it('renders inviter profile details and crown icon in preview card', async () => {
    await renderComponent();

    expect(screen.getByTestId('invite-preview-card')).toBeInTheDocument();
    expect(screen.getByText('Thùy Chi')).toBeInTheDocument();
    expect(screen.getByText('@thuychi')).toBeInTheDocument();
    expect(screen.getByTestId('gold-crown-icon')).toBeInTheDocument();
    expect(
      screen.getByText(/Đã mời bạn trở thành bạn thân trên Checked/i)
    ).toBeInTheDocument();
  });

  // 5. Unauthenticated action
  it('renders login button redirecting to /login?redirect=/invite/:token when not authenticated', async () => {
    const user = userEvent.setup();
    currentAuthState = {
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    };

    await renderComponent('token_xyz_456');

    const loginBtn = screen.getByTestId('login-to-accept-btn');
    expect(loginBtn).toBeInTheDocument();
    expect(loginBtn).toHaveTextContent('Đăng nhập để kết bạn');

    await user.click(loginBtn);
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=/invite/token_xyz_456');
  });

  // 6. Authenticated accept action
  it('calls acceptToken when tapping Chấp nhận kết bạn button', async () => {
    const user = userEvent.setup();
    await renderComponent('my_token_777');

    const acceptBtn = screen.getByTestId('accept-invite-btn');
    expect(acceptBtn).toBeInTheDocument();
    expect(acceptBtn).toHaveTextContent('Chấp nhận kết bạn');

    await user.click(acceptBtn);

    expect(mockAcceptToken).toHaveBeenCalledWith('my_token_777');

    // Shows success state
    await waitFor(() => {
      expect(screen.getByTestId('invite-accept-success')).toBeInTheDocument();
      expect(screen.getByText('Đã trở thành bạn bè!')).toBeInTheDocument();
    });

    // Home button navigates to root
    const homeBtn = screen.getByTestId('home-btn');
    await user.click(homeBtn);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  // 7. Special status: ALREADY_FRIENDS
  it('renders already friends notice when status is ALREADY_FRIENDS', async () => {
    mockInviteData = {
      ...mockInviteData,
      preview: {
        ...samplePreview,
        status: 'ALREADY_FRIENDS',
      },
    };

    await renderComponent();

    expect(
      screen.getByText('Hai bạn đã là bạn bè của nhau rồi!')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xem trang cá nhân' })).toBeInTheDocument();
  });

  // 8. Special status: EXPIRED
  it('renders expired status notice when status is EXPIRED', async () => {
    mockInviteData = {
      ...mockInviteData,
      preview: {
        ...samplePreview,
        status: 'EXPIRED',
      },
    };

    await renderComponent();

    expect(
      screen.getByText(/Liên kết mời kết bạn này đã hết hạn/i)
    ).toBeInTheDocument();
  });
});
