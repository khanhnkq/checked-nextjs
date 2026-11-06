'use client';

import React from 'react';
import { CreditCard, ChevronRight, Flag, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { formatCurrency } from '@/lib/utils/formatters';
import { SkeletonBone } from '@/components/common/SkeletonBone';

export interface BudgetSummaryCardProps {
  /** Tổng số tiền đã chi tiêu trong tháng */
  totalSpent: number;
  /** Hạn mức chi tiêu tháng (null nếu chưa thiết lập) */
  budgetLimit: number | null;
  /** Tỷ lệ phần trăm ngân sách đã dùng */
  percentUsed: number;
  /** Số tiền còn lại trong hạn mức */
  remaining: number;
  /** Cờ báo hiệu chi tiêu đã vượt hạn mức */
  isBudgetExceeded: boolean;
  /** Ngưỡng phần trăm cảnh báo chi tiêu (mặc định 80%) */
  alertPct?: number;
  /** Mục tiêu tiết kiệm tháng (nếu có) */
  savingsTarget?: number | null;
  /** Trạng thái đang tải dữ liệu ban đầu */
  isLoading?: boolean;
  /** Callback khi bấm vào card (mở sheet cài đặt hạn mức) */
  onClick?: () => void;
  /** Callback khi bấm vào mũi tên xem chi tiết (chuyển sang màn hình /expense) */
  onArrowClick?: () => void;
  className?: string;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  totalSpent,
  budgetLimit,
  percentUsed,
  remaining,
  isBudgetExceeded,
  alertPct = 80,
  savingsTarget,
  isLoading = false,
  onClick,
  onArrowClick,
  className,
}) => {
  const handleClick = () => {
    haptics.click();
    onClick?.();
  };

  const hasLimit = budgetLimit !== null && budgetLimit > 0;
  const showWarning = hasLimit && percentUsed >= alertPct && !isBudgetExceeded;
  const showSavings = savingsTarget !== null && savingsTarget !== undefined && savingsTarget > 0;
  const showSkeleton = isLoading && totalSpent === 0 && budgetLimit === null;

  const progressWidth = Math.min(100, Math.max(0, percentUsed));

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
      aria-label="Thẻ chi tiêu tháng này"
      className={cn(
        'bg-surface rounded-card p-5 select-none',
        'transition-transform duration-100 ease-out cursor-pointer',
        'active:scale-[0.98] focus:outline-none',
        className
      )}
    >
      {/* Hàng 1: Icon ví + "Chi tiêu tháng này" + Nút mũi tên chuyển sang /expense */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[26px] h-[26px] rounded-full bg-text-primary/5 flex items-center justify-center text-text-primary">
            <CreditCard size={13} strokeWidth={2.2} />
          </div>
          <span className="text-[14px] font-medium text-text-secondary">
            Chi tiêu tháng này
          </span>
        </div>
        <button
          type="button"
          data-testid="budget-arrow-btn"
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
          aria-label="Xem chi tiết màn hình chi tiêu"
        >
          <ChevronRight size={15} className="stroke-[2.5]" />
        </button>
      </div>

      {showSkeleton ? (
        <div data-testid="budget-skeleton" className="space-y-3 mt-3">
          {/* Skeleton Hàng 2: Số tiền */}
          <div className="flex items-baseline gap-2">
            <SkeletonBone width={140} height={28} className="rounded-md" />
            <SkeletonBone width={110} height={16} className="rounded-md" />
          </div>

          {/* Skeleton Hàng 3: Progress Bar */}
          <SkeletonBone height={8} className="rounded-full w-full" />

          {/* Skeleton Hàng 4: Info */}
          <div className="flex justify-between items-center">
            <SkeletonBone width={80} height={13} className="rounded-md" />
            <SkeletonBone width={100} height={13} className="rounded-md" />
          </div>
        </div>
      ) : (
        <div className="space-y-3 mt-3">
          {/* Hàng 2: Số tiền đã chi / Hạn mức */}
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold font-display text-text-primary leading-tight">
              {formatCurrency(totalSpent)}
            </span>
            <span className="text-[14px] font-medium font-display text-text-secondary">
              {hasLimit ? `/ ${formatCurrency(budgetLimit)}` : '/ Chưa đặt hạn mức'}
            </span>
          </div>

          {/* Hàng 3: Thanh tiến độ LinearProgress */}
          <div className="h-2 w-full bg-gray-subtle rounded-full overflow-hidden">
            <div
              data-testid="budget-progress-bar"
              className={cn(
                'h-full rounded-full transition-all duration-300 ease-out',
                isBudgetExceeded ? 'bg-error' : 'bg-primary'
              )}
              style={{ width: `${hasLimit ? progressWidth : 0}%` }}
            />
          </div>

          {/* Hàng 4: Tiến độ % & Còn lại / Vượt hoặc Hướng dẫn */}
          <div className="flex items-center justify-between text-[12px] font-display">
            {hasLimit ? (
              <>
                <span className="font-semibold text-text-secondary">
                  Tiến độ: {Math.round(percentUsed)}%
                </span>
                <span
                  className={cn(
                    'font-bold',
                    remaining >= 0 ? 'text-[#27AE60]' : 'text-error'
                  )}
                >
                  {remaining >= 0
                    ? `Còn lại: ${formatCurrency(remaining)}`
                    : `Vượt: ${formatCurrency(Math.abs(remaining))}`}
                </span>
              </>
            ) : (
              <span className="text-[13px] font-medium text-text-secondary">
                Chạm để xem chi tiết & thiết lập hạn mức
              </span>
            )}
          </div>

          {/* Hàng 5: Thông tin mục tiêu tiết kiệm (nếu có) */}
          {showSavings && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <Flag size={12} className="text-text-primary fill-text-primary" />
              <span className="text-[12px] font-medium font-display text-text-secondary">
                Mục tiêu tiết kiệm: {formatCurrency(savingsTarget)}
              </span>
            </div>
          )}

          {/* Hàng 6: Cảnh báo ngưỡng chi tiêu */}
          {showWarning && (
            <div
              data-testid="budget-warning"
              className="flex items-center gap-1.5 pt-0.5 text-error"
            >
              <AlertTriangle size={12} strokeWidth={2.5} />
              <span className="text-[12px] font-semibold font-display">
                Đã chạm ngưỡng cảnh báo {alertPct}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
