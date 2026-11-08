'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface SettingsTopBarProps {
  /** Tiêu đề thanh điều hướng (mặc định: "Cài đặt") */
  title?: string;
  /** Callback khi bấm nút quay lại */
  onBack?: () => void;
  className?: string;
}

export const SettingsTopBar: React.FC<SettingsTopBarProps> = ({
  title = 'Cài đặt',
  onBack,
  className,
}) => {
  const handleBack = () => {
    haptics.click();
    onBack?.();
  };

  return (
    <header
      className={cn(
        'w-full max-w-md mx-auto h-14 flex items-center justify-between px-4 z-20 select-none flex-shrink-0 bg-transparent',
        className
      )}
    >
      {/* Nút Quay lại 44x44px tròn */}
      <button
        type="button"
        aria-label="Quay lại"
        onClick={handleBack}
        className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform cursor-pointer focus:outline-none"
      >
        <ChevronLeft size={20} strokeWidth={2.2} />
      </button>

      {/* Tiêu đề ở giữa 18px font-bold */}
      <h1 className="text-[18px] font-bold text-text-primary text-center truncate px-2 flex-1">
        {title}
      </h1>

      {/* Spacer 44x44px bên phải để cân bằng hoàn hảo */}
      <div className="w-11 h-11" aria-hidden="true" />
    </header>
  );
};
