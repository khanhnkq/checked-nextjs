import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatRoomTopBar } from '../ChatRoomTopBar';

describe('ChatRoomTopBar Component', () => {
  const partner = {
    id: 'user-2',
    username: 'linhdan',
    displayName: 'Linh Đan',
    avatarUrl: 'https://example.com/avatar.jpg',
    isOnline: true,
  };

  it('renders back button, partner avatar, display name and username', () => {
    render(<ChatRoomTopBar partner={partner} />);

    expect(screen.getByRole('button', { name: /Quay lại/i })).toBeInTheDocument();
    expect(screen.getByText('Linh Đan')).toBeInTheDocument();
    expect(screen.getByText('@linhdan')).toBeInTheDocument();
    const avatarImg = screen.getByAltText('Linh Đan');
    expect(avatarImg).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('displays animated "đang soạn tin..." when isPartnerTyping is true', () => {
    render(<ChatRoomTopBar partner={partner} isPartnerTyping={true} />);

    expect(screen.getByText(/đang soạn tin/i)).toBeInTheDocument();
    expect(screen.queryByText('@linhdan')).not.toBeInTheDocument();
  });

  it('renders initials fallback when avatarUrl is missing', () => {
    const partnerWithoutAvatar = {
      id: 'user-3',
      username: 'namle',
      displayName: 'Nam Lê',
    };

    render(<ChatRoomTopBar partner={partnerWithoutAvatar} />);

    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const handleBack = vi.fn();
    const user = userEvent.setup();

    render(<ChatRoomTopBar partner={partner} onBack={handleBack} />);
    const backBtn = screen.getByRole('button', { name: /Quay lại/i });
    await user.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('calls onPartnerClick when partner header is clicked', async () => {
    const handlePartnerClick = vi.fn();
    const user = userEvent.setup();

    render(<ChatRoomTopBar partner={partner} onPartnerClick={handlePartnerClick} />);
    const partnerBtn = screen.getByRole('button', { name: /Linh Đan/i });
    await user.click(partnerBtn);

    expect(handlePartnerClick).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<ChatRoomTopBar partner={partner} isPartnerTyping={true} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
