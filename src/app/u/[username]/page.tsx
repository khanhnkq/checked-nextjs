'use client';

import React, { use, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Check,
  UserX,
  Loader2,
  Users,
  ChevronRight,
  ShieldOff,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useFriendships } from '@/hooks/useFriendships';
import {
  getUserProfileByUsername,
  friendshipKeys,
} from '@/lib/api/friendship-api';
import { MutualFriendsSheet } from '@/components/friendship/MutualFriendsSheet';
import { SkeletonBone } from '@/components/common/SkeletonBone';
import { haptics } from '@/lib/utils/haptics';
import type {
  UserProfileWithRelation,
  RelationshipStatus,
} from '@/types/friendship';

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

function resolveParams(
  params: Promise<{ username: string }> | { username: string }
): { username: string } {
  if (params && typeof (params as Promise<{ username: string }>).then === 'function') {
    return use(params as Promise<{ username: string }>);
  }
  return params as { username: string };
}

/**
 * Loading Skeleton phẳng tuân thủ nguyên tắc Zero Border, Zero Shadow
 */
function UserProfileSkeleton({
  username,
  onBack,
}: {
  username?: string;
  onBack?: () => void;
}) {
  return (
    <div className="min-h-screen bg-canvas text-text-primary select-none flex flex-col items-center">
      <main
        data-testid="user-profile-skeleton"
        className="w-full max-w-md mx-auto flex flex-col min-h-screen px-4 pt-3 pb-8 relative"
      >
      {/* Header bar */}
      <header className="h-11 flex items-center justify-between shrink-0 mb-6">
        <button
          type="button"
          onClick={onBack}
          data-testid="user-profile-back-btn"
          aria-label="Quay lại"
          className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-90 transition-transform"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="w-11 h-11" aria-hidden="true" />
      </header>

      {/* Profile Card Center */}
      <div className="flex flex-col items-center text-center">
        {/* Avatar skeleton (96x96) */}
        <SkeletonBone variant="circle" width={96} height={96} className="mb-4" />
        {/* Name skeleton */}
        <SkeletonBone width={180} height={24} className="rounded-lg mb-2" />
        {/* Username skeleton */}
        <SkeletonBone width={110} height={16} className="rounded-lg mb-6" />
      </div>

      {/* Mutual friends card skeleton */}
      <div className="w-full mb-4">
        <SkeletonBone height={56} className="w-full rounded-[18px]" />
      </div>

      {/* Action button skeleton (52px) */}
      <div className="w-full mt-2">
        <SkeletonBone height={52} className="w-full rounded-full" />
      </div>
    </main>
  </div>
  );
}

/**
 * Trạng thái 404 Không tìm thấy người dùng
 */
function UserProfileNotFound({
  username,
  onBack,
}: {
  username: string;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-canvas text-text-primary select-none flex flex-col items-center">
      <main
        data-testid="user-profile-not-found"
        className="w-full max-w-md mx-auto flex flex-col min-h-screen px-4 pt-3 pb-8 relative"
      >
      {/* Header Bar */}
      <header className="h-11 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBack}
          data-testid="user-profile-back-btn"
          aria-label="Quay lại"
          className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-90 transition-transform"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="w-11 h-11" aria-hidden="true" />
      </header>

      {/* Center 404 View */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 gap-3">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-text-secondary mb-2">
          <UserX size={36} />
        </div>
        <h2 className="text-[20px] font-bold font-display text-text-primary">
          Không tìm thấy người dùng
        </h2>
        <p className="text-[14px] text-text-secondary max-w-xs leading-relaxed">
          Người dùng <span className="font-semibold text-text-primary">@{username}</span> không
          tồn tại hoặc đã thay đổi username.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-6 h-11 rounded-full bg-primary font-bold text-text-primary text-[15px] active:scale-95 transition-transform"
        >
          Quay lại
        </button>
      </div>
    </main>
  </div>
  );
}

/**
 * Nội dung trang Profile công khai (/u/[username])
 */
function UserProfileContent({ username }: { username: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cleanUsername = useMemo(
    () => (username ? decodeURIComponent(username).replace(/^@/, '') : ''),
    [username]
  );

  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [isActionPending, setIsActionPending] = useState<boolean>(false);
  const [showMutualSheet, setShowMutualSheet] = useState<boolean>(false);

  // 1. TanStack Query lấy thông tin profile
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<UserProfileWithRelation, Error>({
    queryKey: friendshipKeys.userProfile(cleanUsername),
    queryFn: ({ signal }) => getUserProfileByUsername(cleanUsername, signal),
    enabled: Boolean(cleanUsername),
  });

  // 2. Hook quan hệ bạn bè
  const {
    sendRequest,
    acceptRequest,
    cancelRequest,
    unfriend,
    unblockUser,
  } = useFriendships({ enabled: Boolean(isAuthenticated) });

  // 3. Xử lý nút Back
  const handleBack = useCallback(() => {
    haptics.light();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  // 4. Xác định trạng thái quan hệ hiệu dụng (effectiveRelationshipStatus)
  const effectiveStatus: RelationshipStatus = useMemo(() => {
    if (!isAuthenticated) return 'UNAUTHENTICATED';
    if (
      currentUser &&
      profile &&
      (currentUser.id === profile.id ||
        currentUser.username?.toLowerCase() === profile.username?.toLowerCase())
    ) {
      return 'SELF';
    }
    return profile?.relationshipStatus ?? 'NONE';
  }, [isAuthenticated, currentUser, profile]);

  // 5. Invalidate và làm mới dữ liệu profile sau mutation
  const handleMutationSuccess = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: friendshipKeys.userProfile(cleanUsername),
    });
  }, [queryClient, cleanUsername]);

  // 6. Xử lý các thao tác tương tác
  const handleAddFriend = useCallback(async () => {
    if (!profile) return;
    haptics.medium();
    setIsActionPending(true);
    try {
      await sendRequest(profile.id);
      await handleMutationSuccess();
    } catch {
      // handled
    } finally {
      setIsActionPending(false);
    }
  }, [profile, sendRequest, handleMutationSuccess]);

  const handleCancelRequest = useCallback(async () => {
    if (!profile?.friendshipId) return;
    haptics.light();
    setIsActionPending(true);
    try {
      await cancelRequest(profile.friendshipId);
      await handleMutationSuccess();
    } catch {
      // handled
    } finally {
      setIsActionPending(false);
    }
  }, [profile, cancelRequest, handleMutationSuccess]);

  const handleAcceptRequest = useCallback(async () => {
    if (!profile?.friendshipId) return;
    haptics.medium();
    setIsActionPending(true);
    try {
      await acceptRequest(profile.friendshipId);
      await handleMutationSuccess();
    } catch {
      // handled
    } finally {
      setIsActionPending(false);
    }
  }, [profile, acceptRequest, handleMutationSuccess]);

  const handleUnfriend = useCallback(async () => {
    if (!profile) return;
    haptics.medium();
    setIsActionPending(true);
    try {
      await unfriend(profile.id);
      await handleMutationSuccess();
    } catch {
      // handled
    } finally {
      setIsActionPending(false);
    }
  }, [profile, unfriend, handleMutationSuccess]);

  const handleUnblock = useCallback(async () => {
    if (!profile) return;
    haptics.light();
    setIsActionPending(true);
    try {
      await unblockUser(profile.id);
      await handleMutationSuccess();
    } catch {
      // handled
    } finally {
      setIsActionPending(false);
    }
  }, [profile, unblockUser, handleMutationSuccess]);

  const handleSelfClick = useCallback(() => {
    haptics.click();
    router.push('/profile');
  }, [router]);

  const handleLoginClick = useCallback(() => {
    haptics.click();
    router.push(`/login?redirect=/u/${cleanUsername}`);
  }, [router, cleanUsername]);

  // Loading skeleton
  if (isLoading) {
    return <UserProfileSkeleton username={cleanUsername} onBack={handleBack} />;
  }

  // Error / Not found state
  if (isError || !profile) {
    return <UserProfileNotFound username={cleanUsername} onBack={handleBack} />;
  }

  const displayName = profile.displayName || profile.username;
  const initial = (displayName || '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-canvas text-text-primary select-none flex flex-col items-center">
      <main
        data-testid="user-profile-page"
        className="w-full max-w-md mx-auto flex flex-col min-h-screen px-4 pt-3 pb-8 select-none justify-between relative"
      >
      <div>
        {/* 1. Header Bar: Nút Back tròn 44px */}
        <header className="h-11 flex items-center justify-between shrink-0 mb-6">
          <button
            type="button"
            onClick={handleBack}
            data-testid="user-profile-back-btn"
            aria-label="Quay lại"
            className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-90 transition-transform"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="w-11 h-11" aria-hidden="true" />
        </header>

        {/* 2. Profile Card: Avatar 96x96, Fallback initials, Tên, Username */}
        <section aria-label="Thông tin người dùng" className="flex flex-col items-center text-center mt-2">
          {/* Avatar 96x96px */}
          <div className="relative w-24 h-24 mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-surface flex items-center justify-center">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  data-testid="avatar-fallback"
                  className="text-[32px] font-bold font-display text-text-primary select-none"
                >
                  {initial}
                </span>
              )}
            </div>
          </div>

          {/* Họ tên hiển thị (24px font-bold font-display text-text-primary) */}
          <h2 className="text-[24px] font-bold font-display text-text-primary leading-tight">
            {displayName}
          </h2>

          {/* Username (@username, 15px font-medium text-text-secondary) */}
          <p className="text-[15px] font-medium text-text-secondary mt-0.5">
            @{cleanUsername}
          </p>
        </section>

        {/* 3. Mục Bạn chung (Mutual Friends Section) */}
        {profile.mutualFriendsCount > 0 && (
          <section className="mt-8">
            <button
              type="button"
              onClick={() => {
                haptics.light();
                setShowMutualSheet(true);
              }}
              data-testid="mutual-friends-card"
              className="w-full bg-surface rounded-[18px] p-3.5 flex items-center justify-between text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                {/* Overlapping avatars preview or Users icon */}
                {profile.mutualFriendsPreview && profile.mutualFriendsPreview.length > 0 ? (
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    {profile.mutualFriendsPreview.slice(0, 3).map((friend) => (
                      <div
                        key={friend.id}
                        className="w-7 h-7 rounded-full bg-surface-subtle overflow-hidden flex items-center justify-center ring-2 ring-surface"
                      >
                        {friend.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={friend.avatarUrl}
                            alt={friend.displayName || friend.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] font-bold text-text-primary">
                            {(friend.displayName || friend.username || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-subtle flex items-center justify-center text-text-secondary">
                    <Users size={16} />
                  </div>
                )}

                <div>
                  <h3 className="text-[15px] font-semibold text-text-primary">
                    {profile.mutualFriendsCount} bạn chung
                  </h3>
                  <p className="text-[12px] text-text-secondary">
                    Nhấn để xem danh sách bạn bè chung
                  </p>
                </div>
              </div>

              <ChevronRight size={18} className="text-text-secondary/60 shrink-0" />
            </button>
          </section>
        )}
      </div>

      {/* 4. Smart Action Button theo relationshipStatus */}
      <div className="w-full mt-8">
        {/* Trạng thái 1: NONE -> Nút lớn 52px bg-primary "+ Thêm bạn bè" */}
        {effectiveStatus === 'NONE' && (
          <button
            type="button"
            onClick={handleAddFriend}
            disabled={isActionPending}
            data-testid="action-btn-add-friend"
            className="w-full h-[52px] rounded-full bg-primary font-bold text-[#141613] text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {isActionPending ? (
              <Loader2 size={20} className="animate-spin text-[#141613]" />
            ) : (
              <span>+ Thêm bạn bè</span>
            )}
          </button>
        )}

        {/* Trạng thái 2: PENDING_SENT -> Nút lớn 52px bg-surface "Đã gửi lời mời" (Click hủy) */}
        {effectiveStatus === 'PENDING_SENT' && (
          <button
            type="button"
            onClick={handleCancelRequest}
            disabled={isActionPending}
            data-testid="action-btn-pending-sent"
            className="w-full h-[52px] rounded-full bg-surface font-semibold text-text-secondary text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {isActionPending ? (
              <Loader2 size={20} className="animate-spin text-text-secondary" />
            ) : (
              <span>Đã gửi lời mời</span>
            )}
          </button>
        )}

        {/* Trạng thái 3: PENDING_RECEIVED -> Nút lớn 52px bg-primary "Chấp nhận kết bạn" */}
        {effectiveStatus === 'PENDING_RECEIVED' && (
          <button
            type="button"
            onClick={handleAcceptRequest}
            disabled={isActionPending}
            data-testid="action-btn-accept"
            className="w-full h-[52px] rounded-full bg-primary font-bold text-[#141613] text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {isActionPending ? (
              <Loader2 size={20} className="animate-spin text-[#141613]" />
            ) : (
              <span>Chấp nhận kết bạn</span>
            )}
          </button>
        )}

        {/* Trạng thái 4: ACCEPTED -> Nút "Bạn bè" kèm icon Check, hỗ trợ hủy kết bạn */}
        {effectiveStatus === 'ACCEPTED' && (
          <button
            type="button"
            onClick={handleUnfriend}
            disabled={isActionPending}
            data-testid="action-btn-accepted"
            aria-label="Bạn bè"
            className="w-full h-[52px] rounded-full bg-surface font-semibold text-text-primary text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {isActionPending ? (
              <Loader2 size={20} className="animate-spin text-text-primary" />
            ) : (
              <>
                <Check size={20} className="text-success stroke-[2.5]" />
                <span>Bạn bè</span>
              </>
            )}
          </button>
        )}

        {/* Trạng thái 5: SELF -> Nút "Chỉnh sửa hồ sơ" */}
        {effectiveStatus === 'SELF' && (
          <button
            type="button"
            onClick={handleSelfClick}
            data-testid="action-btn-self"
            className="w-full h-[52px] rounded-full bg-surface font-semibold text-text-primary text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span>Chỉnh sửa hồ sơ</span>
          </button>
        )}

        {/* Trạng thái 6: UNAUTHENTICATED -> Nút "Đăng nhập để kết bạn" */}
        {effectiveStatus === 'UNAUTHENTICATED' && (
          <button
            type="button"
            onClick={handleLoginClick}
            data-testid="action-btn-login"
            className="w-full h-[52px] rounded-full bg-primary font-bold text-[#141613] text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span>Đăng nhập để kết bạn</span>
          </button>
        )}

        {/* Trạng thái 7: BLOCKED -> Nút "Bỏ chặn" */}
        {effectiveStatus === 'BLOCKED' && (
          <button
            type="button"
            onClick={handleUnblock}
            disabled={isActionPending}
            data-testid="action-btn-unblock"
            className="w-full h-[52px] rounded-full bg-surface font-bold text-error text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {isActionPending ? (
              <Loader2 size={20} className="animate-spin text-error" />
            ) : (
              <>
                <ShieldOff size={18} />
                <span>Bỏ chặn</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Sheet hiển thị danh sách bạn chung */}
      {profile && (
        <MutualFriendsSheet
          isOpen={showMutualSheet}
          onClose={() => setShowMutualSheet(false)}
          targetUserId={profile.id}
          targetName={displayName}
          onSelectFriend={(friend) => {
            setShowMutualSheet(false);
            router.push(`/u/${friend.username}`);
          }}
        />
      )}
    </main>
  </div>
  );
}

function UserProfileContentWrapper({
  paramsPromise,
}: {
  paramsPromise: Promise<{ username: string }> | { username: string };
}) {
  const { username } = resolveParams(paramsPromise);
  return <UserProfileContent username={username} />;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  return (
    <Suspense fallback={<UserProfileSkeleton />}>
      <UserProfileContentWrapper paramsPromise={params} />
    </Suspense>
  );
}
