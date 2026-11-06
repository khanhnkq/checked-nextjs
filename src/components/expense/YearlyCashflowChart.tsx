'use client';

/**
 * YearlyCashflowChart Component
 * Bộ điều khiển dòng tiền 12 tháng cả năm (T1 - T12) dạng Mini Dual-Bars
 * Chuẩn Parity 1:1 với yearlyCashflowSection trong ExpenseDashboardView.swift
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';
import type { MonthlyCashflowPoint } from '@/types/expense';

export interface YearlyCashflowChartProps {
  /** Năm đang xem (ví dụ: 2026) */
  currentYear: number;
  /** Khóa tháng đang chọn định dạng yyyyMM (ví dụ: "202610") */
  currentMonthKey: string;
  /** Danh sách 12 điểm tháng chuẩn T1 đến T12 */
  yearlyPoints: MonthlyCashflowPoint[];
  /** Callback khi người dùng chọn một tháng cụ thể */
  onSelectMonth: (monthKey: string) => void;
  /** Callback khi người dùng chuyển năm (-1 hoặc +1) */
  onChangeYear: (offset: number) => void;
}

export function YearlyCashflowChart({
  currentYear,
  currentMonthKey,
  yearlyPoints,
  onSelectMonth,
  onChangeYear,
  }: YearlyCashflowChartProps) {
  // Tính toán giá trị lớn nhất an toàn để căn chỉnh tỷ lệ chiều cao cột
  const safeMax = useMemo(() => {
    if (!yearlyPoints || yearlyPoints.length === 0) return 1;
    const maxVal = Math.max(
      ...yearlyPoints.map((p) => Math.max(p.income || 0, p.expense || 0)),
      0
    );
    return Math.max(maxVal, 1);
  }, [yearlyPoints]);

  const handlePrevYear = () => {
    haptics.light();
    onChangeYear(-1);
  };

  const handleNextYear = () => {
    haptics.light();
    onChangeYear(1);
  };

  const handleSelectMonth = (monthKey: string) => {
    haptics.selection();
    onSelectMonth(monthKey);
  };

  return (
    <div className="w-full p-4 bg-surface rounded-[20px] select-none text-text-primary">
      {/* 1. Hàng chuyển năm & Chú thích (Legend) */}
      <div className="flex items-center justify-between mb-3">
        {/* Nút chuyển năm: < Dòng tiền 2026 > */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevYear}
            className="w-7 h-7 bg-graySubtle rounded-full flex items-center justify-center text-text-primary active:scale-95 transition-transform"
            aria-label="Năm trước"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <span className="text-[15px] font-bold font-display text-text-primary tracking-tight">
            Dòng tiền {currentYear}
          </span>

          <button
            type="button"
            onClick={handleNextYear}
            className="w-7 h-7 bg-graySubtle rounded-full flex items-center justify-center text-text-primary active:scale-95 transition-transform"
            aria-label="Năm sau"
          >
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Legend: Thu (Matcha Glow) & Chi (Đen) */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[11px] font-bold font-display text-text-primary">Thu</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-black" />
            <span className="text-[11px] font-bold font-display text-text-primary">Chi</span>
          </div>
        </div>
      </div>

      {/* 2. Lưới 12 tháng Mini Dual-bars (T1 - T12) */}
      <div className="flex items-end justify-between gap-1 pt-1">
        {yearlyPoints.map((point) => {
          const isCurrent = point.monthKey === currentMonthKey;
          // Chiều cao thanh: tối thiểu 3px, tối đa 44px
          const incomeHeight = Math.max(((point.income || 0) / safeMax) * 44, 3);
          const expenseHeight = Math.max(((point.expense || 0) / safeMax) * 44, 3);

          return (
            <button
              key={point.monthKey}
              type="button"
              onClick={() => handleSelectMonth(point.monthKey)}
              className={`flex-1 flex flex-col items-center justify-end rounded-lg py-1 px-0.5 transition-all active:scale-95 ${
                isCurrent ? 'bg-secondary' : 'bg-transparent hover:bg-graySubtle/40'
              }`}
              aria-label={`Tháng ${point.monthIndex}, thu ${point.income}, chi ${point.expense}`}
              aria-current={isCurrent ? 'date' : undefined}
            >
              {/* Cặp thanh Mini Dual-bars */}
              <div className="h-12 flex items-end justify-center gap-[2px] pb-1">
                {/* Thanh Thu (Matcha Glow) */}
                <div
                  className="w-1 rounded-[2px] bg-primary transition-all duration-300"
                  style={{ height: `${incomeHeight}px` }}
                />
                {/* Thanh Chi (Đen) */}
                <div
                  className="w-1 rounded-[2px] bg-black transition-all duration-300"
                  style={{ height: `${expenseHeight}px` }}
                />
              </div>

              {/* Tên viết tắt tháng (T1 .. T12) */}
              <span
                className={`text-[10px] font-display leading-none transition-colors ${
                  isCurrent
                    ? 'font-bold text-text-primary'
                    : 'font-medium text-text-secondary'
                }`}
              >
                {point.monthName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
