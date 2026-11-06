'use client';

/**
 * ReceiptPhotoModal Component
 * Modal xem ảnh hóa đơn / biên lai phóng to toàn màn hình
 * Chuẩn Parity 1:1 với photoPreviewOverlay trong ExpenseDashboardView.swift
 */

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';

export interface ReceiptPhotoModalProps {
  /** Đường dẫn URL của ảnh hóa đơn phóng to (null hoặc rỗng thì không hiển thị) */
  imageUrl: string | null;
  /** Callback đóng modal */
  onClose: () => void;
}

export function ReceiptPhotoModal({ imageUrl, onClose }: ReceiptPhotoModalProps) {
  const isOpen = Boolean(imageUrl && imageUrl.trim().length > 0);

  const handleClose = useCallback(() => {
    haptics.light();
    onClose();
  }, [onClose]);

  // Lắng nghe phím ESC để đóng modal và khoá cuộn màn hình
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleClose]);

  if (!isOpen || !imageUrl) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh hóa đơn phóng to"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 bg-black/85 select-none animate-in fade-in duration-200"
    >
      {/* 1. Header: Nút đóng X màu trắng góc trên bên phải */}
      <div className="w-full flex justify-end">
        <button
          type="button"
          onClick={handleClose}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer border-0"
          aria-label="Đóng xem ảnh"
        >
          <X className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>

      {/* 2. Container hiển thị ảnh phóng to ở trung tâm */}
      <div
        className="w-full flex-1 flex items-center justify-center px-4 py-2"
        onClick={handleBackdropClick}
      >
        <img
          src={imageUrl}
          alt="Ảnh hóa đơn phóng to"
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-[75vh] object-contain rounded-[24px] shadow-none"
        />
      </div>

      {/* 3. Đệm cân bằng dưới */}
      <div className="w-full h-11 shrink-0 pointer-events-none" aria-hidden="true" />
    </div>
  );
}
