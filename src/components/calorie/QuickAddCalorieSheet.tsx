'use client';

/**
 * QuickAddCalorieSheet Component
 * Bottom Sheet thêm nhanh món ăn / lượng calo vào bữa ăn trong ngày
 * Chuẩn Parity 1:1 với QuickAddCalorieSheet.swift trên iOS
 * Tuân thủ Flat Design System: Zero Border, Zero Blur, Zero Shadow
 */

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Flame } from 'lucide-react';
import { BaseBottomSheet, BottomSheetCard } from '@/components/sheets/BaseBottomSheet';
import {
  getCurrentMealType,
  getMealTypeMeta,
} from '@/lib/utils/calorie-formatters';
import { haptics } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';
import { MEAL_TYPES } from '@/types/calorie';
import type { MealType } from '@/types/calorie';

export interface QuickAddCalorieSheetProps {
  /** Cờ bật/tắt Bottom Sheet */
  isOpen: boolean;
  /** Callback đóng Bottom Sheet */
  onDismiss: () => void;
  /** Bữa ăn khởi tạo (mặc định nhận diện theo đồng hồ thực tế) */
  initialMealType?: MealType;
  /** Callback ghi nhận món ăn */
  onAdd: (
    calories: number,
    mealType: MealType,
    dishName?: string
  ) => Promise<boolean> | boolean;
  className?: string;
}

const QUICK_CALORIE_PRESETS = [150, 250, 350, 500, 700];

export const QuickAddCalorieSheet: React.FC<QuickAddCalorieSheetProps> = ({
  isOpen,
  onDismiss,
  initialMealType,
  onAdd,
  className,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    () => initialMealType ?? getCurrentMealType()
  );
  const [calorieInput, setCalorieInput] = useState<string>('350');
  const [dishNameInput, setDishNameInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedMealType(initialMealType ?? getCurrentMealType());
      setCalorieInput('350');
      setDishNameInput('');
      setIsSaving(false);
    }
  }, [isOpen, initialMealType]);

  const handleAdd = async () => {
    if (isSaving) return;

    const cleanVal = calorieInput.replace(/\D/g, '').trim();
    const cal = Number(cleanVal);
    if (!cleanVal || isNaN(cal) || cal <= 0) {
      haptics.light();
      return;
    }

    try {
      setIsSaving(true);
      const trimmedName = dishNameInput.trim();
      const success = await onAdd(
        cal,
        selectedMealType,
        trimmedName.length > 0 ? trimmedName : undefined
      );

      if (success) {
        onDismiss();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const meta = getMealTypeMeta(selectedMealType);

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title={`Thêm vào ${meta.displayName}`}
      icon={<UtensilsCrossed size={18} strokeWidth={2.2} />}
      actionTitle={isSaving ? 'Đang thêm...' : 'Thêm món'}
      onAction={handleAdd}
      className={className}
    >
      <div className="space-y-3.5">
        {/* Section 1: Chọn bữa ăn (Tự động theo giờ) */}
        <BottomSheetCard title="BỮA ĂN (TỰ ĐỘNG THEO GIỜ)">
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_TYPES.map((m) => {
              const itemMeta = getMealTypeMeta(m);
              const isSelected = selectedMealType === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setSelectedMealType(m);
                  }}
                  className={cn(
                    'py-2 px-1 rounded-[10px] text-[12px] font-bold font-display select-none',
                    'active:scale-95 transition-all flex items-center justify-center text-center cursor-pointer border-0',
                    isSelected
                      ? 'bg-primary text-text-primary'
                      : 'bg-gray-subtle text-text-secondary hover:text-text-primary'
                  )}
                >
                  {itemMeta.displayName}
                </button>
              );
            })}
          </div>
        </BottomSheetCard>

        {/* Section 2: Nhập số calo */}
        <BottomSheetCard title="NĂNG LƯỢNG (KCAL)">
          <div className="flex items-baseline gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="350"
              value={calorieInput}
              onChange={(e) =>
                setCalorieInput(e.target.value.replace(/\D/g, ''))
              }
              className="w-full bg-transparent text-[28px] font-black font-display text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
            />
            <span className="text-[16px] font-bold font-display text-text-secondary whitespace-nowrap">
              kcal
            </span>
          </div>
        </BottomSheetCard>

        {/* Section 3: Chọn nhanh mức calo */}
        <BottomSheetCard title="CHỌN NHANH">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_CALORIE_PRESETS.map((val) => {
              const isSelected = calorieInput === String(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setCalorieInput(String(val));
                  }}
                  className={cn(
                    'h-8 px-3 rounded-full text-[13px] font-bold font-display select-none',
                    'active:scale-95 transition-all flex items-center gap-1 cursor-pointer border-0',
                    isSelected
                      ? 'bg-primary text-text-primary'
                      : 'bg-gray-subtle text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Flame size={11} className={isSelected ? 'fill-current' : ''} />
                  <span>+{val}</span>
                </button>
              );
            })}
          </div>
        </BottomSheetCard>

        {/* Section 4: Tên món ăn (Tùy chọn) */}
        <BottomSheetCard title="TÊN MÓN ĂN (TÙY CHỌN)">
          <input
            type="text"
            placeholder="Ví dụ: Bánh mì, Phở bò, Cà phê..."
            value={dishNameInput}
            onChange={(e) => setDishNameInput(e.target.value)}
            className="w-full bg-transparent text-[15px] font-medium font-display text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
          />
        </BottomSheetCard>
      </div>
    </BaseBottomSheet>
  );
};
