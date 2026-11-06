'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BaseBottomSheet, BottomSheetCard } from '@/components/sheets/BaseBottomSheet';
import { haptics } from '@/lib/utils/haptics';

export interface BudgetSettingSheetProps {
  /** Cờ bật/tắt hiển thị Bottom Sheet */
  isOpen: boolean;
  /** Callback đóng Bottom Sheet */
  onDismiss: () => void;
  /** Tiêu đề tháng (tùy chọn) */
  monthTitle?: string;
  /** Hạn mức chi tiêu hiện tại */
  currentBudgetLimit?: number | null;
  /** Ngưỡng phần trăm cảnh báo hiện tại (50 - 100) */
  currentAlertPct?: number;
  /** Mục tiêu tiết kiệm hiện tại */
  currentSavingsTarget?: number | null;
  /** Callback lưu dữ liệu ngân sách */
  onSave: (
    budgetLimit: number,
    alertPct: number,
    savingsTarget: number | null
  ) => Promise<boolean> | boolean;
  className?: string;
}

export const BudgetSettingSheet: React.FC<BudgetSettingSheetProps> = ({
  isOpen,
  onDismiss,
  currentBudgetLimit,
  currentAlertPct = 80,
  currentSavingsTarget,
  onSave,
  className,
}) => {
  const [budgetText, setBudgetText] = useState<string>(
    currentBudgetLimit && currentBudgetLimit > 0
      ? String(Math.round(currentBudgetLimit))
      : ''
  );
  const [alertPct, setAlertPct] = useState<number>(currentAlertPct ?? 80);
  const [goalText, setGoalText] = useState<string>(
    currentSavingsTarget && currentSavingsTarget > 0
      ? String(Math.round(currentSavingsTarget))
      : ''
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setBudgetText(
        currentBudgetLimit && currentBudgetLimit > 0
          ? String(Math.round(currentBudgetLimit))
          : ''
      );
      setAlertPct(currentAlertPct ?? 80);
      setGoalText(
        currentSavingsTarget && currentSavingsTarget > 0
          ? String(Math.round(currentSavingsTarget))
          : ''
      );
      setIsSaving(false);
    }
  }, [isOpen, currentBudgetLimit, currentAlertPct, currentSavingsTarget]);

  const handleSave = async () => {
    if (isSaving) return;

    const cleanBudget = budgetText.replace(/\./g, '').replace(/,/g, '').trim();
    const limit = Number(cleanBudget);
    if (!cleanBudget || isNaN(limit) || limit <= 0) {
      haptics.light();
      return;
    }

    const cleanGoal = goalText.replace(/\./g, '').replace(/,/g, '').trim();
    const targetGoal =
      cleanGoal && !isNaN(Number(cleanGoal)) && Number(cleanGoal) > 0
        ? Number(cleanGoal)
        : null;

    try {
      setIsSaving(true);
      const success = await onSave(limit, Math.round(alertPct), targetGoal);
      if (success) {
        haptics.medium();
        onDismiss();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title="Ngân sách & Tiết kiệm"
      icon={<SlidersHorizontal size={18} strokeWidth={2.2} />}
      actionTitle={isSaving ? 'Đang lưu...' : 'Lưu thiết lập'}
      onAction={handleSave}
      className={className}
    >
      <div className="space-y-3.5">
        {/* Section 1: Hạn mức chi tiêu tháng */}
        <BottomSheetCard title="HẠN MỨC CHI TIÊU THÁNG">
          <div className="flex items-baseline gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={budgetText}
              onChange={(e) => setBudgetText(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent text-[28px] font-bold font-display text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
            />
            <span className="text-[20px] font-bold font-display text-text-secondary">
              ₫
            </span>
          </div>
        </BottomSheetCard>

        {/* Section 2: Ngưỡng cảnh báo chi tiêu (%) */}
        <BottomSheetCard
          title={`CẢNH BÁO KHI CHI TIÊU ĐẠT ${Math.round(alertPct)}%`}
        >
          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={alertPct}
              onChange={(e) => {
                haptics.light();
                setAlertPct(Number(e.target.value));
              }}
              className="w-full h-2 bg-gray-subtle rounded-lg appearance-none cursor-pointer accent-[#D4EB70]"
            />
            <div className="flex justify-between items-center text-[11px] font-display">
              <span className="font-medium text-text-secondary">50%</span>
              <span className="font-semibold text-text-primary">
                80% (Khuyên dùng)
              </span>
              <span className="font-medium text-text-secondary">100%</span>
            </div>
          </div>
        </BottomSheetCard>

        {/* Section 3: Mục tiêu tiết kiệm tháng */}
        <BottomSheetCard title="MỤC TIÊU TIẾT KIỆM (TÙY CHỌN)">
          <div className="flex items-baseline gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0 (Không bắt buộc)"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent text-[24px] font-bold font-display text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
            />
            <span className="text-[18px] font-bold font-display text-text-secondary">
              ₫
            </span>
          </div>
        </BottomSheetCard>
      </div>
    </BaseBottomSheet>
  );
};
