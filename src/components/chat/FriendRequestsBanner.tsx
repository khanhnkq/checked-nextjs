'use client';

import React, { useState } from 'react';
import { Mail, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface RequesterAvatarPreview {
  id?: string;
  avatarUrl?: string | null;
  displayName?: string;
  username?: string;
  fallbackInitials?: string;
  requester?: {
    id?: string;
    avatarUrl?: string | null;
    displayName?: string;
    username?: string;
  };
  sender?: {
    id?: string;
    avatarUrl?: string | null;
    displayName?: string;
    username?: string;
  };
}

export interface FriendRequestsBannerProps {
  pendingRequestsCount?: number;
  pendingRequesters?: RequesterAvatarPreview[];
  onClick?: () => void;
  className?: string;
}

const RequesterAvatarItem: React.FC<{
  item: RequesterAvatarPreview;
  index: number;
}> = ({ item, index }) => {
  const [imageError, setImageError] = useState(false);

  const url =
    item.avatarUrl ??
    item.requester?.avatarUrl ??
    item.sender?.avatarUrl;

  const name =
    item.displayName ??
    item.requester?.displayName ??
    item.sender?.displayName ??
    item.username ??
    item.fallbackInitials ??
    '?';

  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      data-testid="requester-avatar-preview"
      style={{ zIndex: 10 - index }}
      className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-2 ring-surface bg-[#DFDACD] flex items-center justify-center text-[11px] font-bold text-text-primary"
    >
      {url && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

/**
 * FriendRequestsBanner
 * - Banner Lời mời kết bạn nổi bật chuẩn 1:1 iOS FriendshipListView
 * - Thẻ bo góc 20px, nền trắng (AppColors.surface)
 * - Icon tròn 44x44: màu Matcha Glow #D4EB70 (kèm Mail icon) khi có lời mời, hoặc màu Oat Milk Subtle #DFDACD (kèm Users icon)
 * - Huy hiệu đỏ capsule hiển thị số lời mời chờ duyệt
 * - Danh sách avatar xếp chồng tối đa 3 người gửi (HStack spacing -8px)
 * - Zero Border, Zero Shadow
 */
export const FriendRequestsBanner: React.FC<FriendRequestsBannerProps> = ({
  pendingRequestsCount = 0,
  pendingRequesters = [],
  onClick,
  className,
}) => {
  const handleClick = () => {
    haptics.click();
    onClick?.();
  };

  const hasPending = pendingRequestsCount > 0;
  const previewRequesters = pendingRequesters.slice(0, 3);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full bg-surface rounded-[20px] px-3.5 py-3 flex items-center gap-3 text-left select-none',
        'active:scale-95 transition-transform duration-150',
        className
      )}
    >
      {/* 1. Icon tròn 44x44 */}
      <div
        className={cn(
          'w-11 h-11 rounded-full shrink-0 flex items-center justify-center transition-colors',
          hasPending ? 'bg-[#D4EB70] text-[#141613]' : 'bg-[#DFDACD] text-text-primary'
        )}
      >
        {hasPending ? (
          <Mail size={20} strokeWidth={2.2} />
        ) : (
          <Users size={20} strokeWidth={2.2} />
        )}
      </div>

      {/* 2. Tiêu đề, Badge và Mô tả */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-[16px] text-text-primary">
            Lời mời kết bạn
          </span>

          {hasPending && (
            <span
              data-testid="friend-requests-count-badge"
              className="bg-[#FF6954] text-white font-display font-black text-[11px] px-2 py-0.5 rounded-full leading-none shrink-0"
            >
              {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
            </span>
          )}
        </div>

        <p className="text-[12px] font-medium text-text-secondary truncate mt-0.5">
          {hasPending
            ? `${pendingRequestsCount} người đang chờ bạn phản hồi`
            : 'Quản lý lời mời đã nhận & đã gửi'}
        </p>
      </div>

      {/* 3. Stack Avatar xem trước (tối đa 3) */}
      {previewRequesters.length > 0 && (
        <div className="flex items-center -space-x-2 shrink-0">
          {previewRequesters.map((req, index) => (
            <RequesterAvatarItem
              key={req.id || `req-${index}`}
              item={req}
              index={index}
            />
          ))}
        </div>
      )}

      {/* 4. Mũi tên Chevron Right */}
      <ChevronRight
        size={18}
        strokeWidth={2.5}
        className="text-text-secondary/60 shrink-0"
      />
    </button>
  );
};
