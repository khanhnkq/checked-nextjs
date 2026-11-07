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

  it('không hiển thị huy hiệu "Checked GOLD" mặc định hoặc khi truyền isGoldMember', () => {
    const { rerender } = render(<ProfileTopBar />);
    expect(screen.queryByText('Checked GOLD')).toBeNull();
    expect(screen.queryByTestId('checked-gold-badge')).toBeNull();

    rerender(<ProfileTopBar isGoldMember={true} />);
    expect(screen.queryByText('Checked GOLD')).toBeNull();
    expect(screen.queryByTestId('checked-gold-badge')).toBeNull();

    rerender(<ProfileTopBar isGoldMember={false} />);
    expect(screen.queryByText('Checked GOLD')).toBeNull();
    expect(screen.queryByTestId('checked-gold-badge')).toBeNull();
  });

  it('render đầy đủ 3 nút hành động chuẩn: Quay lại (bên trái), Bạn bè và Cài đặt (bên phải)', () => {
    render(<ProfileTopBar />);
    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    const friendsBtn = screen.getByRole('button', { name: 'Bạn bè' });
    const settingsBtn = screen.getByRole('button', { name: 'Cài đặt' });

    expect(backBtn).toBeInTheDocument();
    expect(friendsBtn).toBeInTheDocument();
    expect(settingsBtn).toBeInTheDocument();

    // Kiểm tra class kích thước 44x44px (w-11 h-11), bg-surface và active:scale-95
    expect(backBtn).toHaveClass('w-11', 'h-11', 'rounded-full', 'bg-surface', 'active:scale-95');
    expect(friendsBtn).toHaveClass('w-11', 'h-11', 'rounded-full', 'bg-surface', 'active:scale-95');
    expect(settingsBtn).toHaveClass('w-11', 'h-11', 'rounded-full', 'bg-surface', 'active:scale-95');
  });

  it('gọi callback onCloseClick và kích hoạt rung haptic khi bấm nút Quay lại', () => {
    const onCloseClick = vi.fn();
    render(<ProfileTopBar onCloseClick={onCloseClick} />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(onCloseClick).toHaveBeenCalledTimes(1);
    expect(haptics.click).toHaveBeenCalledTimes(1);
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
});
