'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface BaseBottomSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

/**
 * BaseBottomSheet (Khung Modal Đáy Phẳng Chuẩn 1:1 iOS)
 * - Nền Oat Milk `#EDE9DF`, bo góc trên 32px
 * - Thanh grabber capsule 38x5px
 * - Header tiêu đề + icon + nút đóng X tròn
 * - Thân cuộn mượt mà với các thẻ BottomSheetCard
 * - Nút hành động chính Matcha Glow `#D4EB70` cao 52px
 * - Tuân thủ tuyệt đối quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */
export const BaseBottomSheet: React.FC<BaseBottomSheetProps> = ({
  isOpen,
  onDismiss,
  title,
  subtitle,
  icon,
  actionTitle,
  onAction,
  children,
  className,
  containerClassName,
}) => {
  // Lắng nghe phím ESC để đóng sheet
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        haptics.light();
        onDismiss();
      }
    },
    [onDismiss]
  );

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleClose = () => {
    haptics.light();
    onDismiss();
  };

  const handleAction = () => {
    haptics.medium();
    if (onAction) {
      onAction();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn('fixed inset-0 z-50 flex flex-col justify-end', className)}
    >
      {/* 1. Backdrop nền tối tương phản phẳng (Zero Blur) */}
      <div
        data-testid="bottom-sheet-backdrop"
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 transition-opacity animate-in fade-in duration-200"
      />

      {/* 2. Container Sheet trượt từ đáy */}
      <div
        data-testid="bottom-sheet-container"
        className={cn(
          'relative z-10 w-full max-w-lg mx-auto bg-[#EDE9DF] rounded-t-[32px] overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250 ease-out',
          containerClassName
        )}
      >
        {/* Thanh Grabber kéo modal chuẩn iOS */}
        <div className="w-full pt-2.5 pb-2 flex justify-center">
          <div
            data-testid="bottom-sheet-grabber"
            className="w-[38px] h-[5px] bg-black/20 rounded-full"
          />
        </div>

        {/* Header: Icon + Tiêu đề + Phụ đề + Nút Đóng */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="flex items-center gap-2 text-[#141613]">
            {icon && (
              <span className="flex items-center justify-center text-[#141613]">
                {icon}
              </span>
            )}
            <div className="flex flex-col">
              <h2 className="text-[17px] font-bold text-[#141613] tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <span className="text-[13px] font-medium text-[#63685F]">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full bg-black/5 active:bg-black/10 flex items-center justify-center text-[#141613]/60 hover:text-[#141613] transition-colors"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Nội dung chính cuộn dọc */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3.5">
          {children}

          {/* Nút hành động chính (Matcha Glow 52px) */}
          {actionTitle && onAction && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAction}
                className="w-full h-[52px] bg-[#D4EB70] text-[#141613] font-bold text-[16px] rounded-full flex items-center justify-center active:scale-[0.98] transition-transform"
              >
                {actionTitle}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface BottomSheetCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * BottomSheetCard (Thẻ nội dung trắng chuẩn dùng trong Bottom Sheets)
 * Nền Surface White `#FFFFFF`, bo tròn 22px, không border, không shadow.
 */
export const BottomSheetCard: React.FC<BottomSheetCardProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <div
      data-testid="bottom-sheet-card"
      className={cn(
        'w-full bg-white rounded-[22px] p-[18px] flex flex-col gap-2.5',
        className
      )}
    >
      {title && (
        <span className="text-[11px] font-bold text-[#141613]/50 uppercase tracking-wider">
          {title}
        </span>
      )}
      {children}
    </div>
  );
};
