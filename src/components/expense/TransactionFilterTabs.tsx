'use client';

/**
 * TransactionFilterTabs Component
 * Bộ 3 tabs capsule lọc giao dịch: Tất cả | Chi tiêu | Thu nhập
 * Chuẩn Parity 1:1 với filterTabsSection trong ExpenseDashboardView.swift
 */

import React from 'react';
import { haptics } from '@/lib/utils/haptics';
import type { TransactionFilterOption } from '@/types/expense';

export interface TransactionFilterTabsProps {
  /** Bộ lọc đang được chọn */
  selectedFilter: TransactionFilterOption;
  /** Callback khi người dùng chuyển bộ lọc */
  onSelectFilter: (filter: TransactionFilterOption) => void;
}

interface FilterTabItem {
  id: TransactionFilterOption;
  label: string;
}

const FILTER_ITEMS: FilterTabItem[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'EXPENSE', label: 'Chi tiêu' },
  { id: 'INCOME', label: 'Thu nhập' },
];

export function TransactionFilterTabs({
  selectedFilter,
  onSelectFilter,
}: TransactionFilterTabsProps) {
  const handleSelect = (filter: TransactionFilterOption) => {
    if (filter === selectedFilter) return;
    haptics.light();
    onSelectFilter(filter);
  };

  return (
    <div
      role="tablist"
      aria-label="Bộ lọc giao dịch"
      className="flex items-center gap-2 py-0.5 select-none w-full overflow-x-auto no-scrollbar"
    >
      {FILTER_ITEMS.map((tab) => {
        const isSelected = tab.id === selectedFilter;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`panel-${tab.id.toLowerCase()}`}
            onClick={() => handleSelect(tab.id)}
            className={`px-4 py-2 rounded-full text-[13px] font-display transition-all active:scale-95 duration-150 shrink-0 ${
              isSelected
                ? 'bg-primary text-text-primary font-bold shadow-none'
                : 'bg-surface text-text-secondary font-medium hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
