'use client';

/**
 * MealItemRow Component
 * Hàng hiển thị một món ăn / bản ghi calo trong bữa ăn
 * Chuẩn Parity 1:1 với MealItemRowView trong CalorieDashboardView.swift trên iOS
 * Tuân thủ Flat Design System: Zero Border, Zero Blur, Zero Shadow
 */

import React from 'react';
import { UtensilsCrossed, Trash2 } from 'lucide-react';
import { formatCalorieNumber } from '@/lib/utils/calorie-formatters';
import { haptics } from '@/lib/utils/haptics';
import type { CalorieMealItem } from '@/types/calorie';

export interface MealItemRowProps {
  /** Thông tin món ăn */
  meal: CalorieMealItem;
  /** Callback khi xóa món ăn */
  onDelete?: (id: string) => void;
  className?: string;
}

export function MealItemRow({
  meal,
  onDelete,
  className = '',
}: MealItemRowProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    onDelete?.(meal.id);
  };

  const imageSrc = meal.thumbnailUrl || meal.imageUrl;
  const dishTitle = meal.dishName && meal.dishName.trim().length > 0
    ? meal.dishName
    : 'Món ăn';

  return (
    <div
      data-testid={`meal-item-row-${meal.id}`}
      className={`flex items-center gap-3 py-1 select-none ${className}`}
    >
      {/* 1. Thumbnail ảnh món hoặc icon dĩa thìa phẳng */}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={dishTitle}
          className="w-[38px] h-[38px] rounded-[10px] object-cover flex-shrink-0 bg-graySubtle"
          loading="lazy"
        />
      ) : (
        <div className="w-[38px] h-[38px] rounded-[10px] bg-graySubtle flex items-center justify-center flex-shrink-0 text-text-secondary">
          <UtensilsCrossed size={14} className="stroke-[2.2]" />
        </div>
      )}

      {/* 2. Tên món & Ghi chú (nếu có) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className="text-[14px] font-semibold font-display text-text-primary truncate">
          {dishTitle}
        </span>
        {meal.note && meal.note.trim().length > 0 && (
          <span className="text-[11px] font-display text-text-secondary truncate mt-0.5">
            {meal.note}
          </span>
        )}
      </div>

      {/* 3. Lượng calo nạp */}
      <span className="text-[13px] font-bold font-display text-text-primary flex-shrink-0">
        +{formatCalorieNumber(meal.calories)} kcal
      </span>

      {/* 4. Nút xóa món ăn */}
      <button
        type="button"
        onClick={handleDelete}
        className="p-1.5 text-text-secondary/50 hover:text-error active:scale-90 transition-all cursor-pointer border-0 bg-transparent focus:outline-none -mr-1"
        aria-label={`Xóa ${dishTitle}`}
      >
        <Trash2 size={13} className="stroke-[2.2]" />
      </button>
    </div>
  );
}
