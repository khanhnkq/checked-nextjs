'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Soup, Coffee, Cookie, Flame, Leaf } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';
import { BaseBottomSheet, BottomSheetCard } from './BaseBottomSheet';

export interface FoodEditSheetProps {
  isOpen: boolean;
  initialDishName?: string | null;
  initialCategory?: string | null;
  onConfirm: (dishName: string, category: string) => void;
  onDismiss: () => void;
  className?: string;
}

export const FOOD_CATEGORIES = [
  { label: 'Món ăn', icon: Utensils },
  { label: 'Món nước & Sợi', icon: Soup },
  { label: 'Đồ uống & Cafe', icon: Coffee },
  { label: 'Bánh & Ăn vặt', icon: Cookie },
  { label: 'Món chiên & Nhanh', icon: Flame },
  { label: 'Món chay', icon: Leaf },
];

/**
 * Xóa toàn bộ emoji trong chuỗi để tên món ăn chuẩn sạch (tương đồng iOS cleanDishName)
 */
export function removeEmojis(str: string): string {
  if (!str) return '';
  return str
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    )
    .trim();
}

/**
 * FoodEditSheet (Chỉnh sửa tên món ăn & danh mục ẩm thực chuẩn 1:1 iOS)
 * - Ô nhập tên món ăn tiếng Việt (tự động loại bỏ emoji)
 * - Dải chọn danh mục ẩm thực: Món ăn, Món nước & Sợi, Đồ uống & Cafe, Bánh & Ăn vặt, v.v.
 * - Tuân thủ tuyệt đối quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */
export const FoodEditSheet: React.FC<FoodEditSheetProps> = ({
  isOpen,
  initialDishName = '',
  initialCategory = 'Món ăn',
  onConfirm,
  onDismiss,
  className,
}) => {
  const [dishName, setDishName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Món ăn');

  useEffect(() => {
    if (isOpen) {
      setDishName(removeEmojis(initialDishName || ''));
      setSelectedCategory(initialCategory || 'Món ăn');
    }
  }, [isOpen, initialDishName, initialCategory]);

  const handleCategorySelect = (cat: string) => {
    haptics.light();
    setSelectedCategory(cat);
  };

  const handleConfirm = () => {
    const cleaned = removeEmojis(dishName);
    if (cleaned) {
      haptics.medium();
      onConfirm(cleaned, selectedCategory);
    }
    onDismiss();
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title="Món ăn & Đồ uống"
      icon={<Utensils size={18} strokeWidth={2.4} />}
      actionTitle="Xác nhận & Cập nhật"
      onAction={handleConfirm}
      className={className}
    >
      {/* 1. Card Ô nhập tên món ăn */}
      <BottomSheetCard title="TÊN MÓN ĂN (KHÔNG CHỨA EMOJI)">
        <input
          type="text"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          placeholder="Ví dụ: Gà rán giòn, Phở bò tái..."
          aria-label="Tên món ăn"
          autoFocus
          className="w-full bg-transparent text-[16px] font-semibold text-[#141613] outline-none placeholder:text-[#141613]/30"
        />
      </BottomSheetCard>

      {/* 2. Card Danh mục ẩm thực */}
      <BottomSheetCard title="DANH MỤC">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FOOD_CATEGORIES.map(({ label, icon: Icon }) => {
            const isSelected = selectedCategory === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleCategorySelect(label)}
                className={`shrink-0 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#D4EB70] text-[#141613]'
                    : 'bg-[#F4F1EA] text-[#141613]/70 hover:bg-[#EDE9DF]'
                }`}
              >
                <Icon size={13} strokeWidth={2.4} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheetCard>
    </BaseBottomSheet>
  );
};
