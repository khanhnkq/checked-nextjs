import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FriendRequestsBanner } from '../FriendRequestsBanner';

describe('FriendRequestsBanner Component', () => {
  it('renders default state when pendingRequestsCount is 0 or undefined', () => {
    render(<FriendRequestsBanner pendingRequestsCount={0} />);

    expect(screen.getByText('Lời mời kết bạn')).toBeInTheDocument();
    expect(screen.getByText('Quản lý lời mời đã nhận & đã gửi')).toBeInTheDocument();
    expect(screen.queryByTestId('friend-requests-count-badge')).not.toBeInTheDocument();
  });

  it('renders pending count badge and active subtitle when pendingRequestsCount > 0', () => {
    render(<FriendRequestsBanner pendingRequestsCount={5} />);

    expect(screen.getByText('Lời mời kết bạn')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('5 người đang chờ bạn phản hồi')).toBeInTheDocument();
    expect(screen.getByTestId('friend-requests-count-badge')).toBeInTheDocument();
  });

  it('renders avatar stack preview when pendingRequesters is provided (max 3)', () => {
    const requesters = [
      { id: '1', displayName: 'Alex', avatarUrl: 'https://example.com/alex.jpg' },
      { id: '2', displayName: 'Bình', avatarUrl: null },
      { id: '3', displayName: 'Cường', avatarUrl: 'https://example.com/cuong.jpg' },
      { id: '4', displayName: 'Dũng', avatarUrl: null },
    ];

    render(<FriendRequestsBanner pendingRequestsCount={4} pendingRequesters={requesters} />);

    const avatars = screen.getAllByTestId('requester-avatar-preview');
    expect(avatars).toHaveLength(3);
    expect(screen.getByText('B')).toBeInTheDocument(); // Bình fallback initial
  });

  it('triggers onClick callback when banner is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<FriendRequestsBanner onClick={handleClick} pendingRequestsCount={2} />);
    const bannerBtn = screen.getByRole('button');
    await user.click(bannerBtn);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<FriendRequestsBanner pendingRequestsCount={3} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
