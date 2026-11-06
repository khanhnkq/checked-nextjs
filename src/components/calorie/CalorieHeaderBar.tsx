'use client';

/**
 * CalorieHeaderBar Component
 * Header bar phẳng với nút Back tròn 44x44px, tiêu đề "Năng lượng" và nút capsule "Thêm món"
 * Chuẩn Parity 1:1 với headerBar trong CalorieDashboardView.swift trên iOS
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';

export interface CalorieHeaderBarProps {
  /** Callback khi bấm nút Back (mặc định router.back()) */
  onBack?: () => void;
  /** Callback khi bấm nút Thêm món */
  onQuickAdd?: () => void;
  /** Tiêu đề thanh điều hướng (mặc định "Năng lượng") */
  title?: string;
}

export function CalorieHeaderBar({
  onBack,
  onQuickAdd,
  title = 'Năng lượng',
}: CalorieHeaderBarProps) {
  const router = useRouter();

  const handleBack = () => {
    haptics.light();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleQuickAdd = () => {
    haptics.medium();
    onQuickAdd?.();
  };

  return (
    <header className="w-full h-14 flex items-center justify-between px-4 z-20 select-none bg-transparent">
      {/* Cụm bên trái: Nút Back tròn 44x44px & Tiêu đề Năng lượng */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="w-11 h-11 bg-surface rounded-full flex items-center justify-center text-text-primary active:scale-90 transition-transform cursor-pointer border-0 focus:outline-none"
          aria-label="Quay lại"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h1 className="text-[22px] font-bold font-display text-text-primary tracking-tight">
          {title}
        </h1>
      </div>

      {/* Cụm bên phải: Nút Capsule Thêm món Matcha Glow */}
      <button
        type="button"
        onClick={handleQuickAdd}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-text-primary rounded-full text-[13px] font-bold font-display active:scale-95 transition-transform cursor-pointer border-0 focus:outline-none shadow-none"
        aria-label="Thêm món ăn"
      >
        <Plus size={14} className="stroke-[2.5]" />
        <span>Thêm món</span>
      </button>
    </header>
  );
}
