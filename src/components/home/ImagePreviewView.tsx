'use client';

import React from 'react';
import { Download, Send, Sparkles, Trash2, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface CapturedPhotoData {
  blob: Blob;
  dataUrl: string;
  width?: number;
  height?: number;
}

export interface ImagePreviewViewProps {
  photo: CapturedPhotoData;
  onDismiss: () => void;
  onSend?: () => void;
  isSending?: boolean;
  className?: string;
}

/**
 * ImagePreviewView (Màn hình xem trước ảnh chụp)
 * Khung nhìn xem trước 1:1, bóc tách thẻ thông minh AI và bảng điều khiển gửi ảnh.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const ImagePreviewView: React.FC<ImagePreviewViewProps> = ({
  photo,
  onDismiss,
  onSend,
  isSending = false,
  className,
}) => {
  const handleDismiss = () => {
    haptics.click();
    onDismiss();
  };

  const handleDownload = () => {
    haptics.click();
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `checked-${Date.now()}.jpg`;
    a.click();
  };

  const handleSend = () => {
    if (isSending) return;
    haptics.heavy();
    if (onSend) {
      onSend();
    }
  };

  return (
    <div
      data-testid="image-preview-view"
      className={cn(
        'relative w-full h-dvh max-w-[430px] mx-auto bg-[#EDE9DF] flex flex-col justify-between items-center select-none overflow-hidden animate-fadeIn',
        className
      )}
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 14px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
    >
      {/* 1. TOP BAR (Height 44px - Đồng bộ với HomeTopBar & iOS ImagePreviewView) */}
      <header className="w-full flex items-center justify-between px-5 h-[44px] flex-shrink-0">
        {/* Nút Hủy (✕) */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Hủy và chụp lại"
          className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <X size={20} className="text-[#141613]" strokeWidth={2.4} />
        </button>

        {/* Gemini Brand Pill */}
        <div
          data-testid="gemini-brand-pill"
          className="w-[144px] h-[44px] rounded-full bg-white flex items-center justify-center gap-1.5"
        >
          <Sparkles size={16} className="text-[#141613]" />
          <span className="text-[15px] font-bold font-display text-[#141613] tracking-tight">
            Gemini
          </span>
        </div>

        {/* Nút Tải về */}
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Tải ảnh về máy"
          className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <Download size={20} className="text-[#141613]" strokeWidth={2.4} />
        </button>
      </header>

      {/* 2. KHUNG ẢNH VUÔNG 1:1 TRÙNG KHÍT VIEW FINDER (max 390px, bo góc 32px) */}
      <main className="w-full flex justify-center px-[18px] flex-shrink-0">
        <div className="w-full max-w-[390px] aspect-square rounded-[32px] bg-[#141613] relative overflow-hidden select-none flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.dataUrl}
            alt="Khoảnh khắc vừa chụp"
            className="w-full h-full object-cover"
          />
        </div>
      </main>

      {/* 3. VÙNG ACTION PILLS (Placeholder tinh gọn sẵn sàng kết nối Phase 2 & 3) */}
      <section
        data-testid="preview-action-row"
        className="w-full flex items-center justify-center px-5 flex-shrink-0"
      >
        <div className="px-4 py-2 rounded-full bg-[#DFDACD]/70 text-[#141613] text-xs font-bold font-display">
          Chụp thành công
        </div>
      </section>

      {/* 4. BOTTOM CONTROLS (Thùng rác - Nút Gửi Matcha Glow 86px - Chọn Bạn bè) */}
      <footer className="w-full flex flex-col items-center gap-2 px-[28px] flex-shrink-0">
        <div className="w-full flex items-center justify-between">
          {/* Nút Hủy / Xóa ảnh (52x52px) */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Xóa ảnh và chụp lại"
            className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
          >
            <Trash2 size={22} className="text-[#141613]" strokeWidth={2.2} />
          </button>

          {/* NÚT GỬI MATCHA GLOW 3 LỚP (86x86px) */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            aria-label="Gửi khoảnh khắc"
            className="relative inline-flex items-center justify-center select-none outline-none flex-shrink-0 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-[86px] h-[86px] rounded-full bg-white flex items-center justify-center">
              <div className="w-[78px] h-[78px] rounded-full bg-[#DFDACD]/60 flex items-center justify-center">
                <div className="w-[66px] h-[66px] rounded-full bg-[#D4EB70] flex items-center justify-center">
                  <Send size={24} className="text-[#141613] ml-0.5" strokeWidth={2.4} />
                </div>
              </div>
            </div>
          </button>

          {/* Nút Chọn Bạn bè (52x52px) */}
          <button
            type="button"
            aria-label="Chọn người nhận"
            className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
          >
            <Users size={22} className="text-[#141613]" strokeWidth={2.2} />
          </button>
        </div>

        {/* Microcopy hướng dẫn dưới nút gửi */}
        <span className="text-[12px] font-semibold font-display text-[#63685F] text-center">
          Gửi cho bạn bè
        </span>
      </footer>
    </div>
  );
};
