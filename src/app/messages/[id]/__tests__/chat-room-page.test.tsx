import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatRoomPage from '../page';
import * as useChatHook from '@/hooks/useChat';
import { useAuthStore } from '@/stores/auth-store';

const mockBack = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useParams: () => ({ id: 'f-bob' }),
}));

vi.mock('@/hooks/useChat');
vi.mock('@/hooks/useFriendships', () => ({
  useFriendships: () => ({ friends: [] }),
}));

describe('ChatRoomPage (/messages/[id])', () => {
  const mockSendMessage = vi.fn();
  const mockLoadMoreMessages = vi.fn();
  const mockDeleteMessage = vi.fn();
  const mockSetReplyingToMessage = vi.fn();
  const mockSendTyping = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u-me',
        username: 'me',
        displayName: 'My Name',
        email: 'me@example.com',
        avatarUrl: null,
      } as any,
    });
  });

  it('renders chat skeleton while loading initial messages', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: null,
      messages: [],
      isLoadingInitial: true,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    expect(screen.getByTestId('chat-messages-skeleton')).toBeInTheDocument();
  });

  it('renders conversation messages and handles message send', async () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob', avatarUrl: null, isOnline: true },
      },
      messages: [
        { id: 'm1', content: 'Hey Bob!', senderId: 'u-me', sentAt: new Date().toISOString(), type: 'TEXT' },
      ],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Hey Bob!')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    fireEvent.change(input, { target: { value: 'How are you?' } });
    fireEvent.click(screen.getByTestId('send-message-button'));

    expect(mockSendMessage).toHaveBeenCalledWith('How are you?');
  });

  it('sends message with quote reply and resets reply state', async () => {
    const replyingMessage = {
      id: 'm1',
      content: 'Hello friend',
      senderId: 'f-bob',
      sentAt: new Date().toISOString(),
      type: 'TEXT',
    };

    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [replyingMessage],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: replyingMessage,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    expect(screen.getByText(/Đang trả lời/i)).toBeInTheDocument();
    expect(screen.getAllByText('Hello friend').length).toBeGreaterThanOrEqual(2);

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    fireEvent.change(input, { target: { value: 'I am doing great!' } });
    fireEvent.click(screen.getByTestId('send-message-button'));

    expect(mockSendMessage).toHaveBeenCalledWith('I am doing great!', { replyToMessageId: 'm1' });
    await waitFor(() => {
      expect(mockSetReplyingToMessage).toHaveBeenCalledWith(null);
    });
  });

  it('handles cancel quote reply', () => {
    const replyingMessage = {
      id: 'm1',
      content: 'Hello friend',
      senderId: 'f-bob',
      sentAt: new Date().toISOString(),
      type: 'TEXT',
    };

    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [replyingMessage],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: replyingMessage,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    const cancelReplyBtn = screen.getByTestId('cancel-reply-button');
    fireEvent.click(cancelReplyBtn);

    expect(mockSetReplyingToMessage).toHaveBeenCalledWith(null);
  });

  it('triggers auto-scroll to bottom anchor on message arrival', () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [
        { id: 'm1', content: 'Message 1', senderId: 'u-me', sentAt: new Date().toISOString(), type: 'TEXT' },
      ],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it('does not re-scroll to bottom when older messages are prepended', () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const baseChatState = {
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [
        { id: 'm2', content: 'Message 2', senderId: 'u-me', sentAt: new Date().toISOString(), type: 'TEXT' },
      ],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: true,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    };

    vi.mocked(useChatHook.useChat).mockReturnValue(baseChatState as any);
    const { rerender } = render(<ChatRoomPage />);

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    scrollIntoViewMock.mockClear();

    // Simulate prepending older message m1 at the beginning
    vi.mocked(useChatHook.useChat).mockReturnValue({
      ...baseChatState,
      messages: [
        { id: 'm1', content: 'Message 1 (older)', senderId: 'f-bob', sentAt: new Date().toISOString(), type: 'TEXT' },
        { id: 'm2', content: 'Message 2', senderId: 'u-me', sentAt: new Date().toISOString(), type: 'TEXT' },
      ],
    } as any);

    rerender(<ChatRoomPage />);
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    // Now simulate a new message m3 arriving at the bottom
    vi.mocked(useChatHook.useChat).mockReturnValue({
      ...baseChatState,
      messages: [
        { id: 'm1', content: 'Message 1 (older)', senderId: 'f-bob', sentAt: new Date().toISOString(), type: 'TEXT' },
        { id: 'm2', content: 'Message 2', senderId: 'u-me', sentAt: new Date().toISOString(), type: 'TEXT' },
        { id: 'm3', content: 'Message 3 (new)', senderId: 'f-bob', sentAt: new Date().toISOString(), type: 'TEXT' },
      ],
    } as any);

    rerender(<ChatRoomPage />);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('handles back button navigation', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(mockBack.mock.calls.length + mockPush.mock.calls.length).toBeGreaterThan(0);
  });

  it('handles partner profile navigation on partner header click', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    const partnerBtn = screen.getByRole('button', { name: 'Xem thông tin Bob' });
    fireEvent.click(partnerBtn);

    expect(mockPush).toHaveBeenCalledWith('/u/bob');
  });

  it('renders partner typing indicator in top bar and message list', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [
        { id: 'm1', content: 'Hey', senderId: 'u-me', sentAt: new Date().toISOString(), type: 'TEXT' },
      ],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: true,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    expect(screen.getByText('đang soạn tin...')).toBeInTheDocument();
    expect(screen.getByTestId('partner-typing-bubble')).toBeInTheDocument();
  });

  it('renders load more button when hasMore is true and handles loadMoreMessages', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [
        { id: 'm1', content: 'Hey', senderId: 'u-me', sentAt: new Date().toISOString(), type: 'TEXT' },
      ],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: true,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    const loadMoreBtn = screen.getByText('Tải thêm tin nhắn cũ');
    expect(loadMoreBtn).toBeInTheDocument();

    fireEvent.click(loadMoreBtn);
    expect(mockLoadMoreMessages).toHaveBeenCalled();
  });

  it('handles revoke message action for everyone', () => {
    const recentSentAt = new Date().toISOString();
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [
        { id: 'm-mine', content: 'My recent message', senderId: 'u-me', sentAt: recentSentAt, type: 'TEXT' },
      ],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    const revokeBtn = screen.getByRole('button', { name: 'Thu hồi' });
    fireEvent.click(revokeBtn);

    expect(mockDeleteMessage).toHaveBeenCalledWith('m-mine', 'FOR_EVERYONE');
  });

  it('handles delete for me action', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [
        { id: 'm-bob', content: 'Message from bob', senderId: 'f-bob', sentAt: new Date().toISOString(), type: 'TEXT' },
      ],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    const deleteForMeBtn = screen.getByRole('button', { name: 'Xóa ở phía tôi' });
    fireEvent.click(deleteForMeBtn);

    expect(mockDeleteMessage).toHaveBeenCalledWith('m-bob', 'FOR_ME');
  });

  it('propagates typing indicator state to sendTyping', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' },
      },
      messages: [],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
    } as any);

    render(<ChatRoomPage />);
    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    fireEvent.change(input, { target: { value: 'Typing something...' } });

    expect(mockSendTyping).toHaveBeenCalledWith(true);
  });

  it('renders warm empty state with quick greetings when there are no messages', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: {
        id: 'c1',
        partner: {
          id: 'f-bob',
          displayName: 'Bob Smith',
          username: 'bobsmith',
          avatarUrl: null,
          isOnline: false,
        },
        participantIds: ['f-bob'],
        unreadCount: 0,
        updatedAt: '2026-11-08T00:00:00Z',
      },
      messages: [],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
      isError: false,
      error: null,
    } as any);

    render(<ChatRoomPage />);

    expect(screen.getByTestId('chat-room-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên để bắt đầu trò chuyện!')).toBeInTheDocument();
    expect(screen.getByText('👋 Xin chào!')).toBeInTheDocument();
    expect(screen.getByText('✨ Dạo này thế nào?')).toBeInTheDocument();
  });

  it('renders error card when conversation fails to load and cannot be found', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: null,
      messages: [],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: mockLoadMoreMessages,
      deleteMessage: mockDeleteMessage,
      replyingToMessage: null,
      setReplyingToMessage: mockSetReplyingToMessage,
      sendTyping: mockSendTyping,
      isError: true,
      error: new Error('Conversation not found'),
    } as any);

    render(<ChatRoomPage />);

    expect(screen.getByTestId('chat-room-error')).toBeInTheDocument();
    expect(screen.getByText('Không thể tải cuộc trò chuyện')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quay lại danh sách/i })).toBeInTheDocument();
  });
});
