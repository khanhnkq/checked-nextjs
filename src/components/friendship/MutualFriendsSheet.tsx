'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, AlertTriangle, UserX } from 'lucide-react';
import { BaseBottomSheet } from '@/components/sheets/BaseBottomSheet';
import { SkeletonBone } from '@/components/common/SkeletonBone';
import { getMutualFriends } from '@/lib/api/friendship-api';
import { haptics } from '@/lib/utils/haptics';
import type { FriendProfile } from '@/types/friendship';

export interface MutualFriendsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
  onSelectFriend?: (friend: FriendProfile) => void;
  className?: string;
}

/**
 * MutualFriendsSheet (Sheet hiển thị danh sách Bạn chung chuẩn 1:1 iOS Locket)
 * - Kế thừa BaseBottomSheet với title "Bạn chung" và phụ đề "Với {targetName}"
 * - Tự động tải danh sách bạn chung từ API khi mở
 * - Trạng thái loading: 4 Skeleton Cards mô phỏng cấu trúc hàng bạn bè
 * - Trạng thái error: Biểu tượng cảnh báo kèm nút "Thử lại"
 * - Trạng thái empty: Icon UserX kèm giải thích thân thiện
 * - Danh sách bạn bè: Thẻ phẳng bo góc 16px, Avatar 44x44, tên + @username + Chevron
 * - Tuân thủ nguyên tắc thiết kế phẳng: Zero Border, Zero Shadow
 */
export const MutualFriendsSheet: React.FC<MutualFriendsSheetProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetName,
  onSelectFriend,
  className,
}) => {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFriends = useCallback(async (signal?: AbortSignal) => {
    if (!targetUserId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getMutualFriends(targetUserId, signal);
      setFriends(data);
      setIsLoading(false);
    } catch (err) {
      if (signal?.aborted) return;
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải danh sách bạn chung'
      );
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    fetchFriends(controller.signal);

    return () => {
      controller.abort();
    };
  }, [isOpen, fetchFriends]);

  const handleSelect = (friend: FriendProfile) => {
    haptics.light();
    onSelectFriend?.(friend);
    onClose();
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onClose}
      title="Bạn chung"
      subtitle={`Với ${targetName}`}
      className={className}
    >
      {/* 1. Trạng thái Loading Skeleton */}
      {isLoading && (
        <div data-testid="mutual-friends-skeleton" className="space-y-2.5 py-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-surface rounded-[16px] px-4 py-2.5 flex items-center gap-3"
            >
              <SkeletonBone variant="circle" width={44} height={44} />
              <div className="flex-1 space-y-1.5">
                <SkeletonBone width={120} height={16} />
                <SkeletonBone width={80} height={12} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Trạng thái Lỗi */}
      {!isLoading && errorMessage && (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertTriangle size={36} className="text-accent-orange" />
          <p className="text-[14px] font-medium text-text-secondary max-w-xs">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              haptics.light();
              fetchFriends();
            }}
            className="mt-1 px-4 py-2 rounded-xl bg-primary text-text-primary text-[14px] font-bold active:scale-95 transition-transform"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Trạng thái Danh sách rỗng */}
      {!isLoading && !errorMessage && friends.length === 0 && (
        <div className="py-10 flex flex-col items-center justify-center text-center gap-2">
          <UserX size={40} className="text-text-secondary/60 mb-1" />
          <h3 className="text-[15px] font-semibold text-text-primary">
            Chưa có bạn chung nào
          </h3>
          <p className="text-[13px] text-text-secondary max-w-xs leading-relaxed px-4">
            Khi cả hai cùng kết bạn với những người khác, danh sách bạn chung sẽ xuất hiện tại đây.
          </p>
        </div>
      )}

      {/* 4. Danh sách bạn chung thành công */}
      {!isLoading && !errorMessage && friends.length > 0 && (
        <div className="space-y-2 py-1">
          {friends.map((friend) => {
            const displayName = friend.displayName || friend.username;
            const fallbackInitial = (displayName || '?').charAt(0).toUpperCase();

            return (
              <button
                key={friend.id}
                type="button"
                onClick={() => handleSelect(friend)}
                aria-label={`Xem hồ sơ ${displayName}`}
                className="w-full bg-surface rounded-[16px] px-4 py-3 flex items-center gap-3.5 text-left active:scale-[0.99] transition-transform"
              >
                {/* Avatar 44x44 */}
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-surface-subtle flex items-center justify-center">
                  {friend.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={friend.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[16px] font-bold text-text-primary select-none">
                      {fallbackInitial}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-semibold text-text-primary truncate">
                    {displayName}
                  </h4>
                  <p className="text-[13px] text-text-secondary truncate">
                    @{friend.username}
                  </p>
                </div>

                {/* Chevron indicator */}
                <ChevronRight
                  size={14}
                  className="text-text-secondary/50 shrink-0"
                />
              </button>
            );
          })}
        </div>
      )}
    </BaseBottomSheet>
  );
};
