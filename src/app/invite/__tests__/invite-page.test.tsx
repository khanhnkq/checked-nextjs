import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import InvitePage from '../page';
import type { FriendInviteLinkInfo } from '@/types/friendship';

// 1. Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useSearchParams: () => mockSearchParams,
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
    avatarUrl?: string | null;
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
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    isGoldMember: true,
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

// 4. Mock useFriendships
let mockReceivedCount = 3;
vi.mock('@/hooks/useFriendships', () => ({
  useFriendships: () => ({
    receivedCount: mockReceivedCount,
  }),
}));

// 5. Mock useFriendInvite
const sampleCurrentInvite: FriendInviteLinkInfo = {
  id: 'link-123',
  inviteUrl: 'https://checked.app/invite/invite_token_123',
  tokenPreview: 'invite_token_123',
  maxUses: 50,
  usedCount: 2,
  status: 'ACTIVE',
};

const mockRotateInviteLink = vi.fn().mockResolvedValue({
  ...sampleCurrentInvite,
  inviteUrl: 'https://checked.app/invite/invite_token_new_456',
  tokenPreview: 'invite_token_new_456',
});
const mockRevokeInviteLink = vi.fn().mockResolvedValue(undefined);
const mockAcceptToken = vi.fn().mockResolvedValue({
  friendshipId: 'fs-999',
  status: 'ACCEPTED',
  friend: {
    id: 'friend-1',
    displayName: 'Minh Thảo',
    username: 'minhthao',
  },
});

let mockInviteData = {
  currentInvite: sampleCurrentInvite as FriendInviteLinkInfo | null,
  currentInviteQuery: {
    isLoading: false,
    isError: false,
  },
  rotateInviteLink: mockRotateInviteLink,
  revokeInviteLink: mockRevokeInviteLink,
  acceptToken: mockAcceptToken,
  rotateInviteMutation: { isPending: false },
  revokeInviteMutation: { isPending: false },
  acceptTokenMutation: { isPending: false },
};

vi.mock('@/hooks/useFriendInvite', () => ({
  useFriendInvite: () => mockInviteData,
}));

describe('InvitePage Integration (/invite)', () => {
  let mockShare: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    currentAuthState = { ...defaultAuthState };
    mockReceivedCount = 3;
    mockInviteData = {
      currentInvite: { ...sampleCurrentInvite },
      currentInviteQuery: {
        isLoading: false,
        isError: false,
      },
      rotateInviteLink: mockRotateInviteLink,
      revokeInviteLink: mockRevokeInviteLink,
      acceptToken: mockAcceptToken,
      rotateInviteMutation: { isPending: false },
      revokeInviteMutation: { isPending: false },
      acceptTokenMutation: { isPending: false },
    };

    mockShare = vi.fn().mockResolvedValue(undefined);

    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });
  });

  // 1. Loading Skeleton khi chưa hydrate
  it('renders loading skeleton when not hydrated yet', () => {
    currentAuthState = {
      ...defaultAuthState,
      isHydrated: false,
    };

    render(<InvitePage />);

    expect(screen.getByTestId('invite-loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('invite-page')).not.toBeInTheDocument();
  });

  // 2. Chuyển hướng khi chưa đăng nhập
  it('redirects to /login?redirect=/invite when not authenticated', async () => {
    currentAuthState = {
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    };

    render(<InvitePage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/invite');
    });
    expect(screen.queryByTestId('invite-page')).not.toBeInTheDocument();
  });

  // 3. Tự động chuyển hướng sang /invite/:token nếu URL có ?token=...
  it('redirects to /invite/[token] when URL contains token query parameter', async () => {
    mockSearchParams = new URLSearchParams('token=xyz_special_token');

    render(<InvitePage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/invite/xyz_special_token');
    });
  });

  // 4. Render Header, 2 Shortcuts, Section Link, Section Nhập mã
  it('renders header, shortcuts, invite link section, and accept section correctly', () => {
    render(<InvitePage />);

    // Header
    expect(screen.getByText('Mời bạn bè')).toBeInTheDocument();
    expect(screen.getByTestId('invite-back-btn')).toBeInTheDocument();

    // Shortcut 1: Trung tâm lời mời kết bạn
    expect(screen.getByText('Trung tâm lời mời kết bạn')).toBeInTheDocument();
    expect(screen.getByText('Xem danh sách lời mời đã nhận & đã gửi')).toBeInTheDocument();
    const countBadge = screen.getByTestId('received-count-badge');
    expect(countBadge).toBeInTheDocument();
    expect(countBadge).toHaveTextContent('3');

    // Shortcut 2: Mã QR của tôi
    expect(screen.getByText('Mã QR của tôi')).toBeInTheDocument();
    expect(screen.getByText('Xem mã QR cá nhân & quét mã bạn bè')).toBeInTheDocument();

    // Section: LINK CỦA BẠN
    expect(screen.getByText('LINK CỦA BẠN')).toBeInTheDocument();
    expect(screen.getByTestId('invite-link-url')).toHaveTextContent(
      'https://checked.app/invite/invite_token_123'
    );
    expect(screen.getByTestId('copy-link-btn')).toBeInTheDocument();
    expect(screen.getByTestId('share-link-btn')).toBeInTheDocument();
    expect(screen.getByTestId('rotate-link-btn')).toBeInTheDocument();
    expect(screen.getByTestId('revoke-link-btn')).toBeInTheDocument();

    // Section: KẾT BẠN BẰNG LINK HOẶC MÃ
    expect(screen.getByText('KẾT BẠN BẰNG LINK HOẶC MÃ')).toBeInTheDocument();
    expect(screen.getByTestId('token-input')).toBeInTheDocument();
    expect(screen.getByTestId('accept-token-btn')).toBeInTheDocument();
  });

  // 5. Click Shortcut 1 điều hướng tới /friends/requests
  it('navigates to /friends/requests when tapping friend requests shortcut', async () => {
    const user = userEvent.setup();
    render(<InvitePage />);

    await user.click(screen.getByTestId('friend-requests-shortcut'));
    expect(mockPush).toHaveBeenCalledWith('/friends/requests');
  });

  // 6. Click Shortcut 2 mở ProfileQrModal
  it('opens and closes ProfileQrModal when tapping QR shortcut', async () => {
    const user = userEvent.setup();
    render(<InvitePage />);

    // Initially modal is closed
    expect(screen.queryByRole('dialog', { name: 'Mã QR' })).not.toBeInTheDocument();

    // Click QR shortcut
    await user.click(screen.getByTestId('qr-action-shortcut'));

    // Modal is opened
    const modal = screen.getByRole('dialog', { name: 'Mã QR' });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText('Mã QR')).toBeInTheDocument();

    // Close modal via back button inside modal
    const closeBtn = within(modal).getByRole('button', { name: 'Quay lại' });
    await user.click(closeBtn);

    expect(screen.queryByRole('dialog', { name: 'Mã QR' })).not.toBeInTheDocument();
  });

  // 7. Sao chép link (clipboard copy)
  it('copies invite URL to clipboard and shows feedback', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<InvitePage />);

    const copyBtn = screen.getByTestId('copy-link-btn');
    expect(copyBtn).toHaveTextContent('Sao chép');

    await user.click(copyBtn);

    expect(clipboardSpy).toHaveBeenCalledWith(
      'https://checked.app/invite/invite_token_123'
    );
    expect(copyBtn).toHaveTextContent('Đã sao chép');
  });

  // 8. Chia sẻ link (navigator.share)
  it('invokes navigator.share when share button is tapped', async () => {
    const user = userEvent.setup();

    render(<InvitePage />);

    const shareBtn = screen.getByTestId('share-link-btn');
    await user.click(shareBtn);

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://checked.app/invite/invite_token_123',
      })
    );
  });

  // 9. Bấm đổi link gọi rotateInviteLink
  it('calls rotateInviteLink when tapping rotate link button', async () => {
    const user = userEvent.setup();
    render(<InvitePage />);

    const rotateBtn = screen.getByTestId('rotate-link-btn');
    await user.click(rotateBtn);

    expect(mockRotateInviteLink).toHaveBeenCalledTimes(1);
  });

  // 10. Bấm hủy link gọi revokeInviteLink
  it('calls revokeInviteLink when tapping revoke link button', async () => {
    const user = userEvent.setup();
    render(<InvitePage />);

    const revokeBtn = screen.getByTestId('revoke-link-btn');
    await user.click(revokeBtn);

    expect(mockRevokeInviteLink).toHaveBeenCalledTimes(1);
  });

  // 11. Nhập token hoặc URL và bấm kết bạn ngay
  it('extracts token from input and calls acceptToken with success feedback', async () => {
    const user = userEvent.setup();
    render(<InvitePage />);

    const input = screen.getByTestId('token-input');
    const submitBtn = screen.getByTestId('accept-token-btn');

    // Initially disabled when empty
    expect(submitBtn).toBeDisabled();

    // Type full URL
    await user.type(input, 'https://checked.app/invite?token=target_token_999');
    expect(submitBtn).not.toBeDisabled();

    await user.click(submitBtn);

    expect(mockAcceptToken).toHaveBeenCalledWith('target_token_999');

    // Shows success feedback
    await waitFor(() => {
      expect(screen.getByTestId('invite-success-banner')).toBeInTheDocument();
      expect(screen.getByText(/Đã kết bạn với Minh Thảo!/i)).toBeInTheDocument();
    });

    // Input is cleared
    expect(input).toHaveValue('');
  });

  // 12. Nút Back điều hướng hợp lý
  it('navigates back on back button click', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, 'history', {
      writable: true,
      value: { length: 3 },
    });

    render(<InvitePage />);

    await user.click(screen.getByTestId('invite-back-btn'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
