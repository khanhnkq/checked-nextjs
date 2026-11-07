/**
 * Types & Data Contracts cho phân hệ Bạn bè & Lời mời kết bạn (Friendship & Friend Invites)
 * Chuẩn parity 1:1 với backend (FriendshipController, FriendInviteLinkController, UserController)
 */

export interface FriendProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl?: string | null;
  isGoldMember?: boolean;
}

export interface FriendRequestItem {
  friendshipId: string;
  requester: FriendProfile;
  createdAt: string | Date;
  mutualFriendsCount?: number;
}

export interface SentFriendRequestItem {
  friendshipId: string;
  targetUser: FriendProfile;
  createdAt: string | Date;
}

export interface FriendInviteLinkInfo {
  id: string;
  inviteUrl: string;
  tokenPreview?: string;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
  revokedAt?: string | null;
  status?: string;
}

export interface FriendInvitePreview {
  inviter: FriendProfile;
  status: string;
  expiresAt?: string;
}

export type RelationshipStatus =
  | 'UNAUTHENTICATED'
  | 'SELF'
  | 'NONE'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED'
  | 'ACCEPTED'
  | 'BLOCKED';

export interface UserProfileWithRelation {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  avatarUrl?: string | null;
  isGoldMember?: boolean;
  relationshipStatus: RelationshipStatus;
  friendshipId?: string | null;
  mutualFriendsCount: number;
  mutualFriendsPreview?: FriendProfile[];
}

export interface CloseFriendsQuota {
  currentCount: number;
  maxLimit: number;
  isGoldMember: boolean;
  isNearLimit: boolean;
  isAtLimit: boolean;
  progress: number;
}

export interface SendFriendRequestResponse {
  friendshipId: string;
  status: string;
  relationshipStatus?: string;
  targetUser?: FriendProfile;
  createdAt?: string;
}

export interface AcceptFriendRequestResponse {
  friendshipId: string;
  status: string;
  friend?: FriendProfile;
  acceptedAt?: string;
}

export interface FriendRequestCountResult {
  pendingCount: number;
}

export interface SentFriendRequestCountResult {
  sentCount: number;
}

export interface AcceptInviteResponse {
  friendshipId: string;
  status: string;
  friend?: FriendProfile;
  acceptedAt?: string;
}
