'use client';

/**
 * useConversations Hook
 * Quản lý danh sách cuộc trò chuyện, đồng bộ danh sách bạn bè,
 * tính toán FriendChatItem và tổng số tin nhắn chưa đọc (unreadTotal).
 * Tích hợp TanStack Query và realtime WebSocket invalidation.
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  chatKeys,
  getMyConversations,
  getTotalUnreadCount,
} from '@/lib/api/chat-api';
import {
  friendshipKeys,
  getMyFriends,
} from '@/lib/api/friendship-api';
import { getChatRealtimeClient, type ChatRealtimeClient } from '@/lib/realtime';
import type {
  ConversationResponse,
  FriendChatItem,
  UnreadCountResponse,
} from '@/types/chat';
import type { FriendProfile } from '@/types/friendship';

export interface UseConversationsOptions {
  /** Cho phép thực thi truy vấn tự động (mặc định: true) */
  enabled?: boolean;
  /** Bật tự động invalidate query khi có tin nhắn hoặc read receipt realtime (mặc định: true) */
  realtime?: boolean;
  /** Tùy chọn truyền trước danh sách bạn bè thay vì gọi API getMyFriends */
  friends?: FriendProfile[];
  /** Tùy chọn inject ChatRealtimeClient tùy biến */
  realtimeClient?: ChatRealtimeClient;
}

export interface UseConversationsReturn {
  /** Danh sách kết hợp giữa bạn bè và cuộc trò chuyện (được sắp xếp theo hoạt động gần nhất) */
  items: FriendChatItem[];
  /** Danh sách cuộc trò chuyện gốc từ API */
  conversations: ConversationResponse[];
  /** Tổng số tin nhắn chưa đọc */
  unreadTotal: number;
  /** Trạng thái đang tải dữ liệu ban đầu */
  isLoading: boolean;
  /** Trạng thái có lỗi khi truy vấn */
  isError: boolean;
  /** Danh sách bạn bè */
  friends: FriendProfile[];
  /** Hàm refetch toàn bộ dữ liệu cuộc trò chuyện, bạn bè và unread count */
  refetch: () => Promise<void>;

  // TanStack Query Instances
  conversationsQuery: UseQueryResult<ConversationResponse[], Error>;
  unreadTotalQuery: UseQueryResult<UnreadCountResponse, Error>;
  friendsQuery: UseQueryResult<FriendProfile[], Error>;
}

// Helpers an toàn khi queryKeys bị mock bằng vi.mock mà không trả về mảng
function getConversationsKey(): readonly unknown[] {
  try {
    const k = chatKeys?.conversations?.();
    if (Array.isArray(k)) return k;
  } catch {
    // Ignore error
  }
  return ['/api/v1/conversations'];
}

function getUnreadTotalKey(): readonly unknown[] {
  try {
    const k = chatKeys?.unreadTotal?.();
    if (Array.isArray(k)) return k;
  } catch {
    // Ignore error
  }
  return ['/api/v1/conversations', 'unread-total'];
}

function getFriendsKey(): readonly unknown[] {
  try {
    const k = friendshipKeys?.friends?.();
    if (Array.isArray(k)) return k;
  } catch {
    // Ignore error
  }
  return ['/api/v1/friendships', 'friends'];
}

export function useConversations(
  options: UseConversationsOptions = {}
): UseConversationsReturn {
  const queryClient = useQueryClient();
  const isEnabled = options.enabled ?? true;
  const realtimeEnabled = options.realtime ?? true;

  // 1. Queries
  const friendsQuery = useQuery<FriendProfile[], Error>({
    queryKey: getFriendsKey(),
    queryFn: ({ signal }) => getMyFriends(signal),
    enabled: isEnabled && !options.friends,
  });

  const conversationsQuery = useQuery<ConversationResponse[], Error>({
    queryKey: getConversationsKey(),
    queryFn: ({ signal }) => getMyConversations(signal),
    enabled: isEnabled,
  });

  const unreadTotalQuery = useQuery<UnreadCountResponse, Error>({
    queryKey: getUnreadTotalKey(),
    queryFn: ({ signal }) => getTotalUnreadCount(signal),
    enabled: isEnabled,
  });

  // 2. Data Accessors
  const friends = useMemo(
    () => options.friends ?? friendsQuery.data ?? [],
    [options.friends, friendsQuery.data]
  );

  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data]
  );

  const unreadTotal = useMemo(() => {
    if (unreadTotalQuery.data?.unreadCount !== undefined) {
      return unreadTotalQuery.data.unreadCount;
    }
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [unreadTotalQuery.data?.unreadCount, conversations]);

  // 3. Merge & Sort Friends with Conversations
  const items = useMemo<FriendChatItem[]>(() => {
    const mapped: FriendChatItem[] = friends.map((friend) => {
      const conv =
        conversations.find(
          (c) =>
            c.partner?.id === friend.id ||
            (Array.isArray(c.participantIds) && c.participantIds.includes(friend.id))
        ) ?? null;

      const lastActivityDate =
        conv?.lastMessage?.sentAt || conv?.updatedAt || null;

      const unreadCount = conv?.unreadCount || 0;

      return {
        friend,
        conversation: conv,
        lastActivityDate,
        unreadCount,
      };
    });

    return mapped.sort((a, b) => {
      const hasDateA = Boolean(a.lastActivityDate);
      const hasDateB = Boolean(b.lastActivityDate);

      if (hasDateA && hasDateB) {
        const timeA = new Date(a.lastActivityDate!).getTime();
        const timeB = new Date(b.lastActivityDate!).getTime();
        const safeTimeA = Number.isNaN(timeA) ? 0 : timeA;
        const safeTimeB = Number.isNaN(timeB) ? 0 : timeB;

        if (safeTimeA !== safeTimeB) {
          // Cuộc trò chuyện có hoạt động mới hơn nằm trên
          return safeTimeB - safeTimeA;
        }

        const nameA = (a.friend.displayName || a.friend.username || '').trim();
        const nameB = (b.friend.displayName || b.friend.username || '').trim();
        return nameA.localeCompare(nameB);
      }

      // Có tin nhắn/hoạt động ưu tiên hiển thị trước
      if (hasDateA && !hasDateB) {
        return -1;
      }
      if (!hasDateA && hasDateB) {
        return 1;
      }

      // Bạn bè chưa có cuộc trò chuyện: sắp xếp theo bảng chữ cái displayName
      const nameA = (a.friend.displayName || a.friend.username || '').trim();
      const nameB = (b.friend.displayName || b.friend.username || '').trim();
      return nameA.localeCompare(nameB);
    });
  }, [friends, conversations]);

  // 4. Realtime Invalidation
  useEffect(() => {
    if (!realtimeEnabled) {
      return;
    }

    let client: ChatRealtimeClient;
    try {
      client = options.realtimeClient ?? getChatRealtimeClient();
    } catch {
      return;
    }

    if (!client) {
      return;
    }

    const convKey = getConversationsKey();
    const unreadKey = getUnreadTotalKey();

    const unsubMessage = client.onMessage(() => {
      queryClient.invalidateQueries({ queryKey: convKey });
      queryClient.invalidateQueries({ queryKey: unreadKey });
    });

    const unsubReadReceipt = client.onReadReceipt(() => {
      queryClient.invalidateQueries({ queryKey: convKey });
      queryClient.invalidateQueries({ queryKey: unreadKey });
    });

    return () => {
      unsubMessage();
      unsubReadReceipt();
    };
  }, [queryClient, realtimeEnabled, options.realtimeClient]);

  // 5. Refetch
  const refetch = useCallback(async () => {
    const promises: Promise<unknown>[] = [
      conversationsQuery.refetch(),
      unreadTotalQuery.refetch(),
    ];
    if (!options.friends) {
      promises.push(friendsQuery.refetch());
    }
    await Promise.all(promises);
  }, [conversationsQuery, unreadTotalQuery, friendsQuery, options.friends]);

  const isLoading =
    (options.friends ? false : friendsQuery.isLoading) ||
    conversationsQuery.isLoading ||
    unreadTotalQuery.isLoading;

  const isError =
    (options.friends ? false : friendsQuery.isError) ||
    conversationsQuery.isError ||
    unreadTotalQuery.isError;

  return {
    items,
    conversations,
    unreadTotal,
    isLoading,
    isError,
    friends,
    refetch,

    conversationsQuery,
    unreadTotalQuery,
    friendsQuery,
  };
}
