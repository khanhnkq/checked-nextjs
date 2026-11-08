'use client';

/**
 * useChat Hook
 * Quản lý trạng thái và dữ liệu phòng chat 1-on-1:
 * - Dynamic resolution: hỗ trợ targetId là friendId (UUID) hoặc conversationId (MongoDB 24 hex)
 * - Tự động tải tin nhắn ban đầu và phân trang lùi bằng con trỏ (reverse cursor pagination)
 * - Đồng bộ tin nhắn, trạng thái typing, read receipts theo thời gian thực qua STOMP WebSocket
 * - Dự phòng REST fallback khi mất kết nối WebSocket
 * - Tự động đánh dấu đã đọc khi vào phòng hoặc nhận tin nhắn mới từ bạn bè
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  chatKeys,
  getMyConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendChatMessage,
  markConversationAsRead,
  deleteChatMessage,
} from '@/lib/api/chat-api';
import { getChatRealtimeClient, ChatRealtimeClient } from '@/lib/realtime';
import { useAuthStore } from '@/stores/auth-store';
import type {
  ConversationResponse,
  MessageResponse,
  MessageCursorPage,
  MessageType,
  PhotoContext,
  DeleteMessageMode,
  TypingIndicatorEvent,
  ReadReceiptEvent,
} from '@/types/chat';

export interface SendMessageOptions {
  type?: MessageType;
  replyToMessageId?: string | null;
  photoContext?: PhotoContext | null;
}

export interface UseChatOptions {
  /** Target identifier: either a friend's UUID or a MongoDB 24-hex conversationId */
  targetId: string;
  /** Whether realtime STOMP synchronization is enabled (default: true) */
  realtime?: boolean;
  /** Custom realtime client (defaults to singleton getChatRealtimeClient()) */
  realtimeClient?: ChatRealtimeClient;
  /** Page size for cursor message pagination (default: 30) */
  pageSize?: number;
}

export interface UseChatReturn {
  /** The resolved conversation details */
  conversation: ConversationResponse | null;
  /** All loaded messages in chronological order (oldest first, newest last) */
  messages: MessageResponse[];
  /** Whether the conversation and initial page of messages are currently loading */
  isLoadingInitial: boolean;
  /** Whether older messages are currently being fetched */
  isLoadingMore: boolean;
  /** Whether older messages are available to load */
  hasMore: boolean;
  /** Function to fetch older messages */
  loadMoreMessages: () => Promise<void>;
  /** Send message (via STOMP if connected, or REST fallback) */
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<MessageResponse | void>;
  /** Delete or revoke message */
  deleteMessage: (messageId: string, mode?: DeleteMessageMode) => Promise<void>;
  /** Currently selected message to quote-reply to */
  replyingToMessage: MessageResponse | null;
  /** Setter for replying quote message */
  setReplyingToMessage: (msg: MessageResponse | null) => void;
  /** Whether the chat partner is currently typing */
  isPartnerTyping: boolean;
  /** Send typing indicator (throttled) */
  sendTyping: (isTyping: boolean) => void;
  /** Whether loading conversation or messages encountered an error */
  isError: boolean;
  /** Error object if any query failed */
  error: Error | null;
}

/**
 * Check if the provided ID is a 24-hex MongoDB ObjectId
 */
export function isConversationObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id.trim());
}

function resolveRealtimeClient(customClient?: ChatRealtimeClient): ChatRealtimeClient | null {
  if (customClient) return customClient;
  try {
    if (typeof getChatRealtimeClient === 'function') {
      const client = getChatRealtimeClient();
      if (client) return client;
    }
  } catch {
    // Ignore error
  }
  try {
    if (typeof ChatRealtimeClient === 'function') {
      return new ChatRealtimeClient();
    }
  } catch {
    // Ignore error
  }
  return null;
}

function getConversationQueryKey(targetId: string, isConvId: boolean): readonly unknown[] {
  try {
    if (isConvId) {
      const k = chatKeys?.conversation?.(targetId);
      if (Array.isArray(k)) return k;
    }
  } catch {
    // Ignore error
  }
  return isConvId
    ? ['/api/v1/conversations', targetId]
    : ['/api/v1/conversations', 'friend', targetId];
}

function getMessagesQueryKey(conversationId?: string): readonly unknown[] {
  if (!conversationId) return ['/api/v1/conversations', 'messages', 'disabled'];
  try {
    const k = chatKeys?.messages?.(conversationId);
    if (Array.isArray(k)) return k;
  } catch {
    // Ignore error
  }
  return ['/api/v1/conversations', conversationId, 'messages'];
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { targetId, realtime = true, pageSize = 30 } = options;
  const queryClient = useQueryClient();

  const client = useMemo(
    () => resolveRealtimeClient(options.realtimeClient),
    [options.realtimeClient]
  );

  // 1. Dynamic Resolution: Determine if targetId is a conversation ObjectId vs friend UUID
  const isConvId = useMemo(() => isConversationObjectId(targetId), [targetId]);

  const conversationQuery = useQuery<ConversationResponse | null, Error>({
    queryKey: getConversationQueryKey(targetId, isConvId),
    queryFn: async ({ signal }) => {
      if (!targetId) return null;
      if (isConvId) {
        const convs = await getMyConversations(signal);
        const found = convs.find((c) => c.id === targetId);
        if (!found) {
          throw new Error(`Conversation not found for ID: ${targetId}`);
        }
        return found;
      }
      return await getOrCreateConversation(targetId, signal);
    },
    enabled: Boolean(targetId),
  });

  const conversation = conversationQuery.data ?? null;
  const conversationId = conversation?.id;

  // 2. Initial Messages Query
  const initialMessagesQuery = useQuery<MessageCursorPage, Error>({
    queryKey: getMessagesQueryKey(conversationId),
    queryFn: ({ signal }) =>
      getConversationMessages(conversationId!, undefined, pageSize, signal),
    enabled: Boolean(conversationId),
  });

  // 3. Local state for messages and pagination
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const [replyingToMessage, setReplyingToMessage] = useState<MessageResponse | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const markedAsReadConvIdRef = useRef<string | null>(null);
  const lastLoadedInitialConvIdRef = useRef<string | null>(null);

  // Reset room state when switching between targetIds
  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    setNextCursor(null);
    setReplyingToMessage(null);
    setIsPartnerTyping(false);
    markedAsReadConvIdRef.current = null;
    lastLoadedInitialConvIdRef.current = null;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
  }, [targetId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  // Sync initial query messages to local state, preserving any older loaded messages
  useEffect(() => {
    if (initialMessagesQuery.data && conversationId) {
      const incoming = initialMessagesQuery.data.messages || [];
      const isFirstLoadForRoom = lastLoadedInitialConvIdRef.current !== conversationId;

      setMessages((prev) => {
        if (
          isFirstLoadForRoom ||
          prev.length === 0 ||
          prev.some((m) => m.conversationId !== conversationId)
        ) {
          return [...incoming].sort(
            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
          );
        }

        // Subsequent refetch: merge incoming initial messages with existing older messages
        const incomingIds = new Set(incoming.map((m) => m.id));
        const olderPreserved = prev.filter((m) => !incomingIds.has(m.id));
        const merged = [...olderPreserved, ...incoming];
        return merged.sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });

      if (isFirstLoadForRoom) {
        setHasMore(Boolean(initialMessagesQuery.data.hasMore));
        setNextCursor(initialMessagesQuery.data.nextCursor ?? null);
        lastLoadedInitialConvIdRef.current = conversationId;
      }
    }
  }, [initialMessagesQuery.data, conversationId]);

  // 4. Auto mark as read on mount and resolution
  useEffect(() => {
    if (!conversationId) return;

    if (markedAsReadConvIdRef.current !== conversationId) {
      markedAsReadConvIdRef.current = conversationId;
      markConversationAsRead(conversationId)
        .then(() => {
          queryClient.invalidateQueries({
            queryKey: ['/api/v1/conversations', 'unread-total'],
          });
          queryClient.invalidateQueries({
            queryKey: ['/api/v1/conversations'],
          });
        })
        .catch(() => {});

      try {
        client?.sendReadReceipt(conversationId);
      } catch {
        // Ignore socket delivery error
      }
    }
  }, [conversationId, client, queryClient]);

  // 5. Realtime WebSocket Listeners
  useEffect(() => {
    if (!realtime || !client || !conversationId) return;

    try {
      if (!client.isConnected) {
        client.connect();
      }
    } catch {
      // Ignore connect error in test environments
    }

    const unsubMessage = client.onMessage((msg: MessageResponse) => {
      if (msg.conversationId !== conversationId) return;

      setMessages((prev) => {
        // Deduplicate by message ID
        const existingIdx = prev.findIndex((m) => m.id === msg.id);
        if (existingIdx !== -1) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], ...msg };
          return next;
        }

        // Replace any optimistic message matching sender and content
        const tempIdx = prev.findIndex(
          (m) =>
            m.id.startsWith('temp-') &&
            m.senderId === msg.senderId &&
            m.content === msg.content
        );
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = msg;
          return next.sort(
            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
          );
        }

        const next = [...prev, msg];
        return next.sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });

      // Mark incoming partner message as read immediately
      const currentUserId = useAuthStore.getState().user?.id;
      if (msg.senderId !== currentUserId) {
        markConversationAsRead(conversationId).catch(() => {});
        try {
          client.sendReadReceipt(conversationId);
        } catch {
          // Ignore
        }
        setIsPartnerTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    });

    const unsubTyping = client.onTyping((event: TypingIndicatorEvent) => {
      if (event.conversationId !== conversationId) return;
      const myId = useAuthStore.getState().user?.id;
      if (myId && event.userId === myId) return;

      if (event.isTyping) {
        setIsPartnerTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
          typingTimeoutRef.current = null;
        }, 2500);
      } else {
        setIsPartnerTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    });

    const unsubReadReceipt = client.onReadReceipt((event: ReadReceiptEvent) => {
      if (event.conversationId !== conversationId) return;
      const readTimestamp = new Date(event.readAt).getTime();
      setMessages((prev) =>
        prev.map((m) => {
          if (!m.readAt && new Date(m.sentAt).getTime() <= readTimestamp) {
            return { ...m, readAt: event.readAt };
          }
          return m;
        })
      );
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubReadReceipt();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [conversationId, client, realtime]);

  // 6. Reverse cursor pagination: load older messages
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || isLoadingMore || !hasMore || nextCursor === null) {
      return;
    }

    const oldestMessage = messages[0];
    const beforeCursor = oldestMessage?.sentAt || nextCursor;
    if (!beforeCursor) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    try {
      const page = await getConversationMessages(
        conversationId,
        beforeCursor,
        pageSize
      );
      setHasMore(Boolean(page.hasMore));
      setNextCursor(page.nextCursor ?? null);

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const incoming = (page.messages || []).filter((m) => !existingIds.has(m.id));
        const combined = [...incoming, ...prev];
        return combined.sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });
    } catch (err) {
      console.error('[useChat] Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore, hasMore, messages, nextCursor, pageSize]);

  // 7. Send message via STOMP or REST fallback
  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      const trimmed = content?.trim();
      if (!trimmed || !conversationId) return;

      const replyId = options?.replyToMessageId ?? replyingToMessage?.id ?? null;
      const currentUserId = useAuthStore.getState().user?.id || 'me';
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (replyingToMessage) {
        setReplyingToMessage(null);
      }

      if (client && client.isConnected) {
        // Optimistic append
        const optimisticMsg: MessageResponse = {
          id: tempId,
          conversationId,
          senderId: currentUserId,
          content: trimmed,
          type: options?.type || 'TEXT',
          replyToMessageId: replyId,
          photoContext: options?.photoContext,
          sentAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        client.sendMessage({
          conversationId,
          content: trimmed,
          type: options?.type || 'TEXT',
          replyToMessageId: replyId,
          photoContext: options?.photoContext,
        });
        return;
      }

      // REST fallback
      const sent = await sendChatMessage(conversationId, {
        content: trimmed,
        type: options?.type || 'TEXT',
        replyToMessageId: replyId,
        photoContext: options?.photoContext,
      });

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempId && m.id !== sent.id);
        const next = [...filtered, sent];
        return next.sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });

      return sent;
    },
    [conversationId, client, replyingToMessage]
  );

  // 8. Delete message
  const deleteMessage = useCallback(
    async (messageId: string, mode: DeleteMessageMode = 'FOR_ME') => {
      if (!conversationId) return;
      await deleteChatMessage(conversationId, messageId, mode);

      setMessages((prev) => {
        if (mode === 'FOR_EVERYONE') {
          return prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  isRevoked: true,
                  content: 'Tin nhắn đã được thu hồi',
                }
              : m
          );
        }
        return prev.filter((m) => m.id !== messageId);
      });
    },
    [conversationId]
  );

  // 9. Send typing indicator
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId || !client) return;
      const now = Date.now();
      if (isTyping) {
        if (now - lastTypingSentRef.current > 1500) {
          lastTypingSentRef.current = now;
          try {
            client.sendTyping({ conversationId, isTyping: true });
          } catch {
            // Ignore
          }
        }
        if (typingDebounceRef.current) {
          clearTimeout(typingDebounceRef.current);
        }
        typingDebounceRef.current = setTimeout(() => {
          try {
            client.sendTyping({ conversationId, isTyping: false });
          } catch {
            // Ignore
          }
        }, 2000);
      } else {
        if (typingDebounceRef.current) {
          clearTimeout(typingDebounceRef.current);
          typingDebounceRef.current = null;
        }
        try {
          client.sendTyping({ conversationId, isTyping: false });
        } catch {
          // Ignore
        }
      }
    },
    [conversationId, client]
  );

  const isLoadingInitial =
    conversationQuery.isLoading ||
    (Boolean(conversationId) && initialMessagesQuery.isLoading && messages.length === 0);

  const isError = Boolean(conversationQuery.isError || initialMessagesQuery.isError);
  const error = conversationQuery.error || initialMessagesQuery.error || null;

  return {
    conversation,
    messages,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    replyingToMessage,
    setReplyingToMessage,
    isPartnerTyping,
    sendTyping,
    isError,
    error,
  };
}
