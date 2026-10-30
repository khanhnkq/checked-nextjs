import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceSelectSheet, type AudienceFriendItem } from '../AudienceSelectSheet';

describe('AudienceSelectSheet Component (1:1 iOS Parity)', () => {
  const mockFriends: AudienceFriendItem[] = [
    { id: 'f1', name: 'Nguyễn Văn A' },
    { id: 'f2', name: 'Trần Thị B' },
    { id: 'f3', name: 'Lê Hoàng C' },
  ];

  it('renders with ALL_FRIENDS selected by default', () => {
    render(
      <AudienceSelectSheet
        isOpen={true}
        friends={mockFriends}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Người nhận ảnh' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tất cả bạn bè' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bạn cụ thể' })).toBeInTheDocument();
    // Friend list shouldn't be visible when ALL_FRIENDS is selected
    expect(screen.queryByText('DANH SÁCH BẠN BÈ (3)')).not.toBeInTheDocument();
  });

  it('switches to SELECTED_FRIENDS and allows toggling friends', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <AudienceSelectSheet
        isOpen={true}
        friends={mockFriends}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    // Click 'Bạn cụ thể'
    const specificBtn = screen.getByRole('button', { name: 'Bạn cụ thể' });
    await user.click(specificBtn);

    expect(screen.getByText('DANH SÁCH BẠN BÈ (3)')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();

    // Toggle friend f1 and f2
    const friendA = screen.getByText('Nguyễn Văn A');
    await user.click(friendA);

    const friendB = screen.getByText('Trần Thị B');
    await user.click(friendB);

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith('SELECTED_FRIENDS', ['f1', 'f2']);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('confirms ALL_FRIENDS with undefined recipientIds', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <AudienceSelectSheet
        isOpen={true}
        friends={mockFriends}
        initialScope="ALL_FRIENDS"
        onConfirm={handleConfirm}
        onDismiss={vi.fn()}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith('ALL_FRIENDS', undefined);
  });

  it('strictly adheres to zero border, blur, shadow rule', () => {
    const { container } = render(
      <AudienceSelectSheet
        isOpen={true}
        friends={mockFriends}
        initialScope="SELECTED_FRIENDS"
        initialRecipientIds={['f1']}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bblur\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
