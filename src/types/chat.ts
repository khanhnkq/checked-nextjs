import type { FriendProfile } from './friendship';

export type MessageType = 'TEXT' | 'PHOTO_REACTION' | 'SYSTEM';

export interface PhotoContext {
  photoId: string;
  photoUrl: string;
  caption?: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  replyToMessageId?: string | null;
  photoContext?: PhotoContext | null;
  sentAt: string;
  readAt?: string | null;
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

export interface ConversationResponse {
  id: string;
  participantIds: string[];
  partner: ConversationPartner;
  lastMessage?: MessageResponse | null;
  unreadCount: number;
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

export interface MarkReadResponse {
  conversationId: string;
  readAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export type DeleteMessageMode = 'FOR_ME' | 'FOR_EVERYONE';
