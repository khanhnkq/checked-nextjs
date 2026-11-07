'use client';

import React from 'react';
import { SkeletonBone } from '@/components/common/SkeletonBone';
import { cn } from '@/lib/utils/cn';

export interface FriendshipListSkeletonProps {
  className?: string;
  rowCount?: number;
  showTopBar?: boolean;
  showBanner?: boolean;
}

/**
 * FriendshipListSkeleton
 * - Khung hình động (Skeleton Shimmer) mô phỏng 1:1 giao diện FriendshipListView
 * - Giữ nguyên kích thước và cấu trúc hình học để đạt 0ms layout shift (CLS = 0)
 * - Tùy chọn hiển thị TopBar, Banner Lời mời kết bạn và số lượng hàng bạn bè
 * - Zero Border, Zero Shadow
 */
export const FriendshipListSkeleton: React.FC<FriendshipListSkeletonProps> = ({
  className,
  rowCount = 6,
  showTopBar = true,
  showBanner = true,
}) => {
  return (
    <div
      data-testid="friendship-list-skeleton"
      className={cn('w-full space-y-3 select-none', className)}
    >
      {/* 1. Skeleton cho Top Bar (Nút quay lại, Tiêu đề, Nút thêm bạn) */}
      {showTopBar && (
        <div
          data-testid="messages-top-bar-skeleton"
          className="w-full flex items-center justify-between px-4 py-2"
        >
          <SkeletonBone variant="circle" width={44} height={44} />
          <SkeletonBone width={110} height={24} className="rounded-lg" />
          <SkeletonBone variant="circle" width={44} height={44} />
        </div>
      )}

      {/* 2. Skeleton cho Banner Lời mời kết bạn */}
      {showBanner && (
        <div
          data-testid="friend-requests-banner-skeleton"
          className="bg-surface rounded-[20px] px-3.5 py-3 flex items-center gap-3 w-full"
        >
          <SkeletonBone variant="circle" width={44} height={44} />
          <div className="flex-1 space-y-2">
            <SkeletonBone width={130} height={16} className="rounded-md" />
            <SkeletonBone width={180} height={12} className="rounded-md" />
          </div>
          <SkeletonBone width={14} height={14} className="rounded-md shrink-0 mr-1" />
        </div>
      )}

      {/* 3. Skeleton cho các dòng Chat / Bạn bè */}
      <div className="space-y-2.5 w-full">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div
            key={index}
            data-testid="friend-chat-row-skeleton"
            className="bg-surface rounded-[18px] px-3.5 py-3 flex items-center gap-3 w-full"
          >
            {/* Avatar tròn 48x48 */}
            <SkeletonBone variant="circle" width={48} height={48} />

            {/* Tên & Tin nhắn cuối */}
            <div className="flex-1 space-y-2 min-w-0">
              <SkeletonBone width={120} height={15} className="rounded-md" />
              <SkeletonBone width={170} height={12} className="rounded-md" />
            </div>

            {/* Thời gian & Huy hiệu tin nhắn */}
            <div className="flex flex-col items-end justify-between shrink-0 h-10 py-0.5">
              <SkeletonBone width={32} height={11} className="rounded-sm" />
              <SkeletonBone variant="circle" width={16} height={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
