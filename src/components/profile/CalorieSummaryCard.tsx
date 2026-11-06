'use client';

import React from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { SkeletonBone } from '@/components/common/SkeletonBone';

export interface CalorieSummaryCardProps {
  /** Số calories đã nạp trong ngày */
  todayCalories: number;
  /** Mục tiêu calories trong ngày (mặc định 2000) */
  targetCalories?: number;
  /** Tỷ lệ phần trăm hoàn thành mục tiêu calo */
  caloriePercentage: number;
  /** Cờ báo hiệu calo nạp đã vượt quá mục tiêu */
  calorieExceeded: boolean;
  /** Trạng thái đang tải dữ liệu ban đầu */
  isLoading?: boolean;
  /** Callback khi bấm vào thân card (mở sheet cài đặt mục tiêu) */
  onClick?: () => void;
  /** Callback khi bấm vào mũi tên xem chi tiết (chuyển sang màn hình /calorie) */
  onArrowClick?: () => void;
  className?: string;
}

export const CalorieSummaryCard: React.FC<CalorieSummaryCardProps> = ({
  todayCalories,
  targetCalories = 2000,
  caloriePercentage,
  calorieExceeded,
  isLoading = false,
  onClick,
  onArrowClick,
  className,
}) => {
  const handleClick = () => {
    haptics.click();
    onClick?.();
  };

  const showSkeleton = isLoading && todayCalories === 0;
  const progressWidth = Math.min(100, Math.max(0, caloriePercentage));
  const remainingCalories = Math.max(0, targetCalories - todayCalories);
  const exceededCalories = Math.max(0, todayCalories - targetCalories);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Thẻ năng lượng hôm nay"
      className={cn(
        'bg-surface rounded-card p-5 select-none',
        'transition-transform duration-100 ease-out cursor-pointer',
        'active:scale-[0.98] focus:outline-none',
        className
      )}
    >
      {/* Hàng 1: Icon ngọn lửa + "Năng lượng hôm nay" + Nút mũi tên chuyển sang /calorie */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[26px] h-[26px] rounded-full bg-text-primary/5 flex items-center justify-center text-text-primary">
            <Flame size={13} strokeWidth={2.2} className="fill-text-primary" />
          </div>
          <span className="text-[14px] font-medium text-text-secondary">
            Năng lượng hôm nay
          </span>
        </div>
        <button
          type="button"
          data-testid="calorie-arrow-btn"
          onClick={(e) => {
            e.stopPropagation();
            haptics.light();
            onArrowClick?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              haptics.light();
              onArrowClick?.();
            }
          }}
          className="w-8 h-8 -mr-1.5 -my-1 rounded-full flex items-center justify-center text-text-secondary/70 hover:text-text-primary active:scale-90 transition-transform cursor-pointer border-0 bg-transparent focus:outline-none"
          aria-label="Xem chi tiết màn hình năng lượng"
        >
          <ChevronRight size={15} className="stroke-[2.5]" />
        </button>
      </div>

      {showSkeleton ? (
        <div data-testid="calorie-skeleton" className="space-y-3 mt-3">
          {/* Skeleton Hàng 2: Kcal */}
          <div className="flex items-baseline gap-2">
            <SkeletonBone width={120} height={28} className="rounded-md" />
            <SkeletonBone width={90} height={16} className="rounded-md" />
          </div>

          {/* Skeleton Hàng 3: Progress Bar */}
          <SkeletonBone height={8} className="rounded-full w-full" />

          {/* Skeleton Hàng 4: Info */}
          <div className="flex justify-between items-center">
            <SkeletonBone width={80} height={13} className="rounded-md" />
            <SkeletonBone width={90} height={13} className="rounded-md" />
          </div>
        </div>
      ) : (
        <div className="space-y-3 mt-3">
          {/* Hàng 2: Số calo đã nạp / Mục tiêu */}
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold font-display text-text-primary leading-tight">
              {todayCalories} kcal
            </span>
            <span className="text-[14px] font-medium font-display text-text-secondary">
              / {targetCalories} kcal
            </span>
          </div>

          {/* Hàng 3: Thanh tiến độ LinearProgress */}
          <div className="h-2 w-full bg-gray-subtle rounded-full overflow-hidden">
            <div
              data-testid="calorie-progress-bar"
              className={cn(
                'h-full rounded-full transition-all duration-300 ease-out',
                calorieExceeded ? 'bg-error' : 'bg-primary'
              )}
              style={{ width: `${progressWidth}%` }}
            />
          </div>

          {/* Hàng 4: Tiến độ % | Còn lại / Vượt */}
          <div className="flex items-center justify-between text-[12px] font-display">
            <span className="font-semibold text-text-secondary">
              Tiến độ: {caloriePercentage}%
            </span>
            <span
              className={cn(
                'font-bold',
                calorieExceeded ? 'text-error' : 'text-[#27AE60]'
              )}
            >
              {calorieExceeded
                ? `Vượt: ${exceededCalories} kcal`
                : `Còn lại: ${remainingCalories} kcal`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
