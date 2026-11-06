'use client';

/**
 * TopCategoriesSection Component
 * Thẻ cuộn ngang hiển thị Top danh mục chi tiêu nhiều nhất trong tháng
 * Chuẩn Parity 1:1 với topCategoriesSection trong ExpenseDashboardView.swift
 */

import React from 'react';
import {
  Utensils,
  Coffee,
  ShoppingBag,
  Car,
  Banknote,
  CreditCard,
} from 'lucide-react';
import { formatShortCurrency, getCategoryIconName } from '@/lib/utils/expense-formatters';
import type { TopCategorySpend } from '@/types/expense';

export interface TopCategoriesSectionProps {
  /** Danh sách top danh mục chi tiêu */
  categories?: TopCategorySpend[];
}

/** Helper component render icon tương ứng với danh mục */
function CategoryIcon({ categoryName }: { categoryName?: string | null }) {
  const iconName = getCategoryIconName(categoryName);
  const iconClass = 'w-[15px] h-[15px] text-text-primary fill-current stroke-[1.5]';

  switch (iconName) {
    case 'Utensils':
      return <Utensils className={iconClass} aria-hidden="true" />;
    case 'Coffee':
      return <Coffee className={iconClass} aria-hidden="true" />;
    case 'ShoppingBag':
      return <ShoppingBag className={iconClass} aria-hidden="true" />;
    case 'Car':
      return <Car className={iconClass} aria-hidden="true" />;
    case 'Banknote':
      return <Banknote className={iconClass} aria-hidden="true" />;
    case 'CreditCard':
    default:
      return <CreditCard className={iconClass} aria-hidden="true" />;
  }
}

export function TopCategoriesSection({ categories }: TopCategoriesSectionProps) {
  // Ẩn toàn bộ section nếu không có dữ liệu danh mục (chuẩn Parity với iOS)
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section
      className="flex flex-col gap-2.5 w-full select-none"
      aria-label="Top danh mục chi tiêu"
    >
      {/* Tiêu đề mục "Danh mục" */}
      <h2 className="text-[14px] font-bold font-display text-text-secondary px-1">
        Danh mục
      </h2>

      {/* Danh sách cuộn ngang các thẻ danh mục (Zero Scrollbar) */}
      <div className="w-full flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
        {categories.map((category, index) => (
          <div
            key={category.categoryId || `${category.categoryName}-${index}`}
            className="w-[124px] h-[96px] shrink-0 p-3 bg-surface rounded-[18px] flex flex-col justify-between"
          >
            {/* Hàng trên: Icon tròn 32px + Tỷ lệ % */}
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-graySubtle flex items-center justify-center shrink-0">
                <CategoryIcon categoryName={category.categoryName} />
              </div>

              <span className="text-[12px] font-bold font-display text-text-secondary">
                {category.percentage}%
              </span>
            </div>

            {/* Hàng dưới: Tên danh mục + Số tiền ngắn gọn */}
            <div className="flex flex-col gap-0.5 items-start text-left w-full overflow-hidden">
              <span
                className="text-[13px] font-bold font-display text-text-primary truncate w-full"
                title={category.categoryName}
              >
                {category.categoryName}
              </span>

              <span className="text-[12px] font-bold font-display text-text-secondary truncate w-full">
                {formatShortCurrency(category.totalAmount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
