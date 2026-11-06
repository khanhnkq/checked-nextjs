import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ProfileHeader } from '../ProfileHeader';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
  },
}));

describe('ProfileHeader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị giá trị mặc định khi không truyền props', () => {
    render(<ProfileHeader />);
    expect(screen.getByText('Người dùng Checked')).toBeInTheDocument();
    expect(screen.getByText('@checked')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
  });

  it('hiển thị đúng tên hiển thị và @username tùy chỉnh', () => {
    render(<ProfileHeader displayName="Quốc Khánh" username="khanhnkq" />);
    expect(screen.getByText('Quốc Khánh')).toBeInTheDocument();
    expect(screen.getByText('@khanhnkq')).toBeInTheDocument();
  });

  it('không nhân đôi ký tự @ nếu username đã có sẵn @', () => {
    render(<ProfileHeader displayName="Quốc Khánh" username="@khanhnkq" />);
    expect(screen.getByText('@khanhnkq')).toBeInTheDocument();
  });

  it('render thẻ ảnh <img> khi có avatarUrl', () => {
    const avatarUrl = 'https://example.com/avatar.jpg';
    render(<ProfileHeader displayName="Quốc Khánh" avatarUrl={avatarUrl} />);

    const img = screen.getByRole('img', { name: 'Quốc Khánh' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', avatarUrl);
    expect(screen.queryByTestId('avatar-fallback')).not.toBeInTheDocument();
  });

  it('render fallback icon User khi avatarUrl là null hoặc rỗng', () => {
    render(<ProfileHeader avatarUrl={null} />);
    expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
  });

  it('gọi callback onAvatarClick và kích hoạt rung haptic khi bấm vào avatar', () => {
    const onAvatarClick = vi.fn();
    render(<ProfileHeader onAvatarClick={onAvatarClick} />);

    const avatarBtn = screen.getByRole('button', {
      name: 'Ảnh đại diện của Người dùng Checked',
    });
    fireEvent.click(avatarBtn);

    expect(onAvatarClick).toHaveBeenCalledTimes(1);
    expect(haptics.click).toHaveBeenCalledTimes(1);
  });

  it('vô hiệu hóa tương tác khi không truyền onAvatarClick', () => {
    render(<ProfileHeader />);
    const avatarBtn = screen.getByRole('button', {
      name: 'Ảnh đại diện của Người dùng Checked',
    });
    expect(avatarBtn).toBeDisabled();
  });
});
