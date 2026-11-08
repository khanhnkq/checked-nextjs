'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, Loader2, UserX } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { getBlockedUsers, unblockUser } from '@/lib/api/friendship-api';
import { SettingsTopBar, BlockedUserRow } from '@/components/settings';
import { haptics } from '@/lib/utils/haptics';
import type { FriendProfile } from '@/types/friendship';

/**
 * BlockedUsersPage (/settings/blocked)
 * - Màn hình quản lý danh sách tài khoản đã bị chặn
 * - Parity 1:1 với BlockedUsersView.swift & BlockedUsersViewModel.swift trên iOS
 * - Thiết kế Oat Milk & Zero Border, Zero Shadow, Zero Blur
 */
export default function BlockedUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isHydrated } = useAuthStore();

  const [userToUnblock, setUserToUnblock] = useState<FriendProfile | null>(null);

  // 1. Route Guard: Chuyển hướng sang /login nếu chưa đăng nhập
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login?redirect=/settings/blocked');
    }
  }, [isHydrated, isAuthenticated, router]);

  // 2. Query: Lấy danh sách người dùng bị chặn
  const { data: blockedUsers = [], isLoading } = useQuery<FriendProfile[]>({
    queryKey: ['/api/v1/friendships', 'blocked'],
    queryFn: ({ signal }) => getBlockedUsers(signal),
    enabled: Boolean(isAuthenticated),
  });

  // 3. Mutation: Bỏ chặn người dùng
  const unblockMutation = useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => {
      haptics.light();
      queryClient.invalidateQueries({
        queryKey: ['/api/v1/friendships', 'blocked'],
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/v1/friendships', 'friends'],
      });
      setUserToUnblock(null);
    },
    onError: () => {
      haptics.error();
    },
  });

  // 4. Xử lý quay lại /settings
  const handleBack = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // 5. Đóng dialog xác nhận
  const handleCancelUnblock = useCallback(() => {
    if (unblockMutation.isPending) return;
    haptics.click();
    setUserToUnblock(null);
  }, [unblockMutation.isPending]);

  // 6. Xác nhận bỏ chặn
  const handleConfirmUnblock = useCallback(async () => {
    if (!userToUnblock || unblockMutation.isPending) return;
    unblockMutation.mutate(userToUnblock.id);
  }, [userToUnblock, unblockMutation]);

  // Xử lý phím Escape để đóng dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !unblockMutation.isPending) {
        setUserToUnblock(null);
      }
    };
    if (userToUnblock) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [userToUnblock, unblockMutation.isPending]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col text-text-primary pt-safe">
      {/* TopBar cố định với nút back 44px tròn */}
      <SettingsTopBar title="Tài khoản đã bị chặn" onBack={handleBack} />

      {/* Nội dung chính */}
      <main className="flex-1 w-full max-w-md mx-auto flex flex-col px-4 pt-2 pb-12">
        {isLoading && blockedUsers.length === 0 ? (
          // Loading Skeleton
          <div
            data-testid="blocked-users-skeleton"
            className="w-full flex flex-col gap-2.5"
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-full bg-surface rounded-[18px] p-3.5 flex items-center justify-between gap-3 animate-pulse"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-11 h-11 rounded-full bg-surface-subtle/60 shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3.5 w-28 bg-surface-subtle/60 rounded" />
                    <div className="h-3 w-20 bg-surface-subtle/40 rounded" />
                  </div>
                </div>
                <div className="w-16 h-7 bg-surface-subtle/50 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : blockedUsers.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 select-none">
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center text-text-secondary mb-4">
              <ShieldOff size={36} strokeWidth={2.2} />
            </div>
            <h2 className="text-[18px] font-bold text-text-primary">
              Chưa có tài khoản nào bị chặn
            </h2>
            <p className="text-[14px] text-text-secondary leading-relaxed mt-2 max-w-xs">
              Những người bạn chặn sẽ không thể tìm thấy bạn hoặc gửi lời mời kết bạn cho bạn.
            </p>
          </div>
        ) : (
          // Blocked Users List
          <div className="w-full flex flex-col gap-2.5">
            {blockedUsers.map((user) => (
              <BlockedUserRow
                key={user.id}
                user={user}
                onUnblock={() => setUserToUnblock(user)}
                isUnblocking={
                  unblockMutation.isPending &&
                  unblockMutation.variables === user.id
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Dialog trước khi bỏ chặn */}
      {userToUnblock && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unblock-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
        >
          {/* Backdrop tối phẳng (Zero Blur, Zero Shadow) */}
          <div
            data-testid="unblock-dialog-backdrop"
            onClick={handleCancelUnblock}
            className="fixed inset-0 bg-black/40 transition-opacity animate-in fade-in duration-200"
          />

          {/* Dialog Container */}
          <div
            data-testid="unblock-dialog-container"
            className="relative z-10 w-full max-w-[340px] bg-[#EDE9DF] rounded-[28px] p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
          >
            {/* Icon Circle */}
            <div className="w-14 h-14 rounded-full bg-[#FF5252]/10 flex items-center justify-center mb-1 text-[#FF5252]">
              <UserX size={26} strokeWidth={2.4} />
            </div>

            {/* Tiêu đề & Thông điệp */}
            <h2
              id="unblock-dialog-title"
              className="text-[18px] font-bold text-[#141613] tracking-tight mt-2"
            >
              Bỏ chặn {userToUnblock.displayName || userToUnblock.username}?
            </h2>

            <p className="text-[14px] text-[#5C5F56] font-medium leading-relaxed mt-1 mb-5">
              Sau khi bỏ chặn, hai bạn sẽ có thể tìm thấy nhau và gửi lời mời kết bạn.
            </p>

            {/* Action Buttons (Zero Border, Zero Shadow) */}
            <div className="w-full flex flex-col gap-2.5">
              {/* Nút Bỏ chặn - Coral Red #FF5252 */}
              <button
                type="button"
                data-testid="dialog-confirm-unblock-button"
                onClick={handleConfirmUnblock}
                disabled={unblockMutation.isPending}
                className="w-full h-[52px] bg-[#FF5252] text-white font-bold text-[16px] rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {unblockMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Đang bỏ chặn...</span>
                  </>
                ) : (
                  <span>Bỏ chặn</span>
                )}
              </button>

              {/* Nút Hủy - White Surface #FFFFFF */}
              <button
                type="button"
                onClick={handleCancelUnblock}
                disabled={unblockMutation.isPending}
                className="w-full h-[52px] bg-[#FFFFFF] text-[#141613] font-bold text-[16px] rounded-full flex items-center justify-center transition-transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
