'use client';

import React, { useState } from 'react';
import { Crown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatTimeAgo } from '@/lib/utils/formatters';
import type { FriendRequestItem, SentFriendRequestItem } from '@/types/friendship';

export interface FriendRequestCardProps {
  item: FriendRequestItem | SentFriendRequestItem;
  tab: 'received' | 'sent';
  isLoadingAction?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancelSent?: () => void;
  onTapAvatar?: () => void;
  onTapMutualFriends?: () => void;
  className?: string;
}

/**
 * FriendRequestCard (Thẻ lời mời kết bạn chuẩn 1:1 iOS Locket)
 * - Hiển thị thông tin người yêu cầu (tab received) hoặc người nhận (tab sent)
 * - Avatar 48x48 với fallback chữ cái đầu trên nền Oat Milk Subtle (#DFDACD)
 * - Hiển thị huy hiệu Crown vàng nếu là Gold Member
 * - Hiển thị số lượng bạn chung màu Accent (#BFDD4A)
 * - Tab Received: 2 nút tròn 36px (Từ chối nền xám, Đồng ý nền Matcha Glow #D4EB70)
 * - Tab Sent: Nút capsule "Thu hồi" cao 34px
 * - Tuân thủ nguyên tắc thiết kế phẳng: Zero Border, Zero Shadow
 */
export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  item,
  tab,
  isLoadingAction = false,
  onAccept,
  onDecline,
  onCancelSent,
  onTapAvatar,
  onTapMutualFriends,
  className,
}) => {
  const targetUser = 'requester' in item ? item.requester : item.targetUser;
  const displayName = targetUser.displayName || targetUser.username || 'Người dùng';
  const mutualFriendsCount =
    'mutualFriendsCount' in item ? item.mutualFriendsCount : undefined;

  const [imageError, setImageError] = useState(false);
  const fallbackInitial = (displayName || '?').charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'bg-surface rounded-[18px] px-3.5 py-3 flex items-center gap-3',
        className
      )}
    >
      {/* 1. Avatar tròn 48x48 */}
      <button
        type="button"
        onClick={onTapAvatar}
        aria-label={`Xem hồ sơ ${displayName}`}
        className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-[#DFDACD] flex items-center justify-center active:scale-95 transition-transform"
      >
        {targetUser.avatarUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={targetUser.avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-[18px] font-bold text-text-primary select-none">
            {fallbackInitial}
          </span>
        )}
      </button>

      {/* 2. Thông tin người dùng */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        {/* Hàng 1: Tên hiển thị + Crown vàng + Thời gian */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-bold text-text-primary truncate">
            {displayName}
          </span>

          {targetUser.isGoldMember && (
            <Crown
              size={11}
              data-testid="gold-crown-icon"
              className="text-[#FFD700] fill-[#FFD700] shrink-0"
            />
          )}

          <span className="ml-auto text-[11px] font-medium text-text-secondary shrink-0">
            {formatTimeAgo(item.createdAt)}
          </span>
        </div>

        {/* Hàng 2: @username + Bạn chung */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] font-medium text-text-secondary truncate">
            @{targetUser.username}
          </span>

          {mutualFriendsCount !== undefined && mutualFriendsCount > 0 && (
            <span className="shrink-0 flex items-center gap-1">
              <span className="text-text-secondary text-[12px]">•</span>
              {onTapMutualFriends ? (
                <button
                  type="button"
                  onClick={onTapMutualFriends}
                  className="text-[12px] font-semibold text-accent active:opacity-70 transition-opacity"
                >
                  {mutualFriendsCount} bạn chung
                </button>
              ) : (
                <span className="text-[12px] font-semibold text-accent">
                  {mutualFriendsCount} bạn chung
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="shrink-0 flex items-center gap-2">
        {tab === 'received' ? (
          <>
            {/* Nút Từ chối (Tròn 36x36 xám nhạt) */}
            <button
              type="button"
              onClick={onDecline}
              disabled={isLoadingAction}
              aria-label="Từ chối"
              className="w-9 h-9 rounded-full bg-[#DFDACD]/80 active:bg-[#DFDACD] active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <X size={13} strokeWidth={2.6} className="text-text-secondary" />
            </button>

            {/* Nút Đồng ý (Tròn 36x36 Matcha Glow) */}
            <button
              type="button"
              onClick={onAccept}
              disabled={isLoadingAction}
              aria-label="Đồng ý"
              className="w-9 h-9 rounded-full bg-primary active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 text-black"
            >
              <Check size={13} strokeWidth={2.8} className="text-black" />
            </button>
          </>
        ) : (
          /* Tab Sent: Nút Thu hồi (Capsule 34px) */
          <button
            type="button"
            onClick={onCancelSent}
            disabled={isLoadingAction}
            className="h-[34px] px-3 rounded-full bg-[#DFDACD]/50 active:bg-[#DFDACD]/80 active:scale-95 transition-all flex items-center justify-center shrink-0 text-[13px] font-semibold text-text-secondary disabled:opacity-50"
          >
            Thu hồi
          </button>
        )}
      </div>
    </div>
  );
};
