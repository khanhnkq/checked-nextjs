import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import FriendRequestsPage from '../page';
import type {
  FriendRequestItem,
  SentFriendRequestItem,
  CloseFriendsQuota,
} from '@/types/friendship';

// 1. Mock Next.js router
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

// 3. Mock API for Mutual Friends
vi.mock('@/lib/api/friendship-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/friendship-api')>();
  return {
    ...actual,
    getMutualFriends: vi.fn().mockResolvedValue([
      {
        id: 'mutual-1',
        username: 'lananh',
        displayName: 'Lan Anh',
        avatarUrl: null,
        isGoldMember: false,
      },
    ]),
  };
});

// 4. Mock Auth Store
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

// 5. Mock useFriendships
const mockAcceptRequest = vi.fn().mockResolvedValue({ friendshipId: 'req-1', status: 'ACCEPTED' });
const mockDeclineRequest = vi.fn().mockResolvedValue(undefined);
const mockCancelRequest = vi.fn().mockResolvedValue(undefined);
const mockAcceptAll = vi.fn().mockResolvedValue(undefined);
const mockDeclineAll = vi.fn().mockResolvedValue(undefined);

const sampleReceivedRequests: FriendRequestItem[] = [
  {
    friendshipId: 'req-rec-1',
    requester: {
      id: 'user-rec-1',
      username: 'hoangviet',
      displayName: 'Hoàng Việt',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      isGoldMember: true,
    },
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    mutualFriendsCount: 3,
  },
  {
    friendshipId: 'req-rec-2',
    requester: {
      id: 'user-rec-2',
      username: 'minhchau',
      displayName: 'Minh Châu',
      avatarUrl: null,
      isGoldMember: false,
    },
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    mutualFriendsCount: 0,
  },
];

const sampleSentRequests: SentFriendRequestItem[] = [
  {
    friendshipId: 'req-sent-1',
    targetUser: {
      id: 'user-sent-1',
      username: 'thanhson',
      displayName: 'Thanh Sơn',
      avatarUrl: null,
      isGoldMember: false,
    },
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

const defaultQuota: CloseFriendsQuota = {
  currentCount: 8,
  maxLimit: 20,
  isGoldMember: false,
  isNearLimit: false,
  isAtLimit: false,
  progress: 0.4,
};

let mockFriendshipsData = {
  receivedRequests: sampleReceivedRequests,
  sentRequests: sampleSentRequests,
  receivedCount: 2,
  sentCount: 1,
  quota: defaultQuota,
  isLoading: false,
  acceptRequest: mockAcceptRequest,
  declineRequest: mockDeclineRequest,
  cancelRequest: mockCancelRequest,
  acceptAll: mockAcceptAll,
  declineAll: mockDeclineAll,
};

vi.mock('@/hooks/useFriendships', () => ({
  useFriendships: () => mockFriendshipsData,
}));

describe('FriendRequestsPage Integration (/friends/requests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthState = { ...defaultAuthState };
    mockFriendshipsData = {
      receivedRequests: [...sampleReceivedRequests],
      sentRequests: [...sampleSentRequests],
      receivedCount: 2,
      sentCount: 1,
      quota: { ...defaultQuota },
      isLoading: false,
      acceptRequest: mockAcceptRequest,
      declineRequest: mockDeclineRequest,
      cancelRequest: mockCancelRequest,
      acceptAll: mockAcceptAll,
      declineAll: mockDeclineAll,
    };
  });

  // 1. Skeleton khi chưa hydrate
  it('renders FriendRequestsSkeleton when not hydrated yet', () => {
    currentAuthState = {
      ...defaultAuthState,
      isHydrated: false,
    };

    render(<FriendRequestsPage />);

    expect(screen.getByTestId('requests-loading-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('friend-requests-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('friend-requests-page')).not.toBeInTheDocument();
  });

  // 2. Redirect khi chưa đăng nhập
  it('redirects to /login?redirect=/friends/requests when hydrated and not authenticated', async () => {
    currentAuthState = {
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    };

    render(<FriendRequestsPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/friends/requests');
    });
    expect(screen.queryByTestId('friend-requests-page')).not.toBeInTheDocument();
  });

  // 3. Render Header, Segmented Control, Quota Bar
  it('renders header, segmented control with counts, and quota bar correctly', () => {
    render(<FriendRequestsPage />);

    // Header
    expect(screen.getByText('Lời mời kết bạn')).toBeInTheDocument();
    const backBtn = screen.getByTestId('requests-back-btn');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveAttribute('aria-label', 'Quay lại');

    // Segmented Control
    const tabReceived = screen.getByTestId('tab-received');
    const tabSent = screen.getByTestId('tab-sent');
    expect(tabReceived).toBeInTheDocument();
    expect(tabSent).toBeInTheDocument();

    // Badges
    const recBadge = screen.getByTestId('received-badge');
    expect(recBadge).toHaveTextContent('2');
    expect(recBadge.className).toContain('bg-error');

    const sentBadge = screen.getByTestId('sent-badge');
    expect(sentBadge).toHaveTextContent('1');

    // Quota Bar
    expect(screen.getByText('BẠN BÈ THÂN THIẾT')).toBeInTheDocument();
    expect(screen.getByText('8/20')).toBeInTheDocument();
  });

  // 4. Chuyển tab Đã nhận -> Đã gửi
  it('switches between tabs and updates display list', async () => {
    const user = userEvent.setup();
    render(<FriendRequestsPage />);

    // Mặc định ở tab Đã nhận: hiển thị Hoàng Việt và Minh Châu
    expect(screen.getByText('Hoàng Việt')).toBeInTheDocument();
    expect(screen.getByText('Minh Châu')).toBeInTheDocument();
    expect(screen.queryByText('Thanh Sơn')).not.toBeInTheDocument();

    // Click tab Đã gửi
    await user.click(screen.getByTestId('tab-sent'));

    // Chuyển sang hiển thị Thanh Sơn
    expect(screen.getByText('Thanh Sơn')).toBeInTheDocument();
    expect(screen.queryByText('Hoàng Việt')).not.toBeInTheDocument();
    expect(screen.queryByText('Minh Châu')).not.toBeInTheDocument();

    // Nút Thu hồi xuất hiện ở tab Đã gửi
    expect(screen.getByRole('button', { name: 'Thu hồi' })).toBeInTheDocument();

    // Click lại tab Đã nhận
    await user.click(screen.getByTestId('tab-received'));
    expect(screen.getByText('Hoàng Việt')).toBeInTheDocument();
  });

  // 5. Hiển thị Batch Action Bar khi >= 2 lời mời đã nhận
  it('shows batch action bar only on received tab when receivedRequests.length >= 2', async () => {
    const user = userEvent.setup();
    render(<FriendRequestsPage />);

    // Đang có 2 yêu cầu ở tab Đã nhận -> thanh hiển thị
    expect(screen.getByTestId('batch-action-bar')).toBeInTheDocument();
    expect(screen.getByTestId('accept-all-btn')).toBeInTheDocument();
    expect(screen.getByTestId('decline-all-btn')).toBeInTheDocument();

    // Chuyển sang tab Đã gửi -> thanh không xuất hiện
    await user.click(screen.getByTestId('tab-sent'));
    expect(screen.queryByTestId('batch-action-bar')).not.toBeInTheDocument();
  });

  it('hides batch action bar when receivedRequests has fewer than 2 items', () => {
    mockFriendshipsData = {
      ...mockFriendshipsData,
      receivedRequests: [sampleReceivedRequests[0]],
      receivedCount: 1,
    };

    render(<FriendRequestsPage />);
    expect(screen.queryByTestId('batch-action-bar')).not.toBeInTheDocument();
  });

  // 6. Bấm Chấp nhận tất cả, Từ chối hết
  it('triggers acceptAll and declineAll from batch action bar', async () => {
    const user = userEvent.setup();
    render(<FriendRequestsPage />);

    const acceptAllBtn = screen.getByTestId('accept-all-btn');
    await user.click(acceptAllBtn);
    expect(mockAcceptAll).toHaveBeenCalledTimes(1);

    const declineAllBtn = screen.getByTestId('decline-all-btn');
    await user.click(declineAllBtn);
    expect(mockDeclineAll).toHaveBeenCalledTimes(1);
  });

  // 7. Bấm Chấp nhận / Từ chối trên card
  it('triggers single accept and decline on friend request cards', async () => {
    const user = userEvent.setup();
    render(<FriendRequestsPage />);

    // Thẻ Hoàng Việt (req-rec-1)
    const acceptBtns = screen.getAllByRole('button', { name: 'Đồng ý' });
    const declineBtns = screen.getAllByRole('button', { name: 'Từ chối' });

    await user.click(acceptBtns[0]);
    expect(mockAcceptRequest).toHaveBeenCalledWith('req-rec-1');

    await user.click(declineBtns[1]);
    expect(mockDeclineRequest).toHaveBeenCalledWith('req-rec-2');
  });

  // 8. Bấm Thu hồi trên card Đã gửi
  it('triggers cancelRequest on sent request card', async () => {
    const user = userEvent.setup();
    render(<FriendRequestsPage />);

    await user.click(screen.getByTestId('tab-sent'));

    const revokeBtn = screen.getByRole('button', { name: 'Thu hồi' });
    await user.click(revokeBtn);
    expect(mockCancelRequest).toHaveBeenCalledWith('req-sent-1');
  });

  // 9. Bấm nút Back
  it('navigates back via router.back() when history.length > 1', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, 'history', {
      writable: true,
      value: { length: 3 },
    });

    render(<FriendRequestsPage />);

    await user.click(screen.getByTestId('requests-back-btn'));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to /profile when history.length <= 1', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, 'history', {
      writable: true,
      value: { length: 1 },
    });

    render(<FriendRequestsPage />);

    await user.click(screen.getByTestId('requests-back-btn'));
    expect(mockPush).toHaveBeenCalledWith('/profile');
    expect(mockBack).not.toHaveBeenCalled();
  });

  // 10. Empty state cho từng tab
  it('renders received empty state when receivedRequests is empty', () => {
    mockFriendshipsData = {
      ...mockFriendshipsData,
      receivedRequests: [],
      receivedCount: 0,
    };

    render(<FriendRequestsPage />);

    expect(screen.getByTestId('empty-received-state')).toBeInTheDocument();
    expect(screen.getByText('Không có lời mời nào')).toBeInTheDocument();
    expect(
      screen.getByText('Khi người khác gửi lời mời kết bạn, bạn sẽ thấy ở đây')
    ).toBeInTheDocument();
  });

  it('renders sent empty state with invite button when sentRequests is empty', async () => {
    const user = userEvent.setup();
    mockFriendshipsData = {
      ...mockFriendshipsData,
      sentRequests: [],
      sentCount: 0,
    };

    render(<FriendRequestsPage />);
    await user.click(screen.getByTestId('tab-sent'));

    expect(screen.getByTestId('empty-sent-state')).toBeInTheDocument();
    expect(screen.getByText('Chưa gửi lời mời nào')).toBeInTheDocument();
    expect(
      screen.getByText('Bạn có thể chia sẻ liên kết hoặc quét mã QR để kết bạn mới')
    ).toBeInTheDocument();

    const inviteBtn = screen.getByTestId('invite-friends-btn');
    expect(inviteBtn).toBeInTheDocument();
    await user.click(inviteBtn);
    expect(mockPush).toHaveBeenCalledWith('/invite');
  });

  // 11. Bấm vào bạn chung mở MutualFriendsSheet
  it('opens MutualFriendsSheet when clicking mutual friends on a card', async () => {
    const user = userEvent.setup();
    render(<FriendRequestsPage />);

    const mutualBtn = screen.getByText('3 bạn chung');
    expect(mutualBtn).toBeInTheDocument();

    await user.click(mutualBtn);

    // Mutual friends sheet header
    await waitFor(() => {
      expect(screen.getByText('Bạn chung')).toBeInTheDocument();
      expect(screen.getByText('Với Hoàng Việt')).toBeInTheDocument();
    });
  });

  // 12. Bấm vào avatar chuyển hướng tới profile người dùng
  it('navigates to user profile /u/:username when clicking avatar', async () => {
    const user = userEvent.setup();
    render(<FriendRequestsPage />);

    const avatarBtn = screen.getByRole('button', { name: /Xem hồ sơ Hoàng Việt/i });
    await user.click(avatarBtn);

    expect(mockPush).toHaveBeenCalledWith('/u/hoangviet');
  });

  // 13. Bấm vào Nâng cấp trên Quota Bar mở Gold Modal
  it('opens and closes Gold upsell modal from Quota Bar', async () => {
    const user = userEvent.setup();
    mockFriendshipsData = {
      ...mockFriendshipsData,
      quota: {
        currentCount: 18,
        maxLimit: 20,
        isGoldMember: false,
        isNearLimit: true,
        isAtLimit: false,
        progress: 0.9,
      },
    };

    render(<FriendRequestsPage />);

    const upgradeBtn = screen.getByRole('button', { name: /Nâng cấp/i });
    expect(upgradeBtn).toBeInTheDocument();

    await user.click(upgradeBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Checked GOLD')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Đã hiểu' });
    await user.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
