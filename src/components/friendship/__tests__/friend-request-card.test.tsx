import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FriendRequestCard } from '../FriendRequestCard';
import type { FriendRequestItem, SentFriendRequestItem } from '@/types/friendship';

describe('FriendRequestCard Component (1:1 iOS Parity)', () => {
  const receivedItem: FriendRequestItem = {
    friendshipId: 'req-123',
    requester: {
      id: 'user-1',
      username: 'alexnguyen',
      displayName: 'Alex Nguyễn',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      isGoldMember: true,
    },
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    mutualFriendsCount: 4,
  };

  const sentItem: SentFriendRequestItem = {
    friendshipId: 'req-456',
    targetUser: {
      id: 'user-2',
      username: 'minhtran',
      displayName: 'Minh Trần',
      avatarUrl: null,
      isGoldMember: false,
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  };

  it('renders received request card with all info and action buttons', async () => {
    const handleAccept = vi.fn();
    const handleDecline = vi.fn();
    const handleTapAvatar = vi.fn();
    const user = userEvent.setup();

    render(
      <FriendRequestCard
        item={receivedItem}
        tab="received"
        onAccept={handleAccept}
        onDecline={handleDecline}
        onTapAvatar={handleTapAvatar}
      />
    );

    expect(screen.getByText('Alex Nguyễn')).toBeInTheDocument();
    expect(screen.getByText('@alexnguyen')).toBeInTheDocument();
    expect(screen.getByText('4 bạn chung')).toBeInTheDocument();
    expect(screen.getByTestId('gold-crown-icon')).toBeInTheDocument();

    // Check actions
    const declineBtn = screen.getByRole('button', { name: 'Từ chối' });
    const acceptBtn = screen.getByRole('button', { name: 'Đồng ý' });

    await user.click(declineBtn);
    expect(handleDecline).toHaveBeenCalledTimes(1);

    await user.click(acceptBtn);
    expect(handleAccept).toHaveBeenCalledTimes(1);

    const avatarBtn = screen.getByRole('button', { name: /Xem hồ sơ Alex Nguyễn/i });
    await user.click(avatarBtn);
    expect(handleTapAvatar).toHaveBeenCalledTimes(1);
  });

  it('renders fallback avatar initial when avatarUrl is missing', () => {
    render(<FriendRequestCard item={sentItem} tab="sent" />);

    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('Minh Trần')).toBeInTheDocument();
    expect(screen.getByText('@minhtran')).toBeInTheDocument();
    expect(screen.queryByTestId('gold-crown-icon')).not.toBeInTheDocument();
  });

  it('renders sent request card with revoke action', async () => {
    const handleCancelSent = vi.fn();
    const user = userEvent.setup();

    render(
      <FriendRequestCard
        item={sentItem}
        tab="sent"
        onCancelSent={handleCancelSent}
      />
    );

    const revokeBtn = screen.getByRole('button', { name: 'Thu hồi' });
    expect(revokeBtn).toBeInTheDocument();

    await user.click(revokeBtn);
    expect(handleCancelSent).toHaveBeenCalledTimes(1);
  });

  it('disables action buttons when isLoadingAction is true', () => {
    render(
      <FriendRequestCard
        item={receivedItem}
        tab="received"
        isLoadingAction={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Đồng ý' })).toBeDisabled();
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<FriendRequestCard item={receivedItem} tab="received" />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
