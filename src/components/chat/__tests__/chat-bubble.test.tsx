import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatBubble } from '../ChatBubble';
import type { MessageResponse } from '@/types/chat';

describe('ChatBubble Component', () => {
  const baseMessage: MessageResponse = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-me',
    type: 'TEXT',
    content: 'Xin chào, bạn khỏe không?',
    sentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  };

  it('renders my message right-aligned with rounded-br-[6px] and bg-primary', () => {
    render(<ChatBubble message={baseMessage} isMine={true} />);

    const bubble = screen.getByTestId('chat-bubble');
    expect(bubble).toHaveClass('justify-end');

    const contentBox = screen.getByTestId('chat-bubble-content');
    expect(contentBox).toHaveClass('rounded-br-[6px]');
    expect(contentBox).toHaveClass('bg-primary');
    expect(screen.getByText('Xin chào, bạn khỏe không?')).toBeInTheDocument();
  });

  it('renders partner message left-aligned with rounded-bl-[6px] and bg-surface', () => {
    const partnerMessage: MessageResponse = {
      ...baseMessage,
      id: 'msg-2',
      senderId: 'user-partner',
      content: 'Mình khỏe, cảm ơn bạn!',
    };

    render(<ChatBubble message={partnerMessage} isMine={false} />);

    const bubble = screen.getByTestId('chat-bubble');
    expect(bubble).toHaveClass('justify-start');

    const contentBox = screen.getByTestId('chat-bubble-content');
    expect(contentBox).toHaveClass('rounded-bl-[6px]');
    expect(contentBox).toHaveClass('bg-surface');
    expect(screen.getByText('Mình khỏe, cảm ơn bạn!')).toBeInTheDocument();
  });

  it('formats sentAt as HH:mm', () => {
    render(<ChatBubble message={baseMessage} isMine={true} />);
    const timeEl = screen.getByTestId('chat-bubble-time');
    // Regex matches HH:mm (e.g. 14:30 or localized 21:30 depending on UTC/local)
    expect(timeEl.textContent).toMatch(/^\d{2}:\d{2}$/);
  });

  it('renders "Tin nhắn đã được thu hồi" in italics when isRevoked is true', () => {
    const revokedMsg: MessageResponse = {
      ...baseMessage,
      isRevoked: true,
      content: 'Nội dung cũ',
    };

    render(<ChatBubble message={revokedMsg} isMine={true} />);

    expect(screen.getByText('Tin nhắn đã được thu hồi')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung cũ')).not.toBeInTheDocument();
  });

  it('shows read receipt "Đã xem" when isMine is true and readAt is set', () => {
    const readMsg: MessageResponse = {
      ...baseMessage,
      readAt: '2026-11-07T14:35:00.000Z',
    };

    render(<ChatBubble message={readMsg} isMine={true} />);
    expect(screen.getByText('Đã xem')).toBeInTheDocument();
  });

  it('does NOT show "Đã xem" for partner messages even if readAt is present', () => {
    const partnerReadMsg: MessageResponse = {
      ...baseMessage,
      senderId: 'user-partner',
      readAt: '2026-11-07T14:35:00.000Z',
    };

    render(<ChatBubble message={partnerReadMsg} isMine={false} />);
    expect(screen.queryByText('Đã xem')).not.toBeInTheDocument();
  });

  it('renders reply quote snippet when replyToMessage is provided', () => {
    const replyTarget: MessageResponse = {
      id: 'msg-parent',
      conversationId: 'conv-1',
      senderId: 'user-partner',
      type: 'TEXT',
      content: 'Hẹn gặp lúc 3 giờ chiều nhé',
      sentAt: '2026-11-07T14:20:00.000Z',
    };

    const replyMsg: MessageResponse = {
      ...baseMessage,
      replyToMessageId: 'msg-parent',
      content: 'Ok bạn ơi!',
    };

    render(
      <ChatBubble
        message={replyMsg}
        isMine={true}
        replyToMessage={replyTarget}
      />
    );

    expect(screen.getByText('Trả lời tin nhắn')).toBeInTheDocument();
    expect(screen.getByText('Hẹn gặp lúc 3 giờ chiều nhé')).toBeInTheDocument();
    expect(screen.getByText('Ok bạn ơi!')).toBeInTheDocument();
  });

  it('renders photo context thumbnail when photoContext is present', () => {
    const photoMsg: MessageResponse = {
      ...baseMessage,
      type: 'PHOTO_REACTION',
      photoContext: {
        photoId: 'photo-1',
        photoUrl: 'https://example.com/photo.jpg',
        caption: 'Bức ảnh đẹp',
      },
      content: 'Bức ảnh này tuyệt quá!',
    };

    render(<ChatBubble message={photoMsg} isMine={false} />);

    const img = screen.getByRole('img', { name: /Ảnh đính kèm/i });
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(screen.getByText('Bức ảnh này tuyệt quá!')).toBeInTheDocument();
  });

  it('triggers onReply callback when reply button is clicked', async () => {
    const handleReply = vi.fn();
    const user = userEvent.setup();

    render(<ChatBubble message={baseMessage} isMine={false} onReply={handleReply} />);

    const replyBtn = screen.getByRole('button', { name: /Trả lời/i });
    await user.click(replyBtn);

    expect(handleReply).toHaveBeenCalledWith(baseMessage);
  });

  it('triggers onRevoke callback for sender when revoke button is clicked', async () => {
    const handleRevoke = vi.fn();
    const user = userEvent.setup();

    render(<ChatBubble message={baseMessage} isMine={true} onRevoke={handleRevoke} />);

    const revokeBtn = screen.getByRole('button', { name: /Thu hồi/i });
    await user.click(revokeBtn);

    expect(handleRevoke).toHaveBeenCalledWith(baseMessage);
  });

  it('does NOT show revoke button for partner messages or revoked messages', () => {
    const { rerender } = render(
      <ChatBubble message={baseMessage} isMine={false} onRevoke={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /Thu hồi/i })).not.toBeInTheDocument();

    const revokedMsg: MessageResponse = { ...baseMessage, isRevoked: true };
    rerender(<ChatBubble message={revokedMsg} isMine={true} onRevoke={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Thu hồi/i })).not.toBeInTheDocument();
  });

  it('triggers onDeleteForMe callback when delete button is clicked', async () => {
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <ChatBubble
        message={baseMessage}
        isMine={false}
        onDeleteForMe={handleDelete}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Xóa ở phía tôi/i });
    await user.click(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith(baseMessage);
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<ChatBubble message={baseMessage} isMine={true} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
