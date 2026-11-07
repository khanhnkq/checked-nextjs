import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MutualFriendsSheet } from '../MutualFriendsSheet';
import * as friendshipApi from '@/lib/api/friendship-api';
import type { FriendProfile } from '@/types/friendship';

vi.mock('@/lib/api/friendship-api', () => ({
  getMutualFriends: vi.fn(),
}));

describe('MutualFriendsSheet Component (1:1 iOS Parity)', () => {
  const mockFriends: FriendProfile[] = [
    {
      id: 'friend-1',
      username: 'lananh',
      displayName: 'Lan Anh',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    },
    {
      id: 'friend-2',
      username: 'hoangviet',
      displayName: 'Hoàng Việt',
      avatarUrl: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <MutualFriendsSheet
        isOpen={false}
        onClose={vi.fn()}
        targetUserId="user-99"
        targetName="Minh Quân"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows loading skeleton while fetching mutual friends', () => {
    // Return a pending promise to stay in loading state
    vi.mocked(friendshipApi.getMutualFriends).mockReturnValue(new Promise(() => {}));

    render(
      <MutualFriendsSheet
        isOpen={true}
        onClose={vi.fn()}
        targetUserId="user-99"
        targetName="Minh Quân"
      />
    );

    expect(screen.getByText('Bạn chung')).toBeInTheDocument();
    expect(screen.getByText('Với Minh Quân')).toBeInTheDocument();
    expect(screen.getByTestId('mutual-friends-skeleton')).toBeInTheDocument();
  });

  it('renders friends list when fetch succeeds', async () => {
    vi.mocked(friendshipApi.getMutualFriends).mockResolvedValue(mockFriends);
    const handleSelect = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <MutualFriendsSheet
        isOpen={true}
        onClose={handleClose}
        targetUserId="user-99"
        targetName="Minh Quân"
        onSelectFriend={handleSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lan Anh')).toBeInTheDocument();
    });

    expect(screen.getByText('@lananh')).toBeInTheDocument();
    expect(screen.getByText('Hoàng Việt')).toBeInTheDocument();
    expect(screen.getByText('@hoangviet')).toBeInTheDocument();
    // Fallback avatar initial for friend-2
    expect(screen.getByText('H')).toBeInTheDocument();

    // Tap on a friend row
    await user.click(screen.getByRole('button', { name: /Lan Anh/i }));
    expect(handleSelect).toHaveBeenCalledWith(mockFriends[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no mutual friends are returned', async () => {
    vi.mocked(friendshipApi.getMutualFriends).mockResolvedValue([]);

    render(
      <MutualFriendsSheet
        isOpen={true}
        onClose={vi.fn()}
        targetUserId="user-99"
        targetName="Minh Quân"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Chưa có bạn chung nào')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Khi cả hai cùng kết bạn với những người khác/i)
    ).toBeInTheDocument();
  });

  it('renders error state with retry button and retries successfully', async () => {
    vi.mocked(friendshipApi.getMutualFriends)
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
      .mockResolvedValueOnce(mockFriends);

    const user = userEvent.setup();

    render(
      <MutualFriendsSheet
        isOpen={true}
        onClose={vi.fn()}
        targetUserId="user-99"
        targetName="Minh Quân"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
    expect(retryBtn).toBeInTheDocument();

    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Lan Anh')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    vi.mocked(friendshipApi.getMutualFriends).mockResolvedValue([]);
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <MutualFriendsSheet
        isOpen={true}
        onClose={handleClose}
        targetUserId="user-99"
        targetName="Minh Quân"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
