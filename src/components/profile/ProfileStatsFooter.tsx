'use client';

import React from 'react';
import { Heart, Flame } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SkeletonBone } from '@/components/common/SkeletonBone';

export interface ProfileStatsFooterProps {
  /** Tổng số lần checked (bài đăng) */
  checkedCount: number;
  /** Số ngày duy trì chuỗi liên tục (streak) */
  streakDays: number;
  /** Trạng thái tải dữ liệu ban đầu */
  isLoading?: boolean;
  className?: string;
}

export const ProfileStatsFooter: React.FC<ProfileStatsFooterProps> = ({
  checkedCount,
  streakDays,
  isLoading = false,
  className,
}) => {
  if (isLoading && checkedCount === 0) {
    return (
      <div data-testid="stats-footer-skeleton" className={cn('inline-flex', className)}>
        <SkeletonBone width={160} height={36} className="rounded-full" />
      </div>
    );
  }

  return (
    <div
      aria-label={`Thành tích: ${checkedCount} Checked, chuỗi ${streakDays} ngày`}
      className={cn(
        'bg-text-primary/5 rounded-full px-4 py-2.5 inline-flex items-center gap-1 select-none',
        className
      )}
    >
      <Heart size={14} className="fill-primary text-primary flex-shrink-0" />
      <span className="text-[13px] font-bold font-display text-text-primary">
        {checkedCount} Checked |
      </span>
      <Flame size={14} className="fill-[#FF8A00] text-[#FF8A00] flex-shrink-0 ml-0.5" />
      <span className="text-[13px] font-bold font-display text-text-primary">
        {streakDays}d chuỗi
      </span>
    </div>
  );
};
