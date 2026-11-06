'use client';

/**
 * ExpenseHeaderBar Component
 * Header bar phẳng với nút Back tròn 44x44px nền trắng và tiêu đề "Chi tiêu"
 * Chuẩn Parity 1:1 với headerBar trong ExpenseDashboardView.swift
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';

export interface ExpenseHeaderBarProps {
  /** Callback khi bấm nút Back (mặc định router.back()) */
  onBack?: () => void;
  /** Tiêu đề thanh điều hướng (mặc định "Chi tiêu") */
  title?: string;
}

export function ExpenseHeaderBar({ onBack, title = 'Chi tiêu' }: ExpenseHeaderBarProps) {
  const router = useRouter();

  const handleBack = () => {
    haptics.light();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="w-full h-14 flex items-center px-4 z-20 select-none bg-transparent">
      <div className="flex items-center gap-3">
        {/* Nút Back tròn 44x44px nền trắng, icon màu đen */}
        <button
          type="button"
          onClick={handleBack}
          className="w-11 h-11 bg-surface rounded-full flex items-center justify-center text-text-primary active:scale-95 transition-transform"
          aria-label="Quay lại"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Tiêu đề trang bo tròn đậm nét */}
        <h1 className="text-[22px] font-bold font-display text-text-primary tracking-tight">
          {title}
        </h1>
      </div>
    </header>
  );
}
