'use client';

/**
 * ExpenseSavingsGoalCard Component
 * Thẻ Mục tiêu tiết kiệm với tiến độ % và thanh bar 6px phẳng bo tròn
 * Chuẩn Parity 1:1 với savingsGoalCard trong ExpenseDashboardView.swift
 */

import React from 'react';
import { Flag, Pencil } from 'lucide-react';
import { formatShortCurrency } from '@/lib/utils/expense-formatters';
import { haptics } from '@/lib/utils/haptics';

export interface ExpenseSavingsGoalCardProps {
  /** Số tiền mục tiêu tiết kiệm (null hoặc <= 0 nếu chưa đặt) */
  savingsTarget?: number | null;
  /** Số tiền hiện tại đã tiết kiệm */
  currentSaved?: number;
  /** Tiến độ tiết kiệm (%) (nếu không truyền sẽ tự động tính từ currentSaved / savingsTarget) */
  savingsProgressPct?: number;
  /** Callback mở bottom sheet / modal thiết lập mục tiêu tiết kiệm */
  onOpenSavingsSetting?: () => void;
}

export function ExpenseSavingsGoalCard({
  savingsTarget,
  currentSaved = 0,
  savingsProgressPct,
  onOpenSavingsSetting,
}: ExpenseSavingsGoalCardProps) {
  const target = savingsTarget ?? 0;
  const current = currentSaved;
  const hasTarget = target > 0;

  // Tính tỷ lệ phần trăm tiến độ
  const pct =
    savingsProgressPct !== undefined
      ? savingsProgressPct
      : hasTarget
      ? Math.round((current / target) * 100)
      : 0;

  // Giới hạn chiều rộng thanh progress từ 0% đến 100%
  const progressWidth = Math.min(Math.max(pct, 0), 100);

  const handleOpenSavings = () => {
    haptics.light();
    onOpenSavingsSetting?.();
  };

  return (
    <div className="w-full p-4 bg-surface rounded-[20px] select-none text-text-primary flex flex-col gap-3">
      {/* Hàng trên: Tiêu đề + Icon cờ (rỗng nét, không fill) & Nút Sửa (icon) / Đặt mục tiêu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag size={15} strokeWidth={2.2} className="text-text-primary" />
          <span className="text-[15px] font-bold font-display text-text-primary">
            Mục tiêu tiết kiệm
          </span>
        </div>

        {hasTarget ? (
          <button
            type="button"
            onClick={handleOpenSavings}
            className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary/70 hover:text-text-primary active:scale-90 transition-transform cursor-pointer border-0 bg-transparent focus:outline-none -mr-1"
            aria-label="Sửa mục tiêu tiết kiệm"
          >
            <Pencil size={15} strokeWidth={2.2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOpenSavings}
            className="px-3 py-1.5 bg-graySubtle rounded-full text-[12px] font-bold font-display text-text-primary active:scale-95 transition-transform cursor-pointer border-0"
            aria-label="Đặt mục tiêu tiết kiệm"
          >
            Đặt mục tiêu
          </button>
        )}
      </div>

      {/* Khối nội dung tiến độ hoặc trạng thái chưa đặt */}
      {hasTarget ? (
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between text-[13px] font-bold font-display">
            <span className="text-text-primary">
              {formatShortCurrency(current)} / {formatShortCurrency(target)}
            </span>
            <span
              className={pct >= 100 ? 'text-success' : 'text-text-primary'}
            >
              {pct}%
            </span>
          </div>

          {/* Thanh tiến độ 6px phẳng bo tròn */}
          <div className="w-full h-1.5 bg-graySubtle rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressWidth}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      ) : (
        <span className="text-[13px] font-medium font-display text-text-secondary">
          Chưa đặt mục tiêu
        </span>
      )}
    </div>
  );
}
