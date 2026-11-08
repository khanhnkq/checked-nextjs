import type { FriendProfile } from './friendship';

export type MessageType = 'TEXT' | 'PHOTO_REACTION' | 'REVOKED' | 'SYSTEM';

export interface PhotoContext {
  photoId: string;
  photoUrl: string;
  caption?: string;
}

export interface ReplyToInfo {
  messageId: string;
  senderId?: string;
  senderName?: string;
  content: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  replyToMessageId?: string | null;
  replyTo?: ReplyToInfo | null;
  photoContext?: PhotoContext | null;
  sentAt: string;
  readAt?: string | null;
  isRead?: boolean;
  isRevoked?: boolean;
  deletedForUserIds?: string[];
}

export interface ConversationPartner {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
}

export interface FriendSummaryResponse {
  id: string;
  fullName?: string;
  username?: string;
  avatarUrl?: string | null;
}

export interface LastMessageInfo {
  id?: string;
  messageId?: string;
  senderId: string;
  content: string;
  type: MessageType;
  sentAt: string;
  isRevoked?: boolean;
}

export interface ConversationResponse {
  id: string;
  participantIds?: string[];
  partner?: ConversationPartner;
  friend?: FriendSummaryResponse;
  lastMessage?: (MessageResponse & LastMessageInfo) | null;
  unreadCount: number;
  createdAt?: string;
  updatedAt: string;
}

export interface FriendChatItem {
  friend: FriendProfile;
  conversation?: ConversationResponse | null;
  lastActivityDate?: string | null;
  unreadCount: number;
}

export interface MessageCursorPage {
  messages: MessageResponse[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface TypingIndicatorEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReadReceiptEvent {
  conversationId: string;
  readerId: string;
  readAt: string;
}

export interface SendMessagePayload {
  content: string;
  type?: MessageType;
  replyToMessageId?: string | null;
  photoContext?: PhotoContext | null;
}

export interface SendChatMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyToMessageId?: string | null;
  photoContext?: PhotoContext | null;
}

export interface TypingIndicatorPayload {
  conversationId: string;
  isTyping: boolean;
}

export interface MarkChatReadPayload {
  conversationId: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  timestamp?: string;
  path?: string;
  errors?: Record<string, string>;
}

export interface MarkReadResponse {
  conversationId: string;
  readAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export type DeleteMessageMode = 'FOR_ME' | 'FOR_EVERYONE';
