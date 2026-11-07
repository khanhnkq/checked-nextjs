import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useChat } from '../useChat';
import * as chatApi from '@/lib/api/chat-api';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageResponse, ReadReceiptEvent, TypingIndicatorEvent } from '@/types/chat';

vi.mock('@/lib/api/chat-api');

// Mock realtime listeners and instances
const mockMessageListeners = new Set<(msg: MessageResponse) => void>();
const mockReadReceiptListeners = new Set<(event: ReadReceiptEvent) => void>();
const mockTypingListeners = new Set<(event: TypingIndicatorEvent) => void>();

export const mockStompClient = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendMessage: vi.fn(),
  sendReadReceipt: vi.fn(),
  sendTyping: vi.fn(),
  onMessage: vi.fn((cb: (msg: MessageResponse) => void) => {
    mockMessageListeners.add(cb);
    return () => mockMessageListeners.delete(cb);
  }),
  onReadReceipt: vi.fn((cb: (event: ReadReceiptEvent) => void) => {
    mockReadReceiptListeners.add(cb);
    return () => mockReadReceiptListeners.delete(cb);
  }),
  onTyping: vi.fn((cb: (event: TypingIndicatorEvent) => void) => {
    mockTypingListeners.add(cb);
    return () => mockTypingListeners.delete(cb);
  }),
  isConnected: false,
};

vi.mock('@/lib/realtime/stomp-client', () => ({
  ChatRealtimeClient: vi.fn().mockImplementation(() => mockStompClient),
  getChatRealtimeClient: vi.fn(() => mockStompClient),
  chatRealtimeClient: {
    get instance() {
      return mockStompClient;
    },
  },
}));

vi.mock('@/lib/realtime', () => ({
  ChatRealtimeClient: vi.fn().mockImplementation(() => mockStompClient),
  getChatRealtimeClient: vi.fn(() => mockStompClient),
  chatRealtimeClient: {
    get instance() {
      return mockStompClient;
    },
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useChat', () => {
  const mockFriendId = 'f-123';
  const mockConversationId = '6639f727c9a6327d53bfa123'; // 24 hex characters
  const mockConversation = {
    id: 'conv-999',
    participantIds: ['u-me', mockFriendId],
    partner: { id: mockFriendId, displayName: 'Alice', username: 'alice' },
    unreadCount: 1,
    updatedAt: '2026-11-07T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMessageListeners.clear();
    mockReadReceiptListeners.clear();
    mockTypingListeners.clear();
    mockStompClient.isConnected = false;

    // Set current user
    useAuthStore.setState({
      user: { id: 'u-me', username: 'tester', displayName: 'Tester' } as any,
      accessToken: 'valid.mock.token',
      isAuthenticated: true,
    });

    vi.mocked(chatApi.getOrCreateConversation).mockResolvedValue(mockConversation as any);
    vi.mocked(chatApi.getMyConversations).mockResolvedValue([
      {
        ...mockConversation,
        id: mockConversationId,
      } as any,
    ]);
    vi.mocked(chatApi.getConversationMessages).mockResolvedValue({
      messages: [
        {
          id: 'm1',
          content: 'Hi there',
          sentAt: '2026-11-07T12:00:00Z',
          type: 'TEXT',
          senderId: 'u-other',
          conversationId: 'conv-999',
        },
      ],
      nextCursor: null,
      hasMore: false,
    });
    vi.mocked(chatApi.markConversationAsRead).mockResolvedValue({
      conversationId: 'conv-999',
      readAt: '2026-11-07T12:01:00Z',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves conversation via friendId and marks as read', async () => {
    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    expect(chatApi.getOrCreateConversation).toHaveBeenCalledWith(mockFriendId, expect.anything());
    expect(result.current.conversation?.id).toBe('conv-999');
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hi there');
    expect(chatApi.markConversationAsRead).toHaveBeenCalledWith('conv-999');
    expect(mockStompClient.sendReadReceipt).toHaveBeenCalledWith('conv-999');
  });

  it('resolves conversation via 24-character MongoDB conversationId from getMyConversations', async () => {
    vi.mocked(chatApi.getConversationMessages).mockResolvedValueOnce({
      messages: [
        {
          id: 'm-conv-1',
          content: 'Existing conversation msg',
          sentAt: '2026-11-07T11:00:00Z',
          type: 'TEXT',
          senderId: 'u-other',
          conversationId: mockConversationId,
        },
      ],
      nextCursor: null,
      hasMore: false,
    });
    vi.mocked(chatApi.markConversationAsRead).mockResolvedValueOnce({
      conversationId: mockConversationId,
      readAt: '2026-11-07T11:01:00Z',
    });

    const { result } = renderHook(() => useChat({ targetId: mockConversationId }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    expect(chatApi.getMyConversations).toHaveBeenCalled();
    expect(chatApi.getOrCreateConversation).not.toHaveBeenCalled();
    expect(result.current.conversation?.id).toBe(mockConversationId);
    expect(result.current.messages[0].content).toBe('Existing conversation msg');
  });

  it('sends message via REST fallback when triggered and STOMP not connected', async () => {
    mockStompClient.isConnected = false;
    const sentMsg = {
      id: 'm2',
      content: 'New message',
      sentAt: '2026-11-07T12:02:00Z',
      type: 'TEXT',
      senderId: 'u-me',
      conversationId: 'conv-999',
    };
    vi.mocked(chatApi.sendChatMessage).mockResolvedValueOnce(sentMsg as any);

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    await act(async () => {
      await result.current.sendMessage('New message');
    });

    expect(chatApi.sendChatMessage).toHaveBeenCalledWith(
      'conv-999',
      expect.objectContaining({ content: 'New message' })
    );
    expect(result.current.messages).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'm2', content: 'New message' })])
    );
  });

  it('sends message via STOMP when client is connected', async () => {
    mockStompClient.isConnected = true;

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    await act(async () => {
      await result.current.sendMessage('Live realtime message');
    });

    expect(mockStompClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-999',
        content: 'Live realtime message',
        type: 'TEXT',
      })
    );
    expect(chatApi.sendChatMessage).not.toHaveBeenCalled();
  });

  it('blocks sending empty message or whitespace only', async () => {
    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    await act(async () => {
      await result.current.sendMessage('   ');
      await result.current.sendMessage('');
    });

    expect(chatApi.sendChatMessage).not.toHaveBeenCalled();
    expect(mockStompClient.sendMessage).not.toHaveBeenCalled();
  });

  it('loads older messages with cursor pagination and prepends them chronologically', async () => {
    const initialMsg = {
      id: 'm2',
      content: 'Second message',
      sentAt: '2026-11-07T12:10:00Z',
      type: 'TEXT',
      senderId: 'u-other',
      conversationId: 'conv-999',
    };
    vi.mocked(chatApi.getConversationMessages).mockResolvedValueOnce({
      messages: [initialMsg as any],
      nextCursor: '2026-11-07T12:10:00Z',
      hasMore: true,
    });

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    expect(result.current.hasMore).toBe(true);

    const olderMsg = {
      id: 'm1',
      content: 'First older message',
      sentAt: '2026-11-07T12:00:00Z',
      type: 'TEXT',
      senderId: 'u-other',
      conversationId: 'conv-999',
    };
    vi.mocked(chatApi.getConversationMessages).mockResolvedValueOnce({
      messages: [olderMsg as any],
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await result.current.loadMoreMessages();
    });

    expect(chatApi.getConversationMessages).toHaveBeenCalledWith(
      'conv-999',
      '2026-11-07T12:10:00Z',
      30
    );
    expect(result.current.hasMore).toBe(false);
    expect(result.current.messages).toHaveLength(2);
    // Messages must be chronologically ordered (oldest m1 at index 0, newer m2 at index 1)
    expect(result.current.messages[0].id).toBe('m1');
    expect(result.current.messages[1].id).toBe('m2');
  });

  it('does not load more messages if hasMore is false or already loading', async () => {
    vi.mocked(chatApi.getConversationMessages).mockResolvedValueOnce({
      messages: [{ id: 'm1', content: 'Only message', sentAt: '2026-11-07T12:00:00Z', type: 'TEXT', senderId: 'u-other', conversationId: 'conv-999' }],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    expect(result.current.hasMore).toBe(false);
    expect(chatApi.getConversationMessages).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.loadMoreMessages();
    });

    // Should not call getConversationMessages again
    expect(chatApi.getConversationMessages).toHaveBeenCalledTimes(1);
  });

  it('deduplicates messages by unique id', async () => {
    const msg = {
      id: 'm1',
      content: 'Hello',
      sentAt: '2026-11-07T12:00:00Z',
      type: 'TEXT',
      senderId: 'u-other',
      conversationId: 'conv-999',
    };
    vi.mocked(chatApi.getConversationMessages).mockResolvedValueOnce({
      messages: [msg as any],
      nextCursor: 'cursor-1',
      hasMore: true,
    });

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    // Try loading more, returning same message id
    vi.mocked(chatApi.getConversationMessages).mockResolvedValueOnce({
      messages: [msg as any],
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await result.current.loadMoreMessages();
    });

    expect(result.current.messages).toHaveLength(1);
  });

  it('handles incoming realtime message via onMessage and marks as read if partner sent it', async () => {
    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    // Reset markConversationAsRead call from mount
    vi.mocked(chatApi.markConversationAsRead).mockClear();
    mockStompClient.sendReadReceipt.mockClear();

    const incomingPartnerMsg = {
      id: 'm-live-partner',
      conversationId: 'conv-999',
      senderId: 'u-other',
      type: 'TEXT' as const,
      content: 'Partner realtime message',
      sentAt: '2026-11-07T12:05:00Z',
    };

    act(() => {
      mockMessageListeners.forEach((listener) => listener(incomingPartnerMsg));
    });

    expect(result.current.messages).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'm-live-partner' })])
    );
    expect(chatApi.markConversationAsRead).toHaveBeenCalledWith('conv-999');
    expect(mockStompClient.sendReadReceipt).toHaveBeenCalledWith('conv-999');
  });

  it('ignores realtime messages belonging to another conversation', async () => {
    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    const otherConvMsg = {
      id: 'm-other-conv',
      conversationId: 'other-conv-id',
      senderId: 'u-other',
      type: 'TEXT' as const,
      content: 'Wrong conv',
      sentAt: '2026-11-07T12:05:00Z',
    };

    act(() => {
      mockMessageListeners.forEach((listener) => listener(otherConvMsg));
    });

    expect(result.current.messages.find((m) => m.id === 'm-other-conv')).toBeUndefined();
  });

  it('updates isPartnerTyping on realtime typing event and auto-clears after 2500ms timeout', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });

    // Advance to let queries resolve
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isPartnerTyping).toBe(false);

    // Partner starts typing
    act(() => {
      mockTypingListeners.forEach((listener) =>
        listener({ conversationId: 'conv-999', userId: 'u-other', isTyping: true })
      );
    });

    expect(result.current.isPartnerTyping).toBe(true);

    // Advance 2500ms
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.isPartnerTyping).toBe(false);
  });

  it('ignores typing events from the current user', async () => {
    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    act(() => {
      mockTypingListeners.forEach((listener) =>
        listener({ conversationId: 'conv-999', userId: 'u-me', isTyping: true })
      );
    });

    expect(result.current.isPartnerTyping).toBe(false);
  });

  it('updates readAt on partner read receipt event', async () => {
    const unreadMsg = {
      id: 'm-unread',
      content: 'Sent before read',
      sentAt: '2026-11-07T12:00:00Z',
      type: 'TEXT',
      senderId: 'u-me',
      conversationId: 'conv-999',
      readAt: null,
    };
    vi.mocked(chatApi.getConversationMessages).mockResolvedValueOnce({
      messages: [unreadMsg as any],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    expect(result.current.messages[0].readAt).toBeNull();

    act(() => {
      mockReadReceiptListeners.forEach((listener) =>
        listener({
          conversationId: 'conv-999',
          readerId: 'u-other',
          readAt: '2026-11-07T12:05:00Z',
        })
      );
    });

    expect(result.current.messages[0].readAt).toBe('2026-11-07T12:05:00Z');
  });

  it('manages replyingToMessage state and clears it upon sending', async () => {
    mockStompClient.isConnected = false;
    const sentMsg = {
      id: 'm-reply',
      content: 'Replied text',
      sentAt: '2026-11-07T12:03:00Z',
      type: 'TEXT',
      senderId: 'u-me',
      conversationId: 'conv-999',
      replyToMessageId: 'm1',
    };
    vi.mocked(chatApi.sendChatMessage).mockResolvedValueOnce(sentMsg as any);

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    const targetMessage = result.current.messages[0];
    act(() => {
      result.current.setReplyingToMessage(targetMessage);
    });

    expect(result.current.replyingToMessage).toEqual(targetMessage);

    await act(async () => {
      await result.current.sendMessage('Replied text');
    });

    expect(chatApi.sendChatMessage).toHaveBeenCalledWith(
      'conv-999',
      expect.objectContaining({
        content: 'Replied text',
        replyToMessageId: 'm1',
      })
    );
    expect(result.current.replyingToMessage).toBeNull();
  });

  it('handles deleteMessage for FOR_ME and FOR_EVERYONE', async () => {
    vi.mocked(chatApi.deleteChatMessage).mockResolvedValue(undefined);

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    expect(result.current.messages).toHaveLength(1);

    // 1. FOR_EVERYONE marks revoked
    await act(async () => {
      await result.current.deleteMessage('m1', 'FOR_EVERYONE');
    });

    expect(chatApi.deleteChatMessage).toHaveBeenCalledWith('conv-999', 'm1', 'FOR_EVERYONE');
    expect(result.current.messages[0].isRevoked).toBe(true);

    // 2. FOR_ME removes from array
    await act(async () => {
      await result.current.deleteMessage('m1', 'FOR_ME');
    });

    expect(chatApi.deleteChatMessage).toHaveBeenCalledWith('conv-999', 'm1', 'FOR_ME');
    expect(result.current.messages).toHaveLength(0);
  });

  it('throttles sendTyping to avoid duplicate emissions', async () => {
    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    act(() => {
      result.current.sendTyping(true);
      result.current.sendTyping(true);
      result.current.sendTyping(true);
    });

    // Throttled to 1 call initially
    expect(mockStompClient.sendTyping).toHaveBeenCalledTimes(1);
    expect(mockStompClient.sendTyping).toHaveBeenCalledWith({
      conversationId: 'conv-999',
      isTyping: true,
    });

    act(() => {
      result.current.sendTyping(false);
    });

    expect(mockStompClient.sendTyping).toHaveBeenCalledWith({
      conversationId: 'conv-999',
      isTyping: false,
    });
  });

  it('terminates loadMoreMessages when nextCursor is null even if hasMore is true', async () => {
    vi.mocked(chatApi.getConversationMessages).mockResolvedValueOnce({
      messages: [
        {
          id: 'm1',
          content: 'Boundary msg',
          sentAt: '2026-11-07T12:00:00Z',
          type: 'TEXT',
          senderId: 'u-other',
          conversationId: 'conv-999',
        },
      ],
      nextCursor: null,
      hasMore: true,
    });

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    expect(chatApi.getConversationMessages).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.loadMoreMessages();
    });

    // Should no-op because nextCursor === null
    expect(chatApi.getConversationMessages).toHaveBeenCalledTimes(1);
  });

  it('resets messages, pagination, and typing state when targetId changes', async () => {
    const friendA = 'f-123';
    const friendB = 'f-456';
    const convA = { id: 'conv-111', partner: { id: friendA, displayName: 'Alice' } };
    const convB = { id: 'conv-222', partner: { id: friendB, displayName: 'Bob' } };

    vi.mocked(chatApi.getOrCreateConversation).mockImplementation(async (id) => {
      if (id === friendA) return convA as any;
      if (id === friendB) return convB as any;
      throw new Error('Unknown friend');
    });

    vi.mocked(chatApi.getConversationMessages).mockImplementation(async (convId) => {
      if (convId === 'conv-111') {
        return {
          messages: [
            {
              id: 'm-a',
              content: 'Alice msg',
              sentAt: '2026-11-07T10:00:00Z',
              type: 'TEXT',
              senderId: friendA,
              conversationId: 'conv-111',
            },
          ],
          nextCursor: 'cursor-a',
          hasMore: true,
        };
      }
      return {
        messages: [
          {
            id: 'm-b',
            content: 'Bob msg',
            sentAt: '2026-11-07T11:00:00Z',
            type: 'TEXT',
            senderId: friendB,
            conversationId: 'conv-222',
          },
        ],
        nextCursor: null,
        hasMore: false,
      };
    });

    const { result, rerender } = renderHook(
      ({ targetId }) => useChat({ targetId }),
      {
        wrapper: createWrapper(),
        initialProps: { targetId: friendA },
      }
    );

    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));
    expect(result.current.conversation?.id).toBe('conv-111');
    expect(result.current.messages[0].id).toBe('m-a');
    expect(result.current.hasMore).toBe(true);

    // Set replyingToMessage in room A
    act(() => {
      result.current.setReplyingToMessage(result.current.messages[0]);
    });
    expect(result.current.replyingToMessage?.id).toBe('m-a');

    // Partner A typing
    act(() => {
      mockTypingListeners.forEach((listener) =>
        listener({ conversationId: 'conv-111', userId: friendA, isTyping: true })
      );
    });
    expect(result.current.isPartnerTyping).toBe(true);

    // Navigate to Room B
    rerender({ targetId: friendB });

    // State should reset immediately
    expect(result.current.replyingToMessage).toBeNull();
    expect(result.current.isPartnerTyping).toBe(false);

    await waitFor(() => expect(result.current.conversation?.id).toBe('conv-222'));
    await waitFor(() => expect(result.current.messages[0]?.id).toBe('m-b'));
    expect(result.current.messages.find((m) => m.id === 'm-a')).toBeUndefined();
    expect(result.current.hasMore).toBe(false);
  });
});
