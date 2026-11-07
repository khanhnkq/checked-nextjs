import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserProfilePage from '../[username]/page';
import * as friendshipApi from '@/lib/api/friendship-api';
import type { UserProfileWithRelation } from '@/types/friendship';

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
    getUserProfileByUsername: vi.fn(),
    getMutualFriends: vi.fn().mockResolvedValue([]),
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
    id: 'user-current-id',
    displayName: 'Người Dùng Hiện Tại',
    username: 'myuser',
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

// 5. Sample Profile Data
const sampleProfile: UserProfileWithRelation = {
  id: 'user-target-1',
  username: 'vietnam_travel',
  displayName: 'Du Lịch Việt',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  isGoldMember: true,
  relationshipStatus: 'NONE',
  friendshipId: null,
  mutualFriendsCount: 3,
  mutualFriendsPreview: [
    {
      id: 'm1',
      username: 'lananh',
      displayName: 'Lan Anh',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    },
  ],
};

// 6. Mock useFriendships
const mockSendRequest = vi.fn().mockResolvedValue({ friendshipId: 'fs-new', status: 'PENDING' });
const mockAcceptRequest = vi.fn().mockResolvedValue({ friendshipId: 'fs-1', status: 'ACCEPTED' });
const mockCancelRequest = vi.fn().mockResolvedValue(undefined);
const mockUnfriend = vi.fn().mockResolvedValue(undefined);
const mockBlockUser = vi.fn().mockResolvedValue(undefined);
const mockUnblockUser = vi.fn().mockResolvedValue(undefined);

const defaultFriendshipsHook = {
  friendsQuery: {} as any,
  receivedRequestsQuery: {} as any,
  receivedCountQuery: {} as any,
  sentRequestsQuery: {} as any,
  sentCountQuery: {} as any,
  friends: [],
  receivedRequests: [],
  receivedCount: 0,
  sentRequests: [],
  sentCount: 0,
  quota: {
    currentCount: 5,
    maxLimit: 20,
    isGoldMember: false,
    isNearLimit: false,
    isAtLimit: false,
    progress: 0.25,
  },
  isGold: false,
  isLoading: false,
  isError: false,
  refetchAll: vi.fn(),
  sendRequest: mockSendRequest,
  acceptRequest: mockAcceptRequest,
  declineRequest: vi.fn(),
  cancelRequest: mockCancelRequest,
  unfriend: mockUnfriend,
  blockUser: mockBlockUser,
  unblockUser: mockUnblockUser,
  acceptAll: vi.fn(),
  declineAll: vi.fn(),
  sendRequestMutation: { isPending: false } as any,
  acceptRequestMutation: { isPending: false } as any,
  declineRequestMutation: { isPending: false } as any,
  cancelRequestMutation: { isPending: false } as any,
  unfriendMutation: { isPending: false } as any,
  blockUserMutation: { isPending: false } as any,
  unblockUserMutation: { isPending: false } as any,
  acceptAllMutation: { isPending: false } as any,
  declineAllMutation: { isPending: false } as any,
};

vi.mock('@/hooks/useFriendships', () => ({
  useFriendships: () => defaultFriendshipsHook,
}));

describe('UserProfilePage Integration (/u/[username])', () => {
  let queryClient: QueryClient;

  const renderWithClient = async (ui: React.ReactElement) => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <QueryClientProvider client={queryClient}>
          {ui}
        </QueryClientProvider>
      );
    });
    return result!;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthState = { ...defaultAuthState };
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValue({ ...sampleProfile });
  });

  describe('Loading & Error States', () => {
    it('hiển thị loading skeleton phẳng khi query đang tải dữ liệu', async () => {
      // Pending query promise never resolves immediately
      vi.mocked(friendshipApi.getUserProfileByUsername).mockReturnValue(new Promise(() => {}));

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      expect(screen.getByTestId('user-profile-skeleton')).toBeInTheDocument();
    });

    it('hiển thị thông báo 404 không tìm thấy người dùng khi API trả về lỗi', async () => {
      vi.mocked(friendshipApi.getUserProfileByUsername).mockRejectedValue(
        new Error('User not found')
      );

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'nonexistent_user' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-not-found')).toBeInTheDocument();
      });

      expect(screen.getByText(/không tìm thấy người dùng/i)).toBeInTheDocument();
      expect(screen.getAllByText(/@nonexistent_user/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Profile Information Display', () => {
    it('hiển thị đầy đủ thông tin: họ tên, username, avatar ảnh, và vương miện Gold', async () => {
      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByText('Du Lịch Việt')).toBeInTheDocument();
      });

      expect(screen.getAllByText('@vietnam_travel').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('gold-crown-badge')).toBeInTheDocument();

      const avatarImg = screen.getByRole('img', { name: /du lịch việt/i });
      expect(avatarImg).toHaveAttribute('src', sampleProfile.avatarUrl);
    });

    it('hiển thị ký tự viết tắt fallback khi người dùng không có avatarUrl', async () => {
      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        avatarUrl: null,
        isGoldMember: false,
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByText('Du Lịch Việt')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('gold-crown-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('D');
    });
  });

  describe('Smart Action Buttons by relationshipStatus', () => {
    it('status NONE: hiển thị nút "+ Thêm bạn bè" và gọi sendRequest khi bấm', async () => {
      const user = userEvent.setup();
      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        relationshipStatus: 'NONE',
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-btn-add-friend')).toBeInTheDocument();
      });

      const addBtn = screen.getByTestId('action-btn-add-friend');
      expect(addBtn).toHaveTextContent('+ Thêm bạn bè');

      await user.click(addBtn);

      expect(mockSendRequest).toHaveBeenCalledWith(sampleProfile.id);
    });

    it('status PENDING_SENT: hiển thị nút "Đã gửi lời mời" và gọi cancelRequest khi bấm', async () => {
      const user = userEvent.setup();
      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        relationshipStatus: 'PENDING_SENT',
        friendshipId: 'fs-sent-123',
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-btn-pending-sent')).toBeInTheDocument();
      });

      const sentBtn = screen.getByTestId('action-btn-pending-sent');
      expect(sentBtn).toHaveTextContent('Đã gửi lời mời');

      await user.click(sentBtn);

      expect(mockCancelRequest).toHaveBeenCalledWith('fs-sent-123');
    });

    it('status PENDING_RECEIVED: hiển thị nút "Chấp nhận kết bạn" và gọi acceptRequest khi bấm', async () => {
      const user = userEvent.setup();
      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        relationshipStatus: 'PENDING_RECEIVED',
        friendshipId: 'fs-recv-456',
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-btn-accept')).toBeInTheDocument();
      });

      const acceptBtn = screen.getByTestId('action-btn-accept');
      expect(acceptBtn).toHaveTextContent('Chấp nhận kết bạn');

      await user.click(acceptBtn);

      expect(mockAcceptRequest).toHaveBeenCalledWith('fs-recv-456');
    });

    it('status ACCEPTED: hiển thị nút "Bạn bè" kèm icon Check và hỗ trợ hủy kết bạn (unfriend)', async () => {
      const user = userEvent.setup();
      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        relationshipStatus: 'ACCEPTED',
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-btn-accepted')).toBeInTheDocument();
      });

      const friendBtn = screen.getByTestId('action-btn-accepted');
      expect(friendBtn).toHaveTextContent('Bạn bè');

      await user.click(friendBtn);

      expect(mockUnfriend).toHaveBeenCalledWith(sampleProfile.id);
    });

    it('status SELF: hiển thị nút "Chỉnh sửa hồ sơ" và điều hướng sang /profile khi bấm', async () => {
      const user = userEvent.setup();
      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        id: 'user-current-id',
        username: 'myuser',
        relationshipStatus: 'SELF',
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'myuser' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-btn-self')).toBeInTheDocument();
      });

      const selfBtn = screen.getByTestId('action-btn-self');
      expect(selfBtn).toHaveTextContent('Chỉnh sửa hồ sơ');

      await user.click(selfBtn);

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('status UNAUTHENTICATED: hiển thị nút "Đăng nhập để kết bạn" và chuyển hướng /login?redirect=/u/{username}', async () => {
      const user = userEvent.setup();
      currentAuthState = {
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      };

      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        relationshipStatus: 'UNAUTHENTICATED',
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-btn-login')).toBeInTheDocument();
      });

      const loginBtn = screen.getByTestId('action-btn-login');
      expect(loginBtn).toHaveTextContent('Đăng nhập để kết bạn');

      await user.click(loginBtn);

      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/u/vietnam_travel');
    });

    it('status BLOCKED: hiển thị nút "Bỏ chặn" và gọi unblockUser khi bấm', async () => {
      const user = userEvent.setup();
      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        relationshipStatus: 'BLOCKED',
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('action-btn-unblock')).toBeInTheDocument();
      });

      const unblockBtn = screen.getByTestId('action-btn-unblock');
      expect(unblockBtn).toHaveTextContent('Bỏ chặn');

      await user.click(unblockBtn);

      expect(mockUnblockUser).toHaveBeenCalledWith(sampleProfile.id);
    });
  });

  describe('Mutual Friends Section', () => {
    it('hiển thị card bạn chung khi mutualFriendsCount > 0 và mở MutualFriendsSheet khi bấm', async () => {
      const user = userEvent.setup();
      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('mutual-friends-card')).toBeInTheDocument();
      });

      expect(screen.getByText(/3 bạn chung/i)).toBeInTheDocument();

      const card = screen.getByTestId('mutual-friends-card');
      await user.click(card);

      // Sheet title should appear
      await waitFor(() => {
        expect(screen.getByText(/Với Du Lịch Việt/i)).toBeInTheDocument();
      });
    });

    it('ẩn card bạn chung khi mutualFriendsCount bằng 0', async () => {
      vi.mocked(friendshipApi.getUserProfileByUsername).mockResolvedValueOnce({
        ...sampleProfile,
        mutualFriendsCount: 0,
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByText('Du Lịch Việt')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('mutual-friends-card')).not.toBeInTheDocument();
    });
  });

  describe('Back Navigation', () => {
    it('bấm nút Back gọi router.back() khi window.history.length > 1', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'history', {
        value: { length: 3 },
        writable: true,
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-back-btn')).toBeInTheDocument();
      });

      const backBtn = screen.getByTestId('user-profile-back-btn');
      await user.click(backBtn);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('bấm nút Back gọi router.push("/") khi window.history.length <= 1', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'history', {
        value: { length: 1 },
        writable: true,
      });

      await renderWithClient(<UserProfilePage params={Promise.resolve({ username: 'vietnam_travel' })} />);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-back-btn')).toBeInTheDocument();
      });

      const backBtn = screen.getByTestId('user-profile-back-btn');
      await user.click(backBtn);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
