'use client';

import React from 'react';
import { SkeletonBone } from '@/components/common/SkeletonBone';
import { cn } from '@/lib/utils/cn';

export interface FriendRequestsSkeletonProps {
  className?: string;
  cardsCount?: number;
}

/**
 * FriendRequestsSkeleton (Skeleton Loading cho Màn hình Lời mời kết bạn)
 * - Mô phỏng thanh hạn mức bạn thân CloseFriendsQuotaBar
 * - Mô phỏng 4 thẻ lời mời kết bạn FriendRequestCard
 * - Tận dụng component SkeletonBone đồng bộ hiệu ứng chuyển động mượt mà
 */
export const FriendRequestsSkeleton: React.FC<FriendRequestsSkeletonProps> = ({
  className,
  cardsCount = 4,
}) => {
  return (
    <div
      data-testid="friend-requests-skeleton"
      className={cn('space-y-4 w-full select-none', className)}
    >
      {/* 1. Skeleton cho thanh Quota */}
      <div className="bg-surface rounded-[16px] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <SkeletonBone width={120} height={14} />
          <SkeletonBone width={42} height={14} />
        </div>
        <SkeletonBone width="100%" height={6} className="rounded-full" />
      </div>

      {/* 2. Skeleton cho danh sách thẻ lời mời kết bạn */}
      <div className="space-y-2.5">
        {Array.from({ length: cardsCount }).map((_, index) => (
          <div
            key={index}
            className="bg-surface rounded-[18px] px-3.5 py-3 flex items-center gap-3"
          >
            {/* Avatar tròn 48x48 */}
            <SkeletonBone variant="circle" width={48} height={48} />

            {/* Thông tin 2 dòng */}
            <div className="flex-1 space-y-1.5 min-w-0">
              <SkeletonBone width={130} height={15} />
              <SkeletonBone width={85} height={12} />
            </div>

            {/* 2 Nút thao tác tròn 36x36 */}
            <div className="flex items-center gap-2 shrink-0">
              <SkeletonBone variant="circle" width={36} height={36} />
              <SkeletonBone variant="circle" width={36} height={36} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
