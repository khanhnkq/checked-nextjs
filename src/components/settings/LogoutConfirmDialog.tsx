'use client';

import React, { useEffect, useCallback } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  onConfirmLogout: () => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
}

/**
 * LogoutConfirmDialog
 * - Xác nhận trước khi đăng xuất tài khoản trên thiết bị
 * - Tuân thủ nghiêm ngặt Checked Design System: Zero Border, Zero Shadow, Zero Blur
 * - Nút hành động Danger: #FF5252 (Coral Red), chữ trắng, font đậm, h-[52px] rounded-full
 * - Nút Hủy: #FFFFFF (Surface), text-[#141613], h-[52px] rounded-full
 * - Phản hồi xúc giác: haptics.click() trên mọi tương tác
 */
export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  isOpen,
  onDismiss,
  onConfirmLogout,
  isLoading = false,
  className,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onDismiss();
      }
    },
    [isLoading, onDismiss]
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

  const handleCancel = () => {
    if (isLoading) return;
    haptics.click();
    onDismiss();
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    haptics.click();
    await onConfirmLogout();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 select-none',
        className
      )}
    >
      {/* 1. Backdrop nền tối phẳng (Zero Blur, Zero Shadow) */}
      <div
        data-testid="logout-dialog-backdrop"
        onClick={handleCancel}
        className="fixed inset-0 bg-black/40 transition-opacity animate-in fade-in duration-200"
      />

      {/* 2. Container Dialog (Oat Milk #EDE9DF, Zero Border, Zero Shadow, Zero Blur) */}
      <div
        data-testid="logout-dialog-container"
        className="relative z-10 w-full max-w-[340px] bg-[#EDE9DF] rounded-[28px] p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
      >
        {/* Icon Coral Red */}
        <div className="w-14 h-14 rounded-full bg-[#FF5252]/10 flex items-center justify-center mb-1 text-[#FF5252]">
          <LogOut size={26} strokeWidth={2.4} />
        </div>

        {/* Tiêu đề & Nội dung */}
        <h2
          id="logout-dialog-title"
          className="text-[18px] font-bold text-[#141613] tracking-tight mt-2"
        >
          Đăng xuất tài khoản?
        </h2>

        <p className="text-[14px] text-[#5C5F56] font-medium leading-relaxed mt-1 mb-5">
          Bạn có chắc chắn muốn đăng xuất khỏi Checked trên thiết bị này?
        </p>

        {/* Action Buttons (Zero Border, Zero Shadow) */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Nút Đăng xuất - Coral Red #FF5252 */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'w-full h-[52px] bg-[#FF5252] text-white font-bold text-[16px] rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98]',
              isLoading && 'opacity-60 cursor-not-allowed active:scale-100'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang đăng xuất...</span>
              </>
            ) : (
              <span>Đăng xuất</span>
            )}
          </button>

          {/* Nút Hủy - White Surface #FFFFFF */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              'w-full h-[52px] bg-[#FFFFFF] text-[#141613] font-bold text-[16px] rounded-full flex items-center justify-center transition-transform active:scale-[0.98]',
              isLoading && 'opacity-50 cursor-not-allowed active:scale-100'
            )}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};
