import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ProfileTopBar } from '../ProfileTopBar';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
  },
}));

describe('ProfileTopBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị huy hiệu "Checked GOLD" mặc định', () => {
    render(<ProfileTopBar />);
    const badge = screen.getByTestId('checked-gold-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Checked GOLD');
  });

  it('ẩn huy hiệu khi isGoldMember={false}', () => {
    render(<ProfileTopBar isGoldMember={false} />);
    expect(screen.queryByTestId('checked-gold-badge')).not.toBeInTheDocument();
  });

  it('render đầy đủ 3 nút hành động có aria-label tương ứng', () => {
    render(<ProfileTopBar />);
    expect(screen.getByRole('button', { name: 'Bạn bè' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cài đặt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thoát về Camera' })).toBeInTheDocument();
  });

  it('gọi callback onFriendsClick và kích hoạt rung haptic khi bấm nút Bạn bè', () => {
    const onFriendsClick = vi.fn();
    render(<ProfileTopBar onFriendsClick={onFriendsClick} />);

    const friendsBtn = screen.getByRole('button', { name: 'Bạn bè' });
    fireEvent.click(friendsBtn);

    expect(onFriendsClick).toHaveBeenCalledTimes(1);
    expect(haptics.click).toHaveBeenCalledTimes(1);
  });

  it('gọi callback onSettingsClick và kích hoạt rung haptic khi bấm nút Cài đặt', () => {
    const onSettingsClick = vi.fn();
    render(<ProfileTopBar onSettingsClick={onSettingsClick} />);

    const settingsBtn = screen.getByRole('button', { name: 'Cài đặt' });
    fireEvent.click(settingsBtn);

    expect(onSettingsClick).toHaveBeenCalledTimes(1);
    expect(haptics.click).toHaveBeenCalledTimes(1);
  });

  it('gọi callback onCloseClick và kích hoạt rung haptic khi bấm nút Thoát', () => {
    const onCloseClick = vi.fn();
    render(<ProfileTopBar onCloseClick={onCloseClick} />);

    const closeBtn = screen.getByRole('button', { name: 'Thoát về Camera' });
    fireEvent.click(closeBtn);

    expect(onCloseClick).toHaveBeenCalledTimes(1);
    expect(haptics.click).toHaveBeenCalledTimes(1);
  });
});
