'use client';

/**
 * CalorieHeroCard Component
 * Thẻ Hero hiển thị Năng lượng hôm nay, số calo lớn 36px, icon Edit cố định bên phải,
 * thanh tiến độ 8px phẳng và trạng thái Còn lại / Vượt.
 * Chuẩn Parity 1:1 với HeroCalorieCard trong CalorieDashboardView.swift trên iOS.
 * Tuân thủ Flat Design System: Zero Border, Zero Blur, Zero Shadow.
 */

import React from 'react';
import { Flame, Pencil, AlertTriangle } from 'lucide-react';
import {
  formatCalorieNumber,
  formatDisplayCalorieDate,
} from '@/lib/utils/calorie-formatters';
import { haptics } from '@/lib/utils/haptics';

export interface CalorieHeroCardProps {
  /** Lượng calo đã nạp hôm nay */
  consumedCalories: number;
  /** Mục tiêu calo hàng ngày */
  targetCalories: number;
  /** Số calo còn lại (hoặc số âm nếu đã vượt) */
  remainingCalories: number;
  /** Cờ báo hiệu nạp vượt mục tiêu */
  isExceeded: boolean;
  /** Tỷ lệ tiến độ từ 0.0 đến 1.0 (dùng cho thanh bar) */
  progressRatio: number;
  /** Phần trăm tiến độ (0 - 100+%) */
  progressPct: number;
  /** Ngày đang được chọn xem (mặc định hôm nay) */
  selectedDate?: Date | string;
  /** Callback mở Bottom Sheet thiết lập mục tiêu calo */
  onOpenGoalSetting?: () => void;
  className?: string;
}

export function CalorieHeroCard({
  consumedCalories,
  targetCalories,
  remainingCalories,
  isExceeded,
  progressRatio,
  progressPct,
  selectedDate = new Date(),
  onOpenGoalSetting,
  className = '',
}: CalorieHeroCardProps) {
  const handleOpenGoal = () => {
    haptics.light();
    onOpenGoalSetting?.();
  };

  const displayDate = formatDisplayCalorieDate(selectedDate).toUpperCase();
  const progressWidth = Math.min(Math.max(progressRatio * 100, 0), 100);
  const exceededDiff = Math.max(0, consumedCalories - targetCalories);

  return (
    <div
      className={`w-full p-5 bg-surface rounded-[24px] select-none text-text-primary ${className}`}
      data-testid="calorie-hero-card"
    >
      {/* 1. Tiêu đề nhỏ: Icon Ngọn lửa cam + NĂNG LƯỢNG HÔM NAY • {NGÀY} */}
      <div className="flex items-center gap-1.5">
        <Flame size={13} className="text-[#FF9500] fill-[#FF9500]" />
        <span className="text-[11px] font-bold font-display text-text-secondary tracking-[0.8px] uppercase">
          NĂNG LƯỢNG HÔM NAY • {displayDate}
        </span>
      </div>

      {/* 2. Hàng số calo lớn 36px + đơn vị kcal & Icon Edit cố định bên phải */}
      <div className="flex items-center justify-between w-full pt-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[36px] font-black font-display text-text-primary tracking-tight leading-none">
            {formatCalorieNumber(consumedCalories)}
          </span>
          <span className="text-[18px] font-bold font-display text-text-secondary">
            kcal
          </span>
        </div>

        {/* Nút Icon Edit mở Bottom Sheet thiết lập mục tiêu calo */}
        <button
          type="button"
          onClick={handleOpenGoal}
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary/70 hover:text-text-primary active:scale-90 transition-transform cursor-pointer border-0 bg-transparent focus:outline-none -mr-1"
          aria-label="Chỉnh sửa mục tiêu calo"
        >
          <Pencil size={16} strokeWidth={2.2} />
        </button>
      </div>

      {/* 3. Thanh tiến độ Calo phẳng 8px */}
      <div className="w-full h-2 bg-graySubtle rounded-full overflow-hidden mt-3.5">
        <div
          data-testid="calorie-progress-bar"
          className={`h-full rounded-full transition-all duration-300 ${
            isExceeded ? 'bg-error' : 'bg-primary'
          }`}
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {/* 4. Nhãn tiến độ: Còn lại / Vượt & Phần trăm */}
      <div className="flex items-center justify-between pt-2 text-[12px] font-display">
        {isExceeded ? (
          <div className="flex items-center gap-1.5 text-error">
            <AlertTriangle size={13} className="stroke-[2.5]" />
            <span className="font-bold">
              Vượt {formatCalorieNumber(exceededDiff)} kcal
            </span>
          </div>
        ) : (
          <span className="font-semibold text-text-secondary">
            Còn lại {formatCalorieNumber(remainingCalories)} kcal (Mục tiêu{' '}
            {formatCalorieNumber(targetCalories)})
          </span>
        )}

        <span
          className={`font-bold ${
            isExceeded ? 'text-error' : 'text-text-primary'
          }`}
        >
          {progressPct}%
        </span>
      </div>
    </div>
  );
}
