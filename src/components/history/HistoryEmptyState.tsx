import React from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface HistoryEmptyStateProps {
  onCaptureClick: () => void;
  className?: string;
}

/**
 * HistoryEmptyState - Giao diện khi chưa có ảnh trong lịch sử
 * Zero border, Zero blur, Zero shadow, Low-text microcopy
 */
export const HistoryEmptyState: React.FC<HistoryEmptyStateProps> = ({
  onCaptureClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center py-20 px-6 text-center select-none',
        className
      )}
    >
      <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center mb-4">
        <Camera size={32} className="text-[#63685F]" strokeWidth={1.8} />
      </div>
      <h3 className="text-[15px] font-bold font-display text-[#141613] tracking-tight mb-1">
        Chưa có khoảnh khắc
      </h3>
      <p className="text-[13px] text-[#63685F] max-w-[240px] mb-5">
        Chụp khoảnh khắc đầu tiên để lưu lại kỷ niệm cùng bạn bè
      </p>
      <button
        type="button"
        onClick={onCaptureClick}
        className="px-5 py-2.5 rounded-full bg-[#D4EB70] text-[#141613] text-xs font-bold font-display active:scale-95 transition-transform"
      >
        Chụp ảnh ngay
      </button>
    </div>
  );
};
