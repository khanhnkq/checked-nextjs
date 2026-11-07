'use client';

/**
 * useFriendInvite Hook
 * Quản lý Link mời kết bạn (Friend Invite Links) & Token xem trước / chấp nhận kết bạn
 * Tích hợp TanStack Query và phản hồi rung haptics đa nền tảng
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  friendshipKeys,
  getCurrentInviteLink,
  previewInviteToken,
  createOrRotateInviteLink,
  revokeInviteLink as apiRevokeInviteLink,
  acceptInviteToken,
} from '@/lib/api/friendship-api';
import { haptics } from '@/lib/utils/haptics';
import type {
  FriendInviteLinkInfo,
  FriendInvitePreview,
  AcceptInviteResponse,
} from '@/types/friendship';

export interface UseFriendInviteOptions {
  /** Token lời mời cần xem trước (nếu có) */
  token?: string;
  /** Cho phép thực thi truy vấn tự động (mặc định: true) */
  enabled?: boolean;
}

export interface UseFriendInviteReturn {
  // TanStack Query Instances
  currentInviteQuery: UseQueryResult<FriendInviteLinkInfo, Error>;
  previewTokenQuery: UseQueryResult<FriendInvitePreview, Error>;

  // Clean data accessors
  currentInvite: FriendInviteLinkInfo | null;
  preview: FriendInvitePreview | null;

  // State flags
  isLoading: boolean;
  isError: boolean;

  // Mutation actions
  rotateInviteLink: (maxUses?: number, validDays?: number) => Promise<FriendInviteLinkInfo>;
  revokeInviteLink: () => Promise<void>;
  acceptToken: (token: string) => Promise<AcceptInviteResponse>;

  // Mutation objects
  rotateInviteMutation: UseMutationResult<
    FriendInviteLinkInfo,
    Error,
    { maxUses?: number; validDays?: number } | undefined
  >;
  revokeInviteMutation: UseMutationResult<void, Error, void>;
  acceptTokenMutation: UseMutationResult<AcceptInviteResponse, Error, string>;
}

export function useFriendInvite(
  optionsOrToken?: UseFriendInviteOptions | string
): UseFriendInviteReturn {
  const queryClient = useQueryClient();

  const options: UseFriendInviteOptions = useMemo(() => {
    if (typeof optionsOrToken === 'string') {
      return { token: optionsOrToken, enabled: true };
    }
    return optionsOrToken ?? { enabled: true };
  }, [optionsOrToken]);

  const token = options.token;
  const isEnabled = options.enabled ?? true;

  // 1. Current Invite Link Query
  const currentInviteQuery = useQuery<FriendInviteLinkInfo, Error>({
    queryKey: friendshipKeys.inviteCurrent,
    queryFn: ({ signal }) => getCurrentInviteLink(signal),
    enabled: isEnabled,
  });

  // 2. Preview Token Query (chỉ gọi khi token có giá trị)
  const previewTokenQuery = useQuery<FriendInvitePreview, Error>({
    queryKey: friendshipKeys.invitePreview(token || ''),
    queryFn: ({ signal }) => previewInviteToken(token!, signal),
    enabled: Boolean(token) && isEnabled,
  });

  const currentInvite = useMemo(
    () => currentInviteQuery.data ?? null,
    [currentInviteQuery.data]
  );
  const preview = useMemo(
    () => previewTokenQuery.data ?? null,
    [previewTokenQuery.data]
  );

  // 3. Mutations with Invalidation & Haptics
  const rotateInviteMutation = useMutation<
    FriendInviteLinkInfo,
    Error,
    { maxUses?: number; validDays?: number } | undefined
  >({
    mutationFn: (vars) => createOrRotateInviteLink(vars?.maxUses, vars?.validDays),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.inviteCurrent });
    },
  });

  const revokeInviteMutation = useMutation<void, Error, void>({
    mutationFn: () => apiRevokeInviteLink(),
    onSuccess: () => {
      haptics.light();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.inviteCurrent });
    },
  });

  const acceptTokenMutation = useMutation<AcceptInviteResponse, Error, string>({
    mutationFn: (targetToken: string) => acceptInviteToken(targetToken),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friends() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.all });
    },
  });

  // Action methods
  const rotateInviteLink = useCallback(
    (maxUses?: number, validDays?: number) =>
      rotateInviteMutation.mutateAsync({ maxUses, validDays }),
    [rotateInviteMutation]
  );

  const revokeInviteLink = useCallback(
    () => revokeInviteMutation.mutateAsync(),
    [revokeInviteMutation]
  );

  const acceptToken = useCallback(
    (tokenToAccept: string) => acceptTokenMutation.mutateAsync(tokenToAccept),
    [acceptTokenMutation]
  );

  const isLoading =
    currentInviteQuery.isLoading || (Boolean(token) && previewTokenQuery.isLoading);

  const isError =
    currentInviteQuery.isError || (Boolean(token) && previewTokenQuery.isError);

  return {
    currentInviteQuery,
    previewTokenQuery,

    currentInvite,
    preview,

    isLoading,
    isError,

    rotateInviteLink,
    revokeInviteLink,
    acceptToken,

    rotateInviteMutation,
    revokeInviteMutation,
    acceptTokenMutation,
  };
}
