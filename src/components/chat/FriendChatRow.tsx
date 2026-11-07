'use client';

import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import type { FriendChatItem } from '@/types/chat';

export interface FriendChatRowProps {
  item: FriendChatItem;
  onClick?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}

/**
 * Định dạng thời gian rút gọn chuẩn tin nhắn 1:1 iOS Locket
 * (vừa xong, 5p, 2h, 3d, 07/11)
 */
function formatChatTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

/**
 * Trích xuất nội dung hiển thị cho dòng tin nhắn cuối
 */
function resolveLastMessageText(item: FriendChatItem): string {
  const lastMessage = item.conversation?.lastMessage;
  if (!lastMessage) {
    return 'Chưa có tin nhắn nào';
  }

  if (lastMessage.isRevoked || lastMessage.type === 'SYSTEM') {
    return 'Tin nhắn đã được thu hồi';
  }

  if (lastMessage.type === 'PHOTO_REACTION' || lastMessage.photoContext) {
    return '📷 Đã phản hồi một ảnh';
  }

  if (lastMessage.content && lastMessage.content.trim().length > 0) {
    return lastMessage.content;
  }

  return 'Chưa có tin nhắn nào';
}

/**
 * FriendChatRow
 * - Thẻ bạn bè & tin nhắn chuẩn 1:1 iOS FriendshipListView
 * - Avatar 48x48 bo tròn, fallback chữ cái đầu, chấm xanh online khi đang trực tuyến
 * - Tên bạn bè, @username, huy hiệu Crown vàng nếu là Gold Member
 * - Tóm tắt tin nhắn cuối cùng hoặc "Chưa có tin nhắn nào"
 * - Thời gian rút gọn + Huy hiệu đỏ capsule unreadCount nếu có tin chưa đọc
 * - Phản hồi xúc giác khi bấm, hỗ trợ tách sự kiện bấm Avatar vs bấm Thẻ
 * - Zero Border, Zero Shadow
 */
export const FriendChatRow: React.FC<FriendChatRowProps> = ({
  item,
  onClick,
  onAvatarClick,
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const { friend, conversation, unreadCount = 0 } = item;
  const displayName = friend.displayName || friend.username || 'Bạn bè';
  const fallbackInitial = (displayName || '?').charAt(0).toUpperCase();

  const isOnline = Boolean(
    conversation?.partner?.isOnline ?? (friend as unknown as { isOnline?: boolean }).isOnline
  );

  const hasUnread = unreadCount > 0;
  const lastMsgText = resolveLastMessageText(item);
  const formattedTime = formatChatTime(item.lastActivityDate);

  const handleRowClick = () => {
    haptics.click();
    onClick?.();
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.click();
    onAvatarClick?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="friend-chat-row"
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
      aria-label={displayName}
      className={cn(
        'w-full bg-surface rounded-[18px] px-3.5 py-3 flex items-center gap-3 text-left select-none cursor-pointer',
        'active:scale-[0.98] transition-transform duration-150',
        className
      )}
    >
      {/* 1. Avatar tròn 48x48 kèm online dot */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={handleAvatarClick}
          aria-label={`Xem hồ sơ ${displayName}`}
          className="w-12 h-12 rounded-full overflow-hidden bg-[#DFDACD] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          {friend.avatarUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={friend.avatarUrl}
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

        {isOnline && (
          <span
            data-testid="online-indicator"
            className="absolute bottom-0 right-0 w-3 h-3 bg-[#4E8752] rounded-full ring-2 ring-surface"
          />
        )}
      </div>

      {/* 2. Thông tin: Tên hiển thị + @username + Crown + Nội dung tin nhắn */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              'font-display text-[15px] text-text-primary truncate',
              hasUnread ? 'font-bold' : 'font-semibold'
            )}
          >
            {displayName}
          </span>

          {friend.username && (
            <span className="text-[12px] font-medium text-text-secondary truncate shrink-0">
              @{friend.username}
            </span>
          )}

          {friend.isGoldMember && (
            <Crown
              size={12}
              data-testid="gold-crown-icon"
              className="text-[#FFD700] fill-[#FFD700] shrink-0"
            />
          )}
        </div>

        <p
          className={cn(
            'text-[13px] truncate',
            hasUnread
              ? 'font-semibold text-text-primary'
              : 'font-normal text-text-secondary'
          )}
        >
          {lastMsgText}
        </p>
      </div>

      {/* 3. Thời gian & Huy hiệu tin nhắn chưa đọc */}
      <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 min-w-[40px]">
        {formattedTime ? (
          <span
            className={cn(
              'text-[11px]',
              hasUnread
                ? 'font-bold text-text-primary'
                : 'font-medium text-text-secondary'
            )}
          >
            {formattedTime}
          </span>
        ) : (
          <span />
        )}

        {hasUnread && (
          <span
            data-testid="unread-badge"
            className="bg-[#FF6954] text-white font-display font-bold text-[11px] px-2 py-0.5 rounded-full leading-tight"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};
