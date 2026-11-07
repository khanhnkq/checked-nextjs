/**
 * Chat & 1-on-1 Realtime REST API Client
 * Kết nối các endpoint /api/v1/conversations/*
 */

import { customFetcher } from './custom-fetcher';
import type {
  ConversationResponse,
  MessageCursorPage,
  MessageResponse,
  SendMessagePayload,
  MarkReadResponse,
  UnreadCountResponse,
  DeleteMessageMode,
} from '@/types/chat';

export const chatKeys = {
  all: ['/api/v1/conversations'] as const,
  conversations: () => [...chatKeys.all] as const,
  conversation: (id: string) => [...chatKeys.all, id] as const,
  messages: (id: string) => [...chatKeys.all, id, 'messages'] as const,
  unreadTotal: () => [...chatKeys.all, 'unread-total'] as const,
};

/**
 * Lấy danh sách các cuộc trò chuyện của người dùng hiện tại
 */
export const getMyConversations = (
  signal?: AbortSignal
): Promise<ConversationResponse[]> => {
  return customFetcher<ConversationResponse[]>('/api/v1/conversations', {
    method: 'GET',
    signal,
  });
};

/**
 * Lấy hoặc tạo mới cuộc trò chuyện 1-1 với bạn bè theo friendId
 */
export const getOrCreateConversation = (
  friendId: string,
  signal?: AbortSignal
): Promise<ConversationResponse> => {
  return customFetcher<ConversationResponse>('/api/v1/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendId }),
    signal,
  });
};

/**
 * Lấy tin nhắn phân trang bằng con trỏ (reverse cursor pagination)
 */
export const getConversationMessages = (
  conversationId: string,
  before?: string,
  limit?: number,
  signal?: AbortSignal
): Promise<MessageCursorPage> => {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  if (limit !== undefined) params.set('limit', String(limit));
  const queryString = params.toString();
  const url = `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages${queryString ? `?${queryString}` : ''}`;

  return customFetcher<MessageCursorPage>(url, {
    method: 'GET',
    signal,
  });
};

/**
 * Gửi tin nhắn mới tới cuộc trò chuyện
 */
export const sendChatMessage = (
  conversationId: string,
  payload: SendMessagePayload,
  signal?: AbortSignal
): Promise<MessageResponse> => {
  return customFetcher<MessageResponse>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }
  );
};

/**
 * Đánh dấu toàn bộ tin nhắn trong cuộc trò chuyện là đã đọc
 */
export const markConversationAsRead = (
  conversationId: string,
  signal?: AbortSignal
): Promise<MarkReadResponse> => {
  return customFetcher<MarkReadResponse>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/read`,
    {
      method: 'PUT',
      signal,
    }
  );
};

/**
 * Lấy tổng số tin nhắn chưa đọc của tất cả cuộc trò chuyện
 */
export const getTotalUnreadCount = (
  signal?: AbortSignal
): Promise<UnreadCountResponse> => {
  return customFetcher<UnreadCountResponse>('/api/v1/conversations/unread-total', {
    method: 'GET',
    signal,
  });
};

/**
 * Xóa tin nhắn (thu hồi cho mọi người hoặc xóa chỉ riêng mình)
 */
export const deleteChatMessage = (
  conversationId: string,
  messageId: string,
  mode: DeleteMessageMode = 'FOR_ME',
  signal?: AbortSignal
): Promise<void> => {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  const url = `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}${query}`;

  return customFetcher<void>(url, {
    method: 'DELETE',
    signal,
  });
};
