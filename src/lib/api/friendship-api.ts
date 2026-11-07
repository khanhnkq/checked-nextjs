/**
 * Friendship & Friend Invites API Client
 * Kết nối các endpoint /api/v1/friendships, /api/v1/friend-invite-links, và /api/v1/users/profile/{username}
 */

import { customFetcher } from './custom-fetcher';
import type {
  FriendProfile,
  FriendRequestItem,
  SentFriendRequestItem,
  FriendInviteLinkInfo,
  FriendInvitePreview,
  UserProfileWithRelation,
  SendFriendRequestResponse,
  AcceptFriendRequestResponse,
  FriendRequestCountResult,
  SentFriendRequestCountResult,
  AcceptInviteResponse,
} from '@/types/friendship';

export const friendshipKeys = {
  all: ['/api/v1/friendships'] as const,
  friends: () => [...friendshipKeys.all, 'friends'] as const,
  received: () => [...friendshipKeys.all, 'requests', 'received'] as const,
  receivedCount: () => [...friendshipKeys.all, 'requests', 'count'] as const,
  sent: () => [...friendshipKeys.all, 'requests', 'sent'] as const,
  sentCount: () => [...friendshipKeys.all, 'requests', 'sent', 'count'] as const,
  mutual: (userId: string) => [...friendshipKeys.all, userId, 'mutual'] as const,
  inviteCurrent: ['/api/v1/friend-invite-links', 'current'] as const,
  invitePreview: (token: string) => ['/api/v1/friend-invite-links', 'preview', token] as const,
  userProfile: (username: string) => ['/api/v1/users', 'profile', username] as const,
};

/**
 * Lấy danh sách tất cả bạn bè của tài khoản hiện tại
 */
export const getMyFriends = (signal?: AbortSignal): Promise<FriendProfile[]> => {
  return customFetcher<FriendProfile[]>({
    url: '/api/v1/friendships',
    method: 'GET',
    signal,
  });
};

/**
 * Gửi lời mời kết bạn tới người dùng khác
 */
export const sendFriendRequest = (
  targetUserId: string,
  signal?: AbortSignal
): Promise<SendFriendRequestResponse> => {
  return customFetcher<SendFriendRequestResponse>({
    url: '/api/v1/friendships/requests',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { targetUserId },
    signal,
  });
};

/**
 * Lấy danh sách lời mời kết bạn đã nhận đang chờ duyệt
 */
export const getPendingReceivedRequests = (
  signal?: AbortSignal
): Promise<FriendRequestItem[]> => {
  return customFetcher<FriendRequestItem[]>({
    url: '/api/v1/friendships/requests/received',
    method: 'GET',
    signal,
  });
};

/**
 * Đếm số lượng lời mời kết bạn chưa duyệt
 */
export const getPendingReceivedCount = (
  signal?: AbortSignal
): Promise<FriendRequestCountResult> => {
  return customFetcher<FriendRequestCountResult>({
    url: '/api/v1/friendships/requests/count',
    method: 'GET',
    signal,
  });
};

/**
 * Lấy danh sách lời mời kết bạn đã gửi đang chờ đối phương phản hồi
 */
export const getPendingSentRequests = (
  signal?: AbortSignal
): Promise<SentFriendRequestItem[]> => {
  return customFetcher<SentFriendRequestItem[]>({
    url: '/api/v1/friendships/requests/sent',
    method: 'GET',
    signal,
  });
};

/**
 * Đếm số lượng lời mời kết bạn đã gửi đang chờ duyệt
 */
export const getPendingSentCount = (
  signal?: AbortSignal
): Promise<SentFriendRequestCountResult> => {
  return customFetcher<SentFriendRequestCountResult>({
    url: '/api/v1/friendships/requests/sent/count',
    method: 'GET',
    signal,
  });
};

/**
 * Chấp nhận lời mời kết bạn theo friendshipId
 */
export const acceptFriendRequest = (
  friendshipId: string,
  signal?: AbortSignal
): Promise<AcceptFriendRequestResponse> => {
  return customFetcher<AcceptFriendRequestResponse>({
    url: `/api/v1/friendships/requests/${friendshipId}/accept`,
    method: 'PUT',
    signal,
  });
};

/**
 * Từ chối lời mời kết bạn theo friendshipId
 */
export const declineFriendRequest = (
  friendshipId: string,
  signal?: AbortSignal
): Promise<void> => {
  return customFetcher<void>({
    url: `/api/v1/friendships/requests/${friendshipId}/decline`,
    method: 'PUT',
    signal,
  });
};

/**
 * Hủy lời mời kết bạn đã gửi theo friendshipId
 */
export const cancelFriendRequest = (
  friendshipId: string,
  signal?: AbortSignal
): Promise<void> => {
  return customFetcher<void>({
    url: `/api/v1/friendships/requests/${friendshipId}/cancel`,
    method: 'DELETE',
    signal,
  });
};

/**
 * Hủy quan hệ bạn bè với một tài khoản theo friendId
 */
export const unfriend = (
  friendId: string,
  signal?: AbortSignal
): Promise<void> => {
  return customFetcher<void>({
    url: `/api/v1/friendships/${friendId}`,
    method: 'DELETE',
    signal,
  });
};

/**
 * Chặn người dùng theo userId
 */
export const blockUser = (
  userId: string,
  signal?: AbortSignal
): Promise<void> => {
  return customFetcher<void>({
    url: `/api/v1/friendships/${userId}/block`,
    method: 'POST',
    signal,
  });
};

/**
 * Bỏ chặn người dùng theo userId
 */
export const unblockUser = (
  userId: string,
  signal?: AbortSignal
): Promise<void> => {
  return customFetcher<void>({
    url: `/api/v1/friendships/${userId}/block`,
    method: 'DELETE',
    signal,
  });
};

/**
 * Lấy danh sách người dùng bị chặn
 */
export const getBlockedUsers = (
  signal?: AbortSignal
): Promise<FriendProfile[]> => {
  return customFetcher<FriendProfile[]>({
    url: '/api/v1/friendships/blocked',
    method: 'GET',
    signal,
  });
};

/**
 * Chấp nhận đồng loạt tất cả các lời mời kết bạn đang chờ
 */
export const acceptAllRequests = (signal?: AbortSignal): Promise<void> => {
  return customFetcher<void>({
    url: '/api/v1/friendships/requests/accept-all',
    method: 'PUT',
    signal,
  });
};

/**
 * Từ chối đồng loạt tất cả các lời mời kết bạn đang chờ
 */
export const declineAllRequests = (signal?: AbortSignal): Promise<void> => {
  return customFetcher<void>({
    url: '/api/v1/friendships/requests/decline-all',
    method: 'PUT',
    signal,
  });
};

/**
 * Lấy danh sách bạn bè chung giữa tài khoản hiện tại và targetUserId
 */
export const getMutualFriends = (
  targetUserId: string,
  signal?: AbortSignal
): Promise<FriendProfile[]> => {
  return customFetcher<FriendProfile[]>({
    url: `/api/v1/friendships/${targetUserId}/mutual`,
    method: 'GET',
    signal,
  });
};

/**
 * Lấy link mời kết bạn đang có hiệu lực của người dùng hiện tại
 */
export const getCurrentInviteLink = (
  signal?: AbortSignal
): Promise<FriendInviteLinkInfo> => {
  return customFetcher<FriendInviteLinkInfo>({
    url: '/api/v1/friend-invite-links/current',
    method: 'GET',
    signal,
  });
};

/**
 * Tạo hoặc làm mới link mời kết bạn
 * @param maxUses Số lượt dùng tối đa
 * @param validDays Số ngày hiệu lực (tự động quy đổi sang ttlMinutes)
 */
export const createOrRotateInviteLink = (
  maxUses?: number,
  validDays?: number,
  signal?: AbortSignal
): Promise<FriendInviteLinkInfo> => {
  const hasPayload = maxUses !== undefined || validDays !== undefined;
  const data = hasPayload
    ? {
        maxUses,
        ttlMinutes: validDays !== undefined ? validDays * 24 * 60 : undefined,
      }
    : undefined;

  return customFetcher<FriendInviteLinkInfo>({
    url: '/api/v1/friend-invite-links',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    signal,
  });
};

/**
 * Hủy vô hiệu hóa link mời kết bạn hiện tại
 */
export const revokeInviteLink = (signal?: AbortSignal): Promise<void> => {
  return customFetcher<void>({
    url: '/api/v1/friend-invite-links/current',
    method: 'DELETE',
    signal,
  });
};

/**
 * Xem trước thông tin link mời kết bạn từ token
 */
export const previewInviteToken = (
  token: string,
  signal?: AbortSignal
): Promise<FriendInvitePreview> => {
  return customFetcher<FriendInvitePreview>({
    url: '/api/v1/friend-invite-links/preview',
    method: 'GET',
    params: { token },
    signal,
  });
};

/**
 * Chấp nhận kết bạn bằng token trong link mời
 */
export const acceptInviteToken = (
  token: string,
  signal?: AbortSignal
): Promise<AcceptInviteResponse> => {
  return customFetcher<AcceptInviteResponse>({
    url: '/api/v1/friend-invite-links/accept',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { token },
    signal,
  });
};

/**
 * Xem hồ sơ người dùng kèm mối quan hệ qua username
 */
export const getUserProfileByUsername = (
  username: string,
  signal?: AbortSignal
): Promise<UserProfileWithRelation> => {
  return customFetcher<UserProfileWithRelation>({
    url: `/api/v1/users/profile/${username}`,
    method: 'GET',
    signal,
  });
};
