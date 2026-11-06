'use client';

/**
 * ExpenseHeroSummaryCard Component
 * Thẻ Hero tổng chi tiêu tháng, thanh tiến độ ngân sách 8px và 3 cột tài chính
 * Chuẩn Parity 1:1 với heroSummaryCard trong ExpenseDashboardView.swift
 */

import React from 'react';
import { AlertTriangle, Pencil } from 'lucide-react';
import { formatCurrency, formatShortCurrency } from '@/lib/utils/expense-formatters';
import { haptics } from '@/lib/utils/haptics';
import type { ExpenseDashboardSummary } from '@/types/expense';

export interface ExpenseHeroSummaryCardProps {
  /** Dữ liệu tổng hợp chi tiêu */
  summary: ExpenseDashboardSummary;
  /** Tiêu đề tháng hiển thị (ví dụ: "Tháng 10, 2026") */
  monthTitle: string;
  /** Callback mở bottom sheet thiết lập ngân sách */
  onOpenBudgetSetting?: () => void;
}

export function ExpenseHeroSummaryCard({
  summary,
  monthTitle,
  onOpenBudgetSetting,
}: ExpenseHeroSummaryCardProps) {
  const {
    totalIncome,
    totalExpense,
    netCashflow,
    budgetLimit,
    budgetUsedPct,
    isBudgetExceeded,
  } = summary;

  const handleOpenBudget = () => {
    haptics.light();
    onOpenBudgetSetting?.();
  };

  // Tính tỷ lệ thanh tiến độ (tối đa 100%)
  const progressPercent = budgetLimit && budgetLimit > 0
    ? Math.min(Math.max(budgetUsedPct, 0), 100)
    : 0;

  return (
    <div className="w-full p-5 bg-surface rounded-[24px] select-none text-text-primary">
      {/* 1. Tiêu đề tháng uppercase & Tổng chi tiêu kèm icon Edit cố định bên phải */}
      <div className="flex flex-col items-start gap-1 w-full">
        <span className="text-[11px] font-bold font-display text-text-secondary tracking-[0.8px] uppercase">
          TỔNG CHI TIÊU • {monthTitle.toUpperCase()}
        </span>

        <div className="flex items-center justify-between w-full pt-1">
          <span className="text-[34px] font-black font-display text-text-primary tracking-tight leading-none">
            {formatCurrency(totalExpense)}
          </span>

          <button
            type="button"
            onClick={handleOpenBudget}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary/70 hover:text-text-primary active:scale-90 transition-transform cursor-pointer border-0 bg-transparent focus:outline-none -mr-1"
            aria-label="Chỉnh sửa ngân sách"
          >
            <Pencil size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 2. Thanh tiến độ Ngân sách (Nút bấm chạm để thiết lập) */}
      <button
        type="button"
        onClick={handleOpenBudget}
        className="w-full flex flex-col items-start gap-2 pt-4 group active:opacity-85 transition-opacity"
        aria-label={
          budgetLimit && budgetLimit > 0
            ? isBudgetExceeded
              ? `Vượt ngân sách ${budgetUsedPct}%`
              : `Đã chi ${budgetUsedPct}% ngân sách`
            : 'Thiết lập ngân sách'
        }
      >
        {/* Thanh tiến độ 8px phẳng bo tròn */}
        <div className="w-full h-2 bg-graySubtle rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isBudgetExceeded ? 'bg-error' : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Nhãn tiến độ & cảnh báo dưới thanh bar */}
        <div className="flex items-center gap-1.5 text-left">
          {budgetLimit && budgetLimit > 0 ? (
            isBudgetExceeded ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-error stroke-[2.5]" />
                <span className="text-[12px] font-bold font-display text-error">
                  Vượt {budgetUsedPct}%
                </span>
              </>
            ) : (
              <span className="text-[12px] font-semibold font-display text-text-secondary">
                Đã chi {budgetUsedPct}% ({formatShortCurrency(budgetLimit)})
              </span>
            )
          ) : (
            <span className="text-[12px] font-bold font-display text-text-primary">
              Thiết lập ngân sách
            </span>
          )}
        </div>
      </button>

      {/* 3. Ba Cột Chỉ Số Tài Chính: Thu nhập | Chi tiêu | Thuần (Khoảng trắng tự nhiên, Không divider) */}
      <div className="flex items-center justify-between gap-3 pt-4 border-0">
        {/* Cột 1: Thu nhập */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-medium font-display text-text-secondary">
            Thu nhập
          </span>
          <span className="text-[15px] font-bold font-display text-success truncate w-full">
            +{formatShortCurrency(totalIncome)}
          </span>
        </div>

        {/* Cột 2: Chi tiêu */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-medium font-display text-text-secondary">
            Chi tiêu
          </span>
          <span className="text-[15px] font-bold font-display text-text-primary truncate w-full">
            -{formatShortCurrency(totalExpense)}
          </span>
        </div>

        {/* Cột 3: Thuần */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-medium font-display text-text-secondary">
            Thuần
          </span>
          <span
            className={`text-[15px] font-bold font-display truncate w-full ${
              netCashflow >= 0 ? 'text-text-primary' : 'text-error'
            }`}
          >
            {netCashflow >= 0 ? '+' : ''}
            {formatShortCurrency(netCashflow)}
          </span>
        </div>
      </div>
    </div>
  );
}
