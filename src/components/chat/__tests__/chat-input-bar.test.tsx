import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInputBar } from '../ChatInputBar';
import type { MessageResponse } from '@/types/chat';

describe('ChatInputBar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders input with placeholder "Nhập tin nhắn..." and disabled send button initially', () => {
    render(<ChatInputBar onSend={vi.fn()} />);

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    expect(input).toBeInTheDocument();

    const sendBtn = screen.getByRole('button', { name: /Gửi/i });
    expect(sendBtn).toBeDisabled();
  });

  it('enables send button when text is entered and trims input on send', async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<ChatInputBar onSend={handleSend} />);

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    await user.type(input, '   Xin chào!   ');

    const sendBtn = screen.getByRole('button', { name: /Gửi/i });
    expect(sendBtn).not.toBeDisabled();

    await user.click(sendBtn);

    expect(handleSend).toHaveBeenCalledWith('Xin chào!');
    expect(input).toHaveValue('');
    expect(sendBtn).toBeDisabled();
  });

  it('sends message on Enter keypress and allows Shift+Enter for newlines', async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<ChatInputBar onSend={handleSend} />);

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    await user.type(input, 'Tin nhắn test');

    // Shift + Enter should not trigger onSend
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(handleSend).not.toHaveBeenCalled();

    // Plain Enter triggers send
    await user.keyboard('{Enter}');
    expect(handleSend).toHaveBeenCalledWith('Tin nhắn test');
    expect(input).toHaveValue('');
  });

  it('renders reply preview banner when replyingTo is provided and cancels reply', async () => {
    const handleCancelReply = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const replyMsg: MessageResponse = {
      id: 'msg-parent',
      conversationId: 'conv-1',
      senderId: 'user-partner',
      type: 'TEXT',
      content: 'Tin nhắn gốc cần phản hồi',
      sentAt: '2026-11-07T14:00:00.000Z',
    };

    const { rerender } = render(
      <ChatInputBar
        replyingTo={replyMsg}
        onSend={vi.fn()}
        onCancelReply={handleCancelReply}
      />
    );

    expect(screen.getByText('Đang trả lời:')).toBeInTheDocument();
    expect(screen.getByText('Tin nhắn gốc cần phản hồi')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Hủy trả lời/i });
    await user.click(cancelBtn);

    expect(handleCancelReply).toHaveBeenCalledTimes(1);

    // When replyingTo is removed, banner disappears
    rerender(<ChatInputBar replyingTo={null} onSend={vi.fn()} />);
    expect(screen.queryByText('Đang trả lời:')).not.toBeInTheDocument();
  });

  it('emits typing change when user types and debounces to false after inactivity', async () => {
    const handleTypingChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<ChatInputBar onSend={vi.fn()} onTypingChange={handleTypingChange} />);

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    await user.type(input, 'A');

    expect(handleTypingChange).toHaveBeenCalledWith(true);

    // Fast-forward 2500ms
    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(handleTypingChange).toHaveBeenCalledWith(false);
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<ChatInputBar onSend={vi.fn()} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
