'use client';

/**
 * MealSectionCard Component
 * Thẻ hiển thị một bữa ăn trong ngày (Sáng, Trưa, Phụ, Tối)
 * Tự động nhận diện bữa hiện tại, hiển thị tổng calo, nút thêm nhanh (+) và danh sách món
 * Chuẩn Parity 1:1 với MealSectionCard trong CalorieDashboardView.swift trên iOS
 * Tuân thủ Flat Design System: Zero Border, Zero Blur, Zero Shadow
 */

import React, { useMemo } from 'react';
import { Coffee, Sun, Moon, UtensilsCrossed, Plus } from 'lucide-react';
import { MealItemRow } from './MealItemRow';
import {
  getMealTypeMeta,
  formatCalorieNumber,
} from '@/lib/utils/calorie-formatters';
import { haptics } from '@/lib/utils/haptics';
import type { MealType, CalorieMealItem } from '@/types/calorie';

export interface MealSectionCardProps {
  /** Loại bữa ăn */
  type: MealType;
  /** Danh sách món ăn trong bữa này */
  items: CalorieMealItem[];
  /** Cờ báo hiệu bữa ăn này đang diễn ra theo đồng hồ thực tế */
  isCurrentMealNow?: boolean;
  /** Callback khi bấm nút thêm nhanh (+) cho bữa */
  onQuickAdd?: (type: MealType) => void;
  /** Callback khi xóa một món ăn trong bữa */
  onDeleteMeal?: (id: string) => void;
  className?: string;
}

export function MealSectionCard({
  type,
  items,
  isCurrentMealNow = false,
  onQuickAdd,
  onDeleteMeal,
  className = '',
}: MealSectionCardProps) {
  const typeMeta = useMemo(() => getMealTypeMeta(type), [type]);

  // Tính tổng calo trong bữa
  const totalCalories = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.calories || 0), 0);
  }, [items]);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    onQuickAdd?.(type);
  };

  // Icon tương ứng cho từng bữa ăn
  const renderMealIcon = () => {
    switch (type) {
      case 'BREAKFAST':
        return <Coffee size={13} strokeWidth={2.2} />;
      case 'LUNCH':
        return <Sun size={13} strokeWidth={2.2} />;
      case 'DINNER':
        return <Moon size={13} strokeWidth={2.2} />;
      case 'SNACK':
      default:
        return <UtensilsCrossed size={13} strokeWidth={2.2} />;
    }
  };

  return (
    <div
      data-testid={`meal-section-${type.toLowerCase()}`}
      className={`w-full bg-surface rounded-[20px] select-none text-text-primary ${className}`}
    >
      {/* 1. Header Bữa Ăn */}
      <div className="flex items-center justify-between p-4">
        {/* Cụm trái: Icon bữa + Tên bữa + Badge "Hiện tại" / Khung giờ */}
        <div className="flex items-center gap-2.5">
          <div className="w-[26px] h-[26px] rounded-full bg-text-primary/5 flex items-center justify-center text-text-primary flex-shrink-0">
            {renderMealIcon()}
          </div>

          <span className="text-[15px] font-bold font-display text-text-primary">
            {typeMeta.displayName}
          </span>

          {isCurrentMealNow ? (
            <span
              data-testid="current-meal-badge"
              className="px-2 py-0.5 bg-primary text-text-primary rounded-full text-[10px] font-black font-display uppercase tracking-wider"
            >
              Hiện tại
            </span>
          ) : (
            <span className="text-[11px] font-medium font-display text-text-secondary/80">
              {typeMeta.timeRangeDescription}
            </span>
          )}
        </div>

        {/* Cụm phải: Tổng calo & Nút thêm nhanh (+) */}
        <div className="flex items-center gap-2">
          {totalCalories > 0 && (
            <span className="text-[14px] font-bold font-display text-text-primary">
              {formatCalorieNumber(totalCalories)} kcal
            </span>
          )}

          <button
            type="button"
            onClick={handleAddClick}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 border-0 cursor-pointer focus:outline-none ${
              isCurrentMealNow
                ? 'bg-primary text-text-primary'
                : 'bg-graySubtle text-text-primary'
            }`}
            aria-label={`Thêm món vào ${typeMeta.displayName}`}
          >
            <Plus size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. Danh sách các món ăn trong bữa (nếu có) */}
      {items.length > 0 && (
        <div className="px-4 pb-4 space-y-2.5">
          {items.map((meal) => (
            <MealItemRow
              key={meal.id}
              meal={meal}
              onDelete={onDeleteMeal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
