import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface HistoryGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * HistoryGridSkeleton - Lưới skeleton tải trước 3 cột
 * Chuẩn 1:1 tỉ lệ vuông 1:1, góc bo rounded-[14px], không border, không shadow
 */
export const HistoryGridSkeleton: React.FC<HistoryGridSkeletonProps> = ({
  count = 9,
  className,
}) => {
  return (
    <div
      role="status"
      aria-label="Đang tải lịch sử khoảnh khắc"
      className={cn('grid grid-cols-3 gap-1.5 px-2.5 w-full', className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`history-skeleton-${index}`}
          className="aspect-square rounded-[14px] bg-[#DFDACD]/60 animate-pulse"
        />
      ))}
    </div>
  );
};
