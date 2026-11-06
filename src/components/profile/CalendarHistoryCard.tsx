'use client';

import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { formatCurrentMonthVi } from '@/lib/utils/formatters';
import { DayCalendarData } from '@/types/profile';

export interface CalendarHistoryCardProps {
  /** Tiêu đề tháng hiển thị (vd: "Tháng 10 2026"), mặc định formatCurrentMonthVi() */
  currentMonthTitle?: string;
  /** Số ngày trong tháng (vd: 31) */
  daysInMonth: number;
  /** Dữ liệu bài đăng theo từng ngày (từ aggregateCalendarData) */
  dayCalendarData: Record<number, DayCalendarData>;
  /** Trạng thái tải dữ liệu lịch sử */
  isLoading?: boolean;
  /** Callback khi bấm vào toàn bộ thẻ (để điều hướng sang trang chi tiết /history hoặc /expense) */
  onClick?: () => void;
  /** Callback khi bấm vào một ngày cụ thể trên lưới */
  onDayClick?: (day: number, data?: DayCalendarData) => void;
  className?: string;
}

export const CalendarHistoryCard: React.FC<CalendarHistoryCardProps> = ({
  currentMonthTitle,
  daysInMonth,
  dayCalendarData,
  isLoading = false,
  onClick,
  onDayClick,
  className,
}) => {
  const monthTitle = currentMonthTitle || formatCurrentMonthVi();
  const days = Array.from({ length: Math.max(1, daysInMonth) }, (_, i) => i + 1);

  const handleCardClick = () => {
    haptics.click();
    onClick?.();
  };

  const handleDayClick = (
    e: React.MouseEvent,
    day: number,
    data?: DayCalendarData
  ) => {
    if (onDayClick) {
      e.stopPropagation();
      haptics.click();
      onDayClick(day, data);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label="Thẻ lịch sử tháng"
      className={cn(
        'bg-surface rounded-card select-none',
        'transition-transform duration-100 ease-out cursor-pointer',
        'active:scale-[0.98] focus:outline-none',
        className
      )}
    >
      {/* Header lịch tháng */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2.5">
          <div className="w-[26px] h-[26px] rounded-full bg-text-primary/5 flex items-center justify-center text-text-primary">
            <Calendar size={13} strokeWidth={2.2} />
          </div>
          <span className="text-[14px] font-medium text-text-secondary">
            {monthTitle}
          </span>
        </div>
        <ChevronRight size={14} className="text-text-secondary/70 stroke-[2.5]" />
      </div>

      {/* Lưới lịch tháng (7 cột) */}
      <div className="grid grid-cols-7 gap-2 px-5 pb-5">
        {days.map((day) => {
          const item = dayCalendarData[day];
          const hasImage = Boolean(item?.latestImageUrl);

          return (
            <div
              key={day}
              data-testid={`calendar-cell-${day}`}
              onClick={(e) => handleDayClick(e, day, item)}
              className={cn(
                'aspect-square relative rounded-[8px]',
                onDayClick && 'cursor-pointer active:scale-95 transition-transform'
              )}
            >
              {/* Nội dung ô ngày (Ảnh hoặc Nền xám mờ + Số ngày) */}
              <div className="w-full h-full rounded-[8px] overflow-hidden">
                {hasImage ? (
                  <img
                    src={item.latestImageUrl}
                    alt={`Bài đăng ngày ${day}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-text-primary/5 flex items-center justify-center">
                    <span
                      data-testid={`day-number-${day}`}
                      className="text-[11px] font-bold font-display text-text-secondary/40 select-none"
                    >
                      {day}
                    </span>
                  </div>
                )}
              </div>

              {/* Dot Badge màu xanh Matcha Glow, chữ đen đậm ở góc trên bên phải */}
              {hasImage && item.postCount > 0 && (
                <div
                  data-testid={`day-badge-${day}`}
                  className={cn(
                    'absolute -top-1 -right-1 z-10 pointer-events-none',
                    'bg-primary flex items-center justify-center',
                    item.postCount < 10
                      ? 'w-4 h-4 rounded-full'
                      : 'h-4 min-w-[16px] px-1 rounded-full'
                  )}
                >
                  <span className="text-[10px] font-extrabold font-display text-black leading-none">
                    {item.postCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
