'use client';

import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { BaseBottomSheet, BottomSheetCard } from '@/components/sheets/BaseBottomSheet';
import { haptics } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

export interface CalorieGoalSettingSheetProps {
  /** Cờ bật/tắt hiển thị Bottom Sheet */
  isOpen: boolean;
  /** Callback đóng Bottom Sheet */
  onDismiss: () => void;
  /** Mục tiêu calo hiện tại (mặc định 2000) */
  currentTarget?: number;
  /** Callback lưu mục tiêu calo */
  onSave: (targetCalories: number) => Promise<boolean> | boolean;
  className?: string;
}

const QUICK_PRESETS = [1500, 1800, 2000, 2200, 2500];

export const CalorieGoalSettingSheet: React.FC<CalorieGoalSettingSheetProps> = ({
  isOpen,
  onDismiss,
  currentTarget = 2000,
  onSave,
  className,
}) => {
  const [targetInput, setTargetInput] = useState<string>(
    currentTarget && currentTarget > 0 ? String(currentTarget) : '2000'
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTargetInput(
        currentTarget && currentTarget > 0 ? String(currentTarget) : '2000'
      );
      setIsSaving(false);
    }
  }, [isOpen, currentTarget]);

  const handleSave = async () => {
    if (isSaving) return;

    const cleanVal = targetInput.replace(/\D/g, '').trim();
    const val = Number(cleanVal);
    if (!cleanVal || isNaN(val) || val <= 0) {
      haptics.light();
      return;
    }

    try {
      setIsSaving(true);
      const success = await onSave(val);
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
      title="Mục tiêu năng lượng"
      icon={<Flame size={18} className="fill-[#FF8A00] text-[#FF8A00]" />}
      actionTitle={isSaving ? 'Đang lưu...' : 'Lưu mục tiêu'}
      onAction={handleSave}
      className={className}
    >
      <div className="space-y-3.5">
        {/* Section 1: Nhập số calo mục tiêu */}
        <BottomSheetCard title="MỤC TIÊU NĂNG LƯỢNG (KCAL)">
          <div className="flex items-baseline gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="2000"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent text-[28px] font-bold font-display text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
            />
            <span className="text-[16px] font-bold font-display text-text-secondary whitespace-nowrap">
              kcal / ngày
            </span>
          </div>
        </BottomSheetCard>

        {/* Section 2: Gợi ý nhanh */}
        <BottomSheetCard title="GỢI Ý PHỔ BIẾN">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_PRESETS.map((preset) => {
              const isSelected = targetInput === String(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setTargetInput(String(preset));
                  }}
                  className={cn(
                    'h-8 px-3 rounded-full text-[13px] font-bold font-display select-none',
                    'active:scale-95 transition-all flex items-center justify-center',
                    isSelected
                      ? 'bg-primary text-black'
                      : 'bg-gray-subtle text-text-secondary hover:text-text-primary'
                  )}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </BottomSheetCard>
      </div>
    </BaseBottomSheet>
  );
};
