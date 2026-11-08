/**
 * Chat & 1-on-1 Realtime REST API Client
 * Kết nối các endpoint /api/v1/conversations/*
 */

import { customFetcher } from './custom-fetcher';
import type {
  ConversationResponse,
  ConversationPartner,
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
 * Chuẩn hóa Conversation từ Backend (Spring Boot trả về friend thay vì partner)
 */
export function normalizeConversation(raw: any): ConversationResponse {
  if (!raw) return raw;

  const partnerId = raw.partner?.id || raw.friend?.id || '';
  const username = raw.partner?.username || raw.friend?.username || '';
  const displayName =
    raw.partner?.displayName || raw.friend?.fullName || username || 'Bạn bè';
  const avatarUrl = raw.partner?.avatarUrl ?? raw.friend?.avatarUrl ?? null;
  const isOnline = Boolean(raw.partner?.isOnline);

  const partner: ConversationPartner = raw.partner
    ? {
        ...raw.partner,
        id: String(raw.partner.id || partnerId),
        displayName: raw.partner.displayName || displayName,
      }
    : {
        id: String(partnerId),
        username,
        displayName,
        avatarUrl,
        isOnline,
      };

  const participantIds: string[] = raw.participantIds || (partnerId ? [String(partnerId)] : []);

  let lastMessage = raw.lastMessage;
  if (lastMessage && (lastMessage.messageId || lastMessage.type === 'REVOKED')) {
    lastMessage = {
      ...lastMessage,
      id: lastMessage.id || lastMessage.messageId || '',
      type: lastMessage.type,
      isRevoked: Boolean(lastMessage.isRevoked || lastMessage.type === 'REVOKED'),
    };
  }

  return {
    ...raw,
    partner,
    participantIds,
    ...(lastMessage !== undefined ? { lastMessage } : {}),
  };
}

/**
 * Chuẩn hóa Message từ Backend
 */
export function normalizeMessage(raw: any): MessageResponse {
  if (!raw) return raw;
  const id = raw.id || raw.messageId;
  const isRevoked = Boolean(raw.isRevoked || raw.type === 'REVOKED');
  return {
    ...raw,
    ...(id ? { id: String(id) } : {}),
    ...(isRevoked ? { isRevoked: true, content: 'Tin nhắn đã được thu hồi' } : {}),
    ...(raw.replyTo?.messageId && !raw.replyToMessageId
      ? { replyToMessageId: raw.replyTo.messageId }
      : {}),
  };
}

/**
 * Lấy danh sách các cuộc trò chuyện của người dùng hiện tại
 */
export const getMyConversations = async (
  signal?: AbortSignal
): Promise<ConversationResponse[]> => {
  const data = await customFetcher<any[]>('/api/v1/conversations', {
    method: 'GET',
    signal,
  });
  if (!Array.isArray(data)) return [];
  return data.map(normalizeConversation);
};

/**
 * Lấy hoặc tạo mới cuộc trò chuyện 1-1 với bạn bè theo friendId
 */
export const getOrCreateConversation = async (
  friendId: string,
  signal?: AbortSignal
): Promise<ConversationResponse> => {
  const data = await customFetcher<any>('/api/v1/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendId }),
    signal,
  });
  return normalizeConversation(data);
};

/**
 * Lấy tin nhắn phân trang bằng con trỏ (reverse cursor pagination)
 */
export const getConversationMessages = async (
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

  const data = await customFetcher<any>(url, {
    method: 'GET',
    signal,
  });

  const rawMessages = Array.isArray(data?.messages) ? data.messages : [];
  return {
    messages: rawMessages.map(normalizeMessage),
    nextCursor: data?.nextCursor ?? null,
    hasMore: Boolean(data?.hasMore),
  };
};

/**
 * Gửi tin nhắn mới tới cuộc trò chuyện
 */
export const sendChatMessage = async (
  conversationId: string,
  payload: SendMessagePayload,
  signal?: AbortSignal
): Promise<MessageResponse> => {
  const data = await customFetcher<any>(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }
  );
  return normalizeMessage(data);
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
