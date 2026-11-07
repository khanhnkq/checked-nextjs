'use client';

import React from 'react';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface MessagesTopBarProps {
  onBack?: () => void;
  onAddFriend?: () => void;
  pendingRequestsCount?: number;
  className?: string;
  title?: string;
}

/**
 * MessagesTopBar
 * - Thanh tiêu đề nổi phẳng chuẩn 1:1 iOS FriendshipListView
 * - Nút Back tròn 44x44 nền trắng, icon màu đen (#141613)
 * - Tiêu đề "Tin nhắn" (font SF Pro Rounded / Plus Jakarta Sans, bold 22px)
 * - Nút "Thêm bạn" tròn 44x44 kèm chấm đỏ 10x10 khi có lời mời kết bạn chờ duyệt
 * - Phản hồi xúc giác haptics + active:scale-95
 * - Zero Border, Zero Shadow
 */
export const MessagesTopBar: React.FC<MessagesTopBarProps> = ({
  onBack,
  onAddFriend,
  pendingRequestsCount = 0,
  className,
  title = 'Tin nhắn',
}) => {
  const handleBack = () => {
    haptics.click();
    onBack?.();
  };

  const handleAddFriend = () => {
    haptics.click();
    onAddFriend?.();
  };

  const hasPendingRequests = pendingRequestsCount > 0;

  return (
    <header
      className={cn(
        'w-full flex items-center justify-between px-4 py-2 select-none bg-transparent',
        className
      )}
    >
      {/* 1. Nút Back tròn 44x44 */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Quay lại"
        className="w-11 h-11 rounded-full bg-surface text-text-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform duration-150"
      >
        <ChevronLeft size={22} strokeWidth={2.5} className="mr-0.5" />
      </button>

      {/* 2. Tiêu đề "Tin nhắn" */}
      <h1 className="font-display font-bold text-[22px] text-text-primary tracking-tight">
        {title}
      </h1>

      {/* 3. Nút Thêm bạn tròn 44x44 kèm chấm đỏ */}
      <button
        type="button"
        onClick={handleAddFriend}
        aria-label="Thêm bạn"
        className="relative w-11 h-11 rounded-full bg-surface text-text-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform duration-150"
      >
        <UserPlus size={20} strokeWidth={2.2} />

        {hasPendingRequests && (
          <span
            data-testid="add-friend-badge-dot"
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#FF6954] ring-2 ring-surface"
          />
        )}
      </button>
    </header>
  );
};
