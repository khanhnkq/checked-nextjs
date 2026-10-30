'use client';

import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';
import { BaseBottomSheet, BottomSheetCard } from './BaseBottomSheet';

export interface CalorieEditSheetProps {
  isOpen: boolean;
  initialCalories?: number | null;
  initialCalorieText?: string | null;
  onConfirm: (calories: number, formattedText: string) => void;
  onDismiss: () => void;
  className?: string;
}

const QUICK_CALORIES: number[] = [250, 400, 550, 700, 850, 1000];

/**
 * Trích xuất số calo nguyên từ chuỗi hoặc số (e.g. "620 kcal · 30g Đạm" -> 620)
 */
export function parseCalorieToNumber(val?: string | number | null): number {
  if (typeof val === 'number') return Math.max(0, Math.floor(val));
  if (!val) return 0;
  // Lấy cụm số đầu tiên đứng trước kcal hoặc chuỗi số đầu tiên
  const match = String(val).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Format chuỗi calo chuẩn (e.g. 620 -> "620 kcal")
 */
export function formatCalorieText(calories: number): string {
  return `${calories} kcal`;
}

/**
 * CalorieEditSheet (Chỉnh sửa lượng Calo ước tính chuẩn 1:1 iOS)
 * - Ô nhập số calo lớn 34px hỗ trợ bàn phím số
 * - Dải chọn nhanh mức Calo thông dụng: 250, 400, 550, 700, 850, 1000 kcal
 * - Tuân thủ tuyệt đối quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */
export const CalorieEditSheet: React.FC<CalorieEditSheetProps> = ({
  isOpen,
  initialCalories,
  initialCalorieText,
  onConfirm,
  onDismiss,
  className,
}) => {
  const [calorieString, setCalorieString] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const parsed = initialCalories ?? parseCalorieToNumber(initialCalorieText);
      setCalorieString(parsed > 0 ? String(parsed) : '');
    }
  }, [isOpen, initialCalories, initialCalorieText]);

  const currentNumeric = parseCalorieToNumber(calorieString);

  const handlePresetClick = (val: number) => {
    haptics.light();
    setCalorieString(String(val));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/[^\d]/g, '');
    setCalorieString(digitsOnly);
  };

  const handleConfirm = () => {
    const numeric = parseCalorieToNumber(calorieString);
    if (numeric > 0) {
      haptics.medium();
      onConfirm(numeric, formatCalorieText(numeric));
    }
    onDismiss();
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title="Lượng Calo ước tính"
      icon={<Flame size={18} strokeWidth={2.4} />}
      actionTitle="Xác nhận & Cập nhật"
      onAction={handleConfirm}
      className={className}
    >
      {/* 1. Card Ô nhập calo lớn */}
      <BottomSheetCard title="LƯỢNG CALO (KCAL)">
        <div className="flex items-baseline gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={calorieString}
            onChange={handleInputChange}
            placeholder="0"
            aria-label="Nhập lượng calo"
            autoFocus
            className="w-full bg-transparent text-[34px] font-black text-[#141613] outline-none placeholder:text-[#141613]/25"
          />
          <span className="text-[20px] font-bold text-[#141613]/50 shrink-0">
            kcal
          </span>
        </div>
      </BottomSheetCard>

      {/* 2. Card Các nút gợi ý chọn nhanh mức calo */}
      <BottomSheetCard title="CHỌN NHANH MỨC CALO">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_CALORIES.map((val) => {
            const isSelected = currentNumeric === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => handlePresetClick(val)}
                className={`shrink-0 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#D4EB70] text-[#141613]'
                    : 'bg-[#F4F1EA] text-[#141613]/70 hover:bg-[#EDE9DF]'
                }`}
              >
                <Flame size={12} strokeWidth={2.4} />
                <span>~{val} kcal</span>
              </button>
            );
          })}
        </div>
      </BottomSheetCard>
    </BaseBottomSheet>
  );
};
