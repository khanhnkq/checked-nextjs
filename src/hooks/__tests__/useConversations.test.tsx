import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useConversations } from '../useConversations';
import * as chatApi from '@/lib/api/chat-api';
import * as friendshipApi from '@/lib/api/friendship-api';
import { getChatRealtimeClient } from '@/lib/realtime';

vi.mock('@/lib/api/chat-api');
vi.mock('@/lib/api/friendship-api');

const mockMessageListeners = new Set<(msg: any) => void>();
const mockReadReceiptListeners = new Set<(event: any) => void>();

vi.mock('@/lib/realtime', () => ({
  getChatRealtimeClient: vi.fn(() => ({
    onMessage: vi.fn((cb) => {
      mockMessageListeners.add(cb);
      return () => mockMessageListeners.delete(cb);
    }),
    onReadReceipt: vi.fn((cb) => {
      mockReadReceiptListeners.add(cb);
      return () => mockReadReceiptListeners.delete(cb);
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: true,
  })),
  chatRealtimeClient: {
    get instance() {
      return getChatRealtimeClient();
    },
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessageListeners.clear();
    mockReadReceiptListeners.clear();
  });

  it('merges friends with active conversations into FriendChatItem list sorted by last activity', async () => {
    const mockFriends = [
      { id: 'f1', username: 'alice', displayName: 'Alice' },
      { id: 'f2', username: 'bob', displayName: 'Bob' },
    ];
    const mockConversations = [
      {
        id: 'c1',
        participantIds: ['u-me', 'f1'],
        partner: { id: 'f1', username: 'alice', displayName: 'Alice' },
        lastMessage: { id: 'm1', content: 'Hey!', sentAt: '2026-11-07T12:00:00Z' },
        unreadCount: 2,
        updatedAt: '2026-11-07T12:00:00Z',
      },
    ];

    vi.mocked(friendshipApi.getMyFriends).mockResolvedValueOnce(mockFriends as any);
    vi.mocked(chatApi.getMyConversations).mockResolvedValueOnce(mockConversations as any);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValueOnce({ unreadCount: 2 });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    // f1 with conversation should be first due to recent message
    expect(result.current.items[0].friend.id).toBe('f1');
    expect(result.current.items[0].unreadCount).toBe(2);
    expect(result.current.items[0].conversation?.id).toBe('c1');
    expect(result.current.items[0].lastActivityDate).toBe('2026-11-07T12:00:00Z');

    // f2 without conversation should be second
    expect(result.current.items[1].friend.id).toBe('f2');
    expect(result.current.items[1].unreadCount).toBe(0);
    expect(result.current.items[1].conversation).toBeNull();
    expect(result.current.items[1].lastActivityDate).toBeNull();
    expect(result.current.unreadTotal).toBe(2);
  });

  it('sorts conversations with the most recent lastActivityDate at the top and friends without conversations alphabetically', async () => {
    const mockFriends = [
      { id: 'f1', username: 'charlie', displayName: 'Charlie' },
      { id: 'f2', username: 'alice', displayName: 'Alice' },
      { id: 'f3', username: 'bob', displayName: 'Bob' },
      { id: 'f4', username: 'david', displayName: 'David' },
    ];

    const mockConversations = [
      {
        id: 'c1',
        participantIds: ['u-me', 'f1'],
        partner: { id: 'f1', username: 'charlie', displayName: 'Charlie' },
        lastMessage: { id: 'm1', content: 'Earlier', sentAt: '2026-11-07T10:00:00Z' },
        unreadCount: 0,
        updatedAt: '2026-11-07T10:00:00Z',
      },
      {
        id: 'c4',
        participantIds: ['u-me', 'f4'],
        partner: { id: 'f4', username: 'david', displayName: 'David' },
        lastMessage: { id: 'm2', content: 'Latest', sentAt: '2026-11-07T14:00:00Z' },
        unreadCount: 1,
        updatedAt: '2026-11-07T14:00:00Z',
      },
    ];

    vi.mocked(friendshipApi.getMyFriends).mockResolvedValueOnce(mockFriends as any);
    vi.mocked(chatApi.getMyConversations).mockResolvedValueOnce(mockConversations as any);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValueOnce({ unreadCount: 1 });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(4);
    // 1st: David (conversation at 14:00)
    expect(result.current.items[0].friend.displayName).toBe('David');
    // 2nd: Charlie (conversation at 10:00)
    expect(result.current.items[1].friend.displayName).toBe('Charlie');
    // 3rd: Alice (no conversation, alphabetically before Bob)
    expect(result.current.items[2].friend.displayName).toBe('Alice');
    // 4th: Bob (no conversation, alphabetically after Alice)
    expect(result.current.items[3].friend.displayName).toBe('Bob');
  });

  it('falls back to updatedAt when lastMessage is missing', async () => {
    const mockFriends = [
      { id: 'f1', username: 'alice', displayName: 'Alice' },
    ];
    const mockConversations = [
      {
        id: 'c1',
        participantIds: ['u-me', 'f1'],
        partner: { id: 'f1', username: 'alice', displayName: 'Alice' },
        lastMessage: null,
        unreadCount: 0,
        updatedAt: '2026-11-07T15:30:00Z',
      },
    ];

    vi.mocked(friendshipApi.getMyFriends).mockResolvedValueOnce(mockFriends as any);
    vi.mocked(chatApi.getMyConversations).mockResolvedValueOnce(mockConversations as any);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValueOnce({ unreadCount: 0 });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items[0].lastActivityDate).toBe('2026-11-07T15:30:00Z');
  });

  it('matches conversation by participantIds when partner object id does not match directly', async () => {
    const mockFriends = [
      { id: 'f1', username: 'alice', displayName: 'Alice' },
    ];
    const mockConversations = [
      {
        id: 'c1',
        participantIds: ['u-me', 'f1'],
        partner: { id: 'other-id', username: 'alice', displayName: 'Alice' },
        lastMessage: { id: 'm1', content: 'Matched via participantIds', sentAt: '2026-11-07T12:00:00Z' },
        unreadCount: 1,
        updatedAt: '2026-11-07T12:00:00Z',
      },
    ];

    vi.mocked(friendshipApi.getMyFriends).mockResolvedValueOnce(mockFriends as any);
    vi.mocked(chatApi.getMyConversations).mockResolvedValueOnce(mockConversations as any);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValueOnce({ unreadCount: 1 });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items[0].conversation?.id).toBe('c1');
    expect(result.current.items[0].unreadCount).toBe(1);
  });

  it('uses provided options.friends without calling getMyFriends', async () => {
    const customFriends = [
      { id: 'f-custom', username: 'custom_user', displayName: 'Custom User' },
    ];
    vi.mocked(chatApi.getMyConversations).mockResolvedValueOnce([]);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValueOnce({ unreadCount: 0 });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useConversations({ friends: customFriends }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(friendshipApi.getMyFriends).not.toHaveBeenCalled();
    expect(result.current.friends).toEqual(customFriends);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].friend.id).toBe('f-custom');
  });

  it('invalidates conversations and unread total queries when realtime message or read receipt arrives', async () => {
    const mockFriends = [{ id: 'f1', username: 'alice', displayName: 'Alice' }];
    const mockConversations = [
      {
        id: 'c1',
        participantIds: ['u-me', 'f1'],
        partner: { id: 'f1', username: 'alice', displayName: 'Alice' },
        lastMessage: { id: 'm1', content: 'Hey', sentAt: '2026-11-07T10:00:00Z' },
        unreadCount: 0,
        updatedAt: '2026-11-07T10:00:00Z',
      },
    ];

    vi.mocked(friendshipApi.getMyFriends).mockResolvedValue(mockFriends as any);
    vi.mocked(chatApi.getMyConversations).mockResolvedValue(mockConversations as any);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValue({ unreadCount: 0 });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConversations(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Clear invalidate calls from initial setup
    invalidateSpy.mockClear();

    // Trigger realtime message
    expect(mockMessageListeners.size).toBeGreaterThan(0);
    act(() => {
      mockMessageListeners.forEach((listener) =>
        listener({
          id: 'm2',
          conversationId: 'c1',
          senderId: 'f1',
          type: 'TEXT',
          content: 'New message',
          sentAt: '2026-11-07T10:01:00Z',
        })
      );
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: expect.arrayContaining(['/api/v1/conversations']),
    });

    invalidateSpy.mockClear();

    // Trigger realtime read receipt
    expect(mockReadReceiptListeners.size).toBeGreaterThan(0);
    act(() => {
      mockReadReceiptListeners.forEach((listener) =>
        listener({
          conversationId: 'c1',
          readerId: 'f1',
          readAt: '2026-11-07T10:02:00Z',
        })
      );
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: expect.arrayContaining(['/api/v1/conversations']),
    });
  });

  it('does not register realtime listeners when options.realtime is false', async () => {
    vi.mocked(friendshipApi.getMyFriends).mockResolvedValue([]);
    vi.mocked(chatApi.getMyConversations).mockResolvedValue([]);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValue({ unreadCount: 0 });

    const { wrapper } = createWrapper();
    renderHook(() => useConversations({ realtime: false }), { wrapper });

    expect(mockMessageListeners.size).toBe(0);
    expect(mockReadReceiptListeners.size).toBe(0);
  });

  it('triggers refetch for all queries when refetch is called', async () => {
    const mockFriends = [{ id: 'f1', username: 'alice', displayName: 'Alice' }];
    const mockConversations = [
      {
        id: 'c1',
        participantIds: ['u-me', 'f1'],
        partner: { id: 'f1', username: 'alice', displayName: 'Alice' },
        lastMessage: null,
        unreadCount: 0,
        updatedAt: '2026-11-07T10:00:00Z',
      },
    ];

    vi.mocked(friendshipApi.getMyFriends).mockResolvedValue(mockFriends as any);
    vi.mocked(chatApi.getMyConversations).mockResolvedValue(mockConversations as any);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValue({ unreadCount: 0 });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.mocked(friendshipApi.getMyFriends).mockClear();
    vi.mocked(chatApi.getMyConversations).mockClear();
    vi.mocked(chatApi.getTotalUnreadCount).mockClear();

    await act(async () => {
      await result.current.refetch();
    });

    expect(friendshipApi.getMyFriends).toHaveBeenCalledTimes(1);
    expect(chatApi.getMyConversations).toHaveBeenCalledTimes(1);
    expect(chatApi.getTotalUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('sets isError to true when an API query fails', async () => {
    vi.mocked(friendshipApi.getMyFriends).mockRejectedValueOnce(new Error('Network error'));
    vi.mocked(chatApi.getMyConversations).mockResolvedValueOnce([]);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValueOnce({ unreadCount: 0 });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
  });
});
