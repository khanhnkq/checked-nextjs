import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BlockedUserRow } from '../BlockedUserRow';
import { haptics } from '@/lib/utils/haptics';
import type { FriendProfile } from '@/types/friendship';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
    selection: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BlockedUserRow', () => {
  const mockUser: FriendProfile = {
    id: 'user-blocked-1',
    username: 'nguyenvana',
    displayName: 'Nguyễn Văn A',
    avatarUrl: 'https://cdn.checked.com/avatar1.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user displayName and username with @ prefix', () => {
    render(<BlockedUserRow user={mockUser} onUnblock={vi.fn()} />);

    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('@nguyenvana')).toBeInTheDocument();
  });

  it('renders avatar image when avatarUrl is provided', () => {
    render(<BlockedUserRow user={mockUser} onUnblock={vi.fn()} />);

    const img = screen.getByRole('img', { name: 'Nguyễn Văn A' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockUser.avatarUrl);
  });

  it('renders uppercase initial fallback when avatarUrl is null', () => {
    const userWithoutAvatar: FriendProfile = {
      id: 'user-blocked-2',
      username: 'tranvanb',
      displayName: 'Trần Văn B',
      avatarUrl: null,
    };

    render(<BlockedUserRow user={userWithoutAvatar} onUnblock={vi.fn()} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('switches to fallback initial when avatar image encounters error', () => {
    render(<BlockedUserRow user={mockUser} onUnblock={vi.fn()} />);

    const img = screen.getByRole('img', { name: 'Nguyễn Văn A' });
    fireEvent.error(img);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
  });

  it('renders unblock button with "Bỏ chặn" text and design tokens', () => {
    render(<BlockedUserRow user={mockUser} onUnblock={vi.fn()} />);

    const button = screen.getByRole('button', { name: /Bỏ chặn/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Bỏ chặn');
    expect(button).toHaveClass('rounded-full', 'bg-surface', 'text-xs', 'font-semibold');
  });

  it('calls onUnblock with user.id and triggers haptics.click when unblock button is clicked', async () => {
    const user = userEvent.setup();
    const handleUnblock = vi.fn();

    render(<BlockedUserRow user={mockUser} onUnblock={handleUnblock} />);

    const button = screen.getByRole('button', { name: /Bỏ chặn/i });
    await user.click(button);

    expect(haptics.click).toHaveBeenCalledTimes(1);
    expect(handleUnblock).toHaveBeenCalledTimes(1);
    expect(handleUnblock).toHaveBeenCalledWith('user-blocked-1');
  });

  it('displays loading spinner and disables button when isUnblocking is true', () => {
    render(<BlockedUserRow user={mockUser} onUnblock={vi.fn()} isUnblocking={true} />);

    const button = screen.getByRole('button', { name: /Bỏ chặn/i });
    expect(button).toBeDisabled();
    expect(screen.getByTestId('unblocking-spinner')).toBeInTheDocument();
    expect(button).not.toHaveTextContent('Bỏ chặn');
  });

  it('does not trigger onUnblock or haptics when clicking while isUnblocking is true', async () => {
    const user = userEvent.setup();
    const handleUnblock = vi.fn();

    render(<BlockedUserRow user={mockUser} onUnblock={handleUnblock} isUnblocking={true} />);

    const button = screen.getByRole('button', { name: /Bỏ chặn/i });
    await user.click(button);

    expect(handleUnblock).not.toHaveBeenCalled();
    expect(haptics.click).not.toHaveBeenCalled();
  });

  it('strictly adheres to Zero Border, Zero Shadow, Zero Blur styling', () => {
    const { container } = render(<BlockedUserRow user={mockUser} onUnblock={vi.fn()} />);

    const html = container.innerHTML;
    // Banned styles: border, shadow, backdrop-blur
    expect(html).not.toMatch(/border-[1-9]/);
    expect(html).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner)\b/);
    expect(html).not.toMatch(/backdrop-blur/);
  });
});
