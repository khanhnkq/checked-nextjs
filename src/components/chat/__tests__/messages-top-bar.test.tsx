import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagesTopBar } from '../MessagesTopBar';

describe('MessagesTopBar Component', () => {
  it('renders back button, title "Tin nhắn", and "Thêm bạn" button', () => {
    render(<MessagesTopBar />);

    expect(screen.getByRole('button', { name: /Quay lại/i })).toBeInTheDocument();
    expect(screen.getByText('Tin nhắn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm bạn/i })).toBeInTheDocument();
  });

  it('renders custom title if provided', () => {
    render(<MessagesTopBar title="Hộp thư" />);
    expect(screen.getByText('Hộp thư')).toBeInTheDocument();
  });

  it('triggers onBack when back button is clicked', async () => {
    const handleBack = vi.fn();
    const user = userEvent.setup();

    render(<MessagesTopBar onBack={handleBack} />);
    const backBtn = screen.getByRole('button', { name: /Quay lại/i });
    await user.click(backBtn);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('triggers onAddFriend when add friend button is clicked', async () => {
    const handleAddFriend = vi.fn();
    const user = userEvent.setup();

    render(<MessagesTopBar onAddFriend={handleAddFriend} />);
    const addFriendBtn = screen.getByRole('button', { name: /Thêm bạn/i });
    await user.click(addFriendBtn);

    expect(handleAddFriend).toHaveBeenCalledTimes(1);
  });

  it('does NOT render red badge dot when pendingRequestsCount is 0 or undefined', () => {
    const { rerender } = render(<MessagesTopBar pendingRequestsCount={0} />);
    expect(screen.queryByTestId('add-friend-badge-dot')).not.toBeInTheDocument();

    rerender(<MessagesTopBar />);
    expect(screen.queryByTestId('add-friend-badge-dot')).not.toBeInTheDocument();
  });

  it('renders red badge dot when pendingRequestsCount > 0', () => {
    render(<MessagesTopBar pendingRequestsCount={3} />);
    expect(screen.getByTestId('add-friend-badge-dot')).toBeInTheDocument();
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<MessagesTopBar pendingRequestsCount={2} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
