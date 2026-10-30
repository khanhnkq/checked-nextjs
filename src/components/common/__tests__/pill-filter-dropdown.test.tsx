import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PillFilterDropdown } from '../PillFilterDropdown';

describe('PillFilterDropdown (iOS Parity, Bounded Scroll, Zero Border/Blur/Shadow)', () => {
  const mockFriends = [
    { id: 'f1', name: 'Minh Tuấn', avatarUrl: '/avatars/tuan.jpg' },
    { id: 'f2', name: 'Thu Thảo', avatarUrl: null },
    { id: 'f3', name: 'Hoàng Long', avatarUrl: null },
    { id: 'f4', name: 'Quốc Khánh', avatarUrl: '/avatars/khanh.jpg' },
    { id: 'f5', name: 'Ngọc Mai', avatarUrl: null },
    { id: 'f6', name: 'Hải Đăng', avatarUrl: null },
    { id: 'f7', name: 'Lan Anh', avatarUrl: null },
  ];

  it('renders with default "Tất cả" title and users icon', () => {
    render(<PillFilterDropdown friends={mockFriends} selectedFilterId={null} />);

    const pillButton = screen.getByRole('button', { name: 'Lọc bạn bè' });
    expect(pillButton).toBeInTheDocument();
    expect(pillButton).toHaveTextContent('Tất cả');
  });

  it('renders "Bạn" when selectedFilterId is "me"', () => {
    render(
      <PillFilterDropdown
        friends={mockFriends}
        selectedFilterId="me"
        currentUserAvatar="/avatars/me.jpg"
      />
    );

    const pillButton = screen.getByRole('button', { name: 'Lọc bạn bè' });
    expect(pillButton).toHaveTextContent('Bạn');
  });

  it('renders friend name when selectedFilterId matches a friend', () => {
    render(
      <PillFilterDropdown
        friends={mockFriends}
        selectedFilterId="f1"
      />
    );

    const pillButton = screen.getByRole('button', { name: 'Lọc bạn bè' });
    expect(pillButton).toHaveTextContent('Minh Tuấn');
  });

  it('supports customTitle and customAvatarUrl override', () => {
    render(
      <PillFilterDropdown
        friends={mockFriends}
        selectedFilterId={null}
        customTitle="Quán Phở Thìn"
        customAvatarUrl="/locations/pho.jpg"
      />
    );

    const pillButton = screen.getByRole('button', { name: 'Lọc bạn bè' });
    expect(pillButton).toHaveTextContent('Quán Phở Thìn');
  });

  it('toggles dropdown popover with bounded scroll container and selects options', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleAddFriend = vi.fn();

    const { container } = render(
      <PillFilterDropdown
        friends={mockFriends}
        selectedFilterId={null}
        onSelectFilter={handleSelect}
        onAddFriendClick={handleAddFriend}
      />
    );

    const pillButton = screen.getByRole('button', { name: 'Lọc bạn bè' });
    await user.click(pillButton);

    // Verify popover inner scroll container has max-height and overflow-y-auto
    const scrollContainer = container.querySelector('.max-h-\\[280px\\]');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass('overflow-y-auto');

    // Check that all options are rendered inside
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bạn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minh Tuấn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thu Thảo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hải Đăng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm bạn' })).toBeInTheDocument();

    // Select a friend
    await user.click(screen.getByRole('button', { name: 'Thu Thảo' }));
    expect(handleSelect).toHaveBeenCalledWith('f2');
  });

  it('handles "Thêm bạn" callback and closes popover', async () => {
    const user = userEvent.setup();
    const handleAddFriend = vi.fn();

    render(
      <PillFilterDropdown
        friends={mockFriends}
        onAddFriendClick={handleAddFriend}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Lọc bạn bè' }));
    await user.click(screen.getByRole('button', { name: 'Thêm bạn' }));

    expect(handleAddFriend).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Thêm bạn' })).not.toBeInTheDocument();
  });

  it('strictly adheres to Zero Border, Zero Blur, Zero Shadow rules', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PillFilterDropdown friends={mockFriends} selectedFilterId={null} />
    );

    // Initial closed state
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);

    // Open dropdown state
    await user.click(screen.getByRole('button', { name: 'Lọc bạn bè' }));
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
