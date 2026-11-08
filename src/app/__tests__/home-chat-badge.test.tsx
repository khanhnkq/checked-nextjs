import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import * as useConversationsHook from '@/hooks/useConversations';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Auth Store
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: {
        id: 'u-current',
        username: 'vietuser',
        displayName: 'Người Dùng Việt',
        avatarUrl: '/avatar.jpg',
      },
      isAuthenticated: true,
      isHydrated: true,
      updateUser: vi.fn(),
    }),
}));

// Mock Orval React Query Hooks
vi.mock('@/lib/api/generated/endpoints', () => ({
  useGetCurrentUser: () => ({ data: null, isLoading: false }),
  useGetMyFriends: () => ({ data: [], isLoading: false }),
  useGetFeedPhotos: () => ({ data: { content: [] }, isLoading: false, refetch: vi.fn() }),
}));

// Mock Photo Upload Hook
vi.mock('@/hooks/usePhotoUpload', () => ({
  usePhotoUpload: () => ({
    isUploading: false,
    uploadPhoto: vi.fn(),
    error: null,
  }),
}));

// Mock WebRTC camera hook
vi.mock('@/hooks/useWebRTCCamera', () => ({
  useWebRTCCamera: () => ({
    videoRef: { current: document.createElement('video') },
    status: 'streaming',
    facingMode: 'environment',
    isFlashOn: false,
    toggleFlash: vi.fn(),
    zoomLevel: '1x',
    toggleZoom: vi.fn(),
    toggleFacingMode: vi.fn(),
    startCamera: vi.fn(),
  }),
}));

// Mock useConversations hook
vi.mock('@/hooks/useConversations', () => ({
  useConversations: vi.fn(),
}));

describe('Home Top Bar Realtime Chat Badge Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HomeTopBar Component', () => {
    it('does not render red badge when chatBadgeCount is 0', () => {
      render(
        <HomeTopBar
          currentUserAvatar="/avatar.jpg"
          onAvatarClick={vi.fn()}
          onChatClick={vi.fn()}
          chatBadgeCount={0}
        />
      );

      const chatButton = screen.getByRole('button', { name: 'Tin nhắn' });
      expect(chatButton).toBeInTheDocument();
      const badge = chatButton.parentElement?.querySelector('.bg-\\[\\#FF6954\\]');
      expect(badge).toBeNull();
    });

    it('renders red badge when chatBadgeCount is greater than 0', () => {
      render(
        <HomeTopBar
          currentUserAvatar="/avatar.jpg"
          onAvatarClick={vi.fn()}
          onChatClick={vi.fn()}
          chatBadgeCount={5}
        />
      );

      const chatButton = screen.getByRole('button', { name: 'Tin nhắn' });
      expect(chatButton).toBeInTheDocument();
      const badge = chatButton.parentElement?.querySelector('.bg-\\[\\#FF6954\\]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('rounded-full');
    });

    it('triggers onChatClick when user clicks on chat button', async () => {
      const user = userEvent.setup();
      const onChatClick = vi.fn();

      render(
        <HomeTopBar
          currentUserAvatar="/avatar.jpg"
          onAvatarClick={vi.fn()}
          onChatClick={onChatClick}
          chatBadgeCount={2}
        />
      );

      const chatButton = screen.getByRole('button', { name: 'Tin nhắn' });
      await user.click(chatButton);
      expect(onChatClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('HomePage Integration with useConversations', () => {
    it('does not display badge when unreadTotal is 0', () => {
      vi.mocked(useConversationsHook.useConversations).mockReturnValue({
        items: [],
        conversations: [],
        unreadTotal: 0,
        isLoading: false,
        isError: false,
        friends: [],
        refetch: vi.fn(),
      } as any);

      render(<HomePage />);

      const chatButton = screen.getByRole('button', { name: 'Tin nhắn' });
      expect(chatButton).toBeInTheDocument();
      const badge = chatButton.parentElement?.querySelector('.bg-\\[\\#FF6954\\]');
      expect(badge).toBeNull();
    });

    it('displays unread badge when useConversations returns unreadTotal > 0', () => {
      vi.mocked(useConversationsHook.useConversations).mockReturnValue({
        items: [],
        conversations: [],
        unreadTotal: 7,
        isLoading: false,
        isError: false,
        friends: [],
        refetch: vi.fn(),
      } as any);

      render(<HomePage />);

      const chatButton = screen.getByRole('button', { name: 'Tin nhắn' });
      expect(chatButton).toBeInTheDocument();
      const badge = chatButton.parentElement?.querySelector('.bg-\\[\\#FF6954\\]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('w-3', 'h-3', 'bg-[#FF6954]');
    });

    it('navigates to /messages when chat button is clicked on HomePage', async () => {
      const user = userEvent.setup();
      vi.mocked(useConversationsHook.useConversations).mockReturnValue({
        items: [],
        conversations: [],
        unreadTotal: 3,
        isLoading: false,
        isError: false,
        friends: [],
        refetch: vi.fn(),
      } as any);

      render(<HomePage />);

      const chatButton = screen.getByRole('button', { name: 'Tin nhắn' });
      await user.click(chatButton);

      expect(mockPush).toHaveBeenCalledWith('/messages');
    });
  });
});
