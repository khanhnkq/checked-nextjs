'use client';

/**
 * useFriendships Hook
 * Quản lý quan hệ bạn bè, danh sách bạn bè, lời mời nhận / gửi và tính toán hạn mức bạn thân (CloseFriendsQuota)
 * Tích hợp TanStack Query và phản hồi rung haptics đa nền tảng
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  friendshipKeys,
  getMyFriends,
  getPendingReceivedRequests,
  getPendingReceivedCount,
  getPendingSentRequests,
  getPendingSentCount,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend as apiUnfriend,
  blockUser as apiBlockUser,
  unblockUser as apiUnblockUser,
  acceptAllRequests,
  declineAllRequests,
} from '@/lib/api/friendship-api';
import { useAuthStore } from '@/stores/auth-store';
import { haptics } from '@/lib/utils/haptics';
import type {
  FriendProfile,
  FriendRequestItem,
  SentFriendRequestItem,
  FriendRequestCountResult,
  SentFriendRequestCountResult,
  SendFriendRequestResponse,
  AcceptFriendRequestResponse,
  CloseFriendsQuota,
} from '@/types/friendship';

export interface UseFriendshipsOptions {
  /** Cờ ghi đè trạng thái thành viên Gold Member */
  isGold?: boolean;
  /** Cho phép thực thi truy vấn tự động (mặc định: true) */
  enabled?: boolean;
}

export interface UseFriendshipsReturn {
  // TanStack Query Instances
  friendsQuery: UseQueryResult<FriendProfile[], Error>;
  receivedRequestsQuery: UseQueryResult<FriendRequestItem[], Error>;
  receivedCountQuery: UseQueryResult<FriendRequestCountResult, Error>;
  sentRequestsQuery: UseQueryResult<SentFriendRequestItem[], Error>;
  sentCountQuery: UseQueryResult<SentFriendRequestCountResult, Error>;

  // Clean data accessors
  friends: FriendProfile[];
  receivedRequests: FriendRequestItem[];
  receivedCount: number;
  sentRequests: SentFriendRequestItem[];
  sentCount: number;

  // Quota & membership
  quota: CloseFriendsQuota;
  isGold: boolean;

  // State flags
  isLoading: boolean;
  isError: boolean;
  refetchAll: () => Promise<void>;

  // Mutation actions
  sendRequest: (targetUserId: string) => Promise<SendFriendRequestResponse>;
  acceptRequest: (friendshipId: string) => Promise<AcceptFriendRequestResponse>;
  declineRequest: (friendshipId: string) => Promise<void>;
  cancelRequest: (friendshipId: string) => Promise<void>;
  unfriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  acceptAll: () => Promise<void>;
  declineAll: () => Promise<void>;

  // Mutation objects
  sendRequestMutation: UseMutationResult<SendFriendRequestResponse, Error, string>;
  acceptRequestMutation: UseMutationResult<AcceptFriendRequestResponse, Error, string>;
  declineRequestMutation: UseMutationResult<void, Error, string>;
  cancelRequestMutation: UseMutationResult<void, Error, string>;
  unfriendMutation: UseMutationResult<void, Error, string>;
  blockUserMutation: UseMutationResult<void, Error, string>;
  unblockUserMutation: UseMutationResult<void, Error, string>;
  acceptAllMutation: UseMutationResult<void, Error, void>;
  declineAllMutation: UseMutationResult<void, Error, void>;
}

export function useFriendships(options: UseFriendshipsOptions = {}): UseFriendshipsReturn {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);

  const isGold = options.isGold ?? authUser?.isGoldMember ?? false;
  const isEnabled = options.enabled ?? true;

  // 1. Queries
  const friendsQuery = useQuery<FriendProfile[], Error>({
    queryKey: friendshipKeys.friends(),
    queryFn: ({ signal }) => getMyFriends(signal),
    enabled: isEnabled,
  });

  const receivedRequestsQuery = useQuery<FriendRequestItem[], Error>({
    queryKey: friendshipKeys.received(),
    queryFn: ({ signal }) => getPendingReceivedRequests(signal),
    enabled: isEnabled,
  });

  const receivedCountQuery = useQuery<FriendRequestCountResult, Error>({
    queryKey: friendshipKeys.receivedCount(),
    queryFn: ({ signal }) => getPendingReceivedCount(signal),
    enabled: isEnabled,
  });

  const sentRequestsQuery = useQuery<SentFriendRequestItem[], Error>({
    queryKey: friendshipKeys.sent(),
    queryFn: ({ signal }) => getPendingSentRequests(signal),
    enabled: isEnabled,
  });

  const sentCountQuery = useQuery<SentFriendRequestCountResult, Error>({
    queryKey: friendshipKeys.sentCount(),
    queryFn: ({ signal }) => getPendingSentCount(signal),
    enabled: isEnabled,
  });

  // 2. Data helpers
  const friends = useMemo(() => friendsQuery.data ?? [], [friendsQuery.data]);
  const receivedRequests = useMemo(() => receivedRequestsQuery.data ?? [], [receivedRequestsQuery.data]);
  const receivedCount = receivedCountQuery.data?.pendingCount ?? receivedRequests.length;
  const sentRequests = useMemo(() => sentRequestsQuery.data ?? [], [sentRequestsQuery.data]);
  const sentCount = sentCountQuery.data?.sentCount ?? sentRequests.length;

  // 3. Quota calculation
  // - maxLimit = isGold ? 100 : 20
  // - currentCount = friends.length
  // - isNearLimit = !isGold && currentCount >= 15
  // - isAtLimit = currentCount >= maxLimit
  // - progress = Math.min(1, currentCount / maxLimit)
  const quota: CloseFriendsQuota = useMemo(() => {
    const currentCount = friends.length;
    const maxLimit = isGold ? 100 : 20;
    const isNearLimit = !isGold && currentCount >= 15;
    const isAtLimit = currentCount >= maxLimit;
    const progress = maxLimit > 0 ? Math.min(1, currentCount / maxLimit) : 0;

    return {
      currentCount,
      maxLimit,
      isGoldMember: isGold,
      isNearLimit,
      isAtLimit,
      progress,
    };
  }, [friends.length, isGold]);

  // 4. Mutations with Invalidation & Haptics
  const sendRequestMutation = useMutation<SendFriendRequestResponse, Error, string>({
    mutationFn: (targetUserId: string) => sendFriendRequest(targetUserId),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.sent() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.sentCount() });
    },
  });

  const acceptRequestMutation = useMutation<AcceptFriendRequestResponse, Error, string>({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friends() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.received() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.receivedCount() });
    },
  });

  const declineRequestMutation = useMutation<void, Error, string>({
    mutationFn: (friendshipId: string) => declineFriendRequest(friendshipId),
    onSuccess: () => {
      haptics.light();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.received() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.receivedCount() });
    },
  });

  const cancelRequestMutation = useMutation<void, Error, string>({
    mutationFn: (friendshipId: string) => cancelFriendRequest(friendshipId),
    onSuccess: () => {
      haptics.light();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.sent() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.sentCount() });
    },
  });

  const unfriendMutation = useMutation<void, Error, string>({
    mutationFn: (friendId: string) => apiUnfriend(friendId),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friends() });
    },
  });

  const blockUserMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => apiBlockUser(userId),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friends() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.received() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.sent() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.all });
    },
  });

  const unblockUserMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => apiUnblockUser(userId),
    onSuccess: () => {
      haptics.light();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.all });
    },
  });

  const acceptAllMutation = useMutation<void, Error, void>({
    mutationFn: () => acceptAllRequests(),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friends() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.received() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.receivedCount() });
    },
  });

  const declineAllMutation = useMutation<void, Error, void>({
    mutationFn: () => declineAllRequests(),
    onSuccess: () => {
      haptics.light();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.received() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.receivedCount() });
    },
  });

  // Action methods
  const sendRequest = useCallback(
    (targetUserId: string) => sendRequestMutation.mutateAsync(targetUserId),
    [sendRequestMutation]
  );

  const acceptRequest = useCallback(
    (friendshipId: string) => acceptRequestMutation.mutateAsync(friendshipId),
    [acceptRequestMutation]
  );

  const declineRequest = useCallback(
    (friendshipId: string) => declineRequestMutation.mutateAsync(friendshipId),
    [declineRequestMutation]
  );

  const cancelRequest = useCallback(
    (friendshipId: string) => cancelRequestMutation.mutateAsync(friendshipId),
    [cancelRequestMutation]
  );

  const unfriend = useCallback(
    (friendId: string) => unfriendMutation.mutateAsync(friendId),
    [unfriendMutation]
  );

  const blockUser = useCallback(
    (userId: string) => blockUserMutation.mutateAsync(userId),
    [blockUserMutation]
  );

  const unblockUser = useCallback(
    (userId: string) => unblockUserMutation.mutateAsync(userId),
    [unblockUserMutation]
  );

  const acceptAll = useCallback(
    () => acceptAllMutation.mutateAsync(),
    [acceptAllMutation]
  );

  const declineAll = useCallback(
    () => declineAllMutation.mutateAsync(),
    [declineAllMutation]
  );

  const refetchAll = useCallback(async () => {
    await Promise.all([
      friendsQuery.refetch(),
      receivedRequestsQuery.refetch(),
      receivedCountQuery.refetch(),
      sentRequestsQuery.refetch(),
      sentCountQuery.refetch(),
    ]);
  }, [
    friendsQuery,
    receivedRequestsQuery,
    receivedCountQuery,
    sentRequestsQuery,
    sentCountQuery,
  ]);

  const isLoading =
    friendsQuery.isLoading ||
    receivedRequestsQuery.isLoading ||
    sentRequestsQuery.isLoading;

  const isError =
    friendsQuery.isError ||
    receivedRequestsQuery.isError ||
    sentRequestsQuery.isError;

  return {
    friendsQuery,
    receivedRequestsQuery,
    receivedCountQuery,
    sentRequestsQuery,
    sentCountQuery,

    friends,
    receivedRequests,
    receivedCount,
    sentRequests,
    sentCount,

    quota,
    isGold,

    isLoading,
    isError,
    refetchAll,

    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    unfriend,
    blockUser,
    unblockUser,
    acceptAll,
    declineAll,

    sendRequestMutation,
    acceptRequestMutation,
    declineRequestMutation,
    cancelRequestMutation,
    unfriendMutation,
    blockUserMutation,
    unblockUserMutation,
    acceptAllMutation,
    declineAllMutation,
  };
}
