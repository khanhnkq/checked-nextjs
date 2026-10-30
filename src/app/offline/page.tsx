'use client';

import React from 'react';
import { WifiOff, RotateCcw } from 'lucide-react';
import { AppLogo, PrimaryButton } from '@/components/common';

/**
 * OfflinePage
 * Trang hiển thị khi người dùng truy cập ứng dụng trong trạng thái không có kết nối internet.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      data-testid="offline-page"
      className="flex flex-col items-center justify-between min-h-screen px-6 py-12 max-w-md mx-auto pt-safe pb-safe bg-[#EDE9DF]"
    >
      <div className="w-full flex justify-center mt-8">
        <AppLogo size={96} priority />
      </div>

      <div className="flex flex-col items-center text-center gap-3 my-auto">
        <div className="w-16 h-16 rounded-full bg-[#DFDACD] flex items-center justify-center text-[#141613]">
          <WifiOff size={28} strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-extrabold font-display text-[#141613] tracking-tight">
          Ngoại tuyến
        </h1>
        <p className="text-sm font-medium text-[#63685F] max-w-[260px] tracking-tight">
          Không có kết nối mạng. Hãy kiểm tra lại Wi-Fi hoặc dữ liệu di động.
        </p>
      </div>

      <div className="w-full">
        <PrimaryButton onClick={handleRetry} data-testid="offline-retry-btn">
          <span className="flex items-center justify-center gap-2">
            <RotateCcw size={18} />
            <span>Thử lại</span>
          </span>
        </PrimaryButton>
      </div>
    </div>
  );
}
