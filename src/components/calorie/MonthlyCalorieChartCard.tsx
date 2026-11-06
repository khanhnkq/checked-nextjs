'use client';

/**
 * MonthlyCalorieChartCard Component
 * Biểu đồ Calo mini 31 ngày trong tháng với mốc mục tiêu, số ngày đạt chuẩn và calo trung bình
 * Chuẩn Parity 1:1 với MonthlyChartCard trong CalorieDashboardView.swift trên iOS
 * Tuân thủ Flat Design System: Zero Border, Zero Blur, Zero Shadow
 */

import React, { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { formatCalorieNumber } from '@/lib/utils/calorie-formatters';
import type { MonthlyCaloriePoint } from '@/types/calorie';

export interface MonthlyCalorieChartCardProps {
  /** Danh sách các điểm dữ liệu calo từng ngày trong tháng */
  points: MonthlyCaloriePoint[];
  /** Mục tiêu calo mỗi ngày */
  targetCalories: number;
  /** Số ngày đạt chuẩn calo trong tháng */
  daysOnTrack?: number;
  /** Lượng calo nạp trung bình mỗi ngày */
  averageDailyCalories?: number;
  /** Ngày hiện tại trong tháng (mặc định lấy theo Date client) */
  currentDay?: number;
  /** Callback tùy chọn khi click vào một ngày trên biểu đồ */
  onSelectDay?: (day: number) => void;
  className?: string;
}

export function MonthlyCalorieChartCard({
  points,
  targetCalories,
  daysOnTrack = 0,
  averageDailyCalories = 0,
  currentDay,
  onSelectDay,
  className = '',
}: MonthlyCalorieChartCardProps) {
  // Xác định ngày hôm nay trong tháng
  const today = useMemo(() => {
    if (typeof currentDay === 'number') return currentDay;
    return new Date().getDate();
  }, [currentDay]);

  const totalDays = points.length > 0 ? points.length : 31;

  // Tính mức calo trần để chuẩn hóa chiều cao cột
  const maxCal = useMemo(() => {
    const maxInPoints = points.length > 0
      ? Math.max(...points.map((p) => p.calories))
      : 2000;
    return Math.max(maxInPoints, targetCalories, 2000);
  }, [points, targetCalories]);

  return (
    <div
      className={`w-full p-5 bg-surface rounded-[24px] select-none text-text-primary ${className}`}
      data-testid="monthly-calorie-chart-card"
    >
      {/* 1. Header: Icon biểu đồ + Tiêu đề & Capsule nhãn "X ngày đạt chuẩn" */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={13} className="text-text-primary stroke-[2.5]" />
          <span className="text-[11px] font-bold font-display text-text-secondary tracking-[0.8px] uppercase">
            XU HƯỚNG NĂNG LƯỢNG THÁNG NÀY
          </span>
        </div>

        {daysOnTrack > 0 && (
          <span
            data-testid="days-on-track-badge"
            className="text-[11px] font-bold font-display text-text-primary bg-primary px-2 py-0.5 rounded-full"
          >
            {daysOnTrack} ngày đạt chuẩn
          </span>
        )}
      </div>

      {/* 2. Lưới cột 31 ngày (Mini Bar Chart) */}
      <div
        data-testid="monthly-bars-container"
        className="h-[105px] flex items-end justify-between gap-[3px] w-full pt-4 pb-1"
      >
        {points.map((point) => {
          const isToday = point.day === today;
          const ratio = Math.max(0, point.calories) / Math.max(maxCal, 1);
          const colHeight = Math.max(
            ratio * 75,
            point.calories > 0 ? 6 : 2
          );

          // Phối màu cột theo chuẩn iOS:
          // 0 calo: graySubtle | vượt mức: error | hôm nay: primary | bình thường: đen mờ 20%
          let barBgClass = 'bg-text-primary/20';
          if (point.calories === 0) {
            barBgClass = 'bg-graySubtle';
          } else if (point.calories > targetCalories) {
            barBgClass = 'bg-error';
          } else if (isToday) {
            barBgClass = 'bg-primary';
          }

          // Hiển thị nhãn ngày ở các mốc: 1, 6, 11, 16, 21, 26 và ngày cuối cùng
          const showDayLabel = point.day % 5 === 1 || point.day === totalDays;

          return (
            <div
              key={point.day}
              data-testid={`bar-col-${point.day}`}
              onClick={() => onSelectDay?.(point.day)}
              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              title={`Ngày ${point.day}: ${formatCalorieNumber(point.calories)} kcal`}
            >
              {/* Thân cột bo góc tròn nhẹ */}
              <div
                className={`w-full rounded-[3px] transition-all duration-300 ${barBgClass}`}
                style={{ height: `${colHeight}px` }}
              />

              {/* Nhãn ngày ở đáy */}
              <span
                className={`text-[9px] font-display pt-1 leading-none select-none ${
                  showDayLabel
                    ? isToday
                      ? 'font-black text-text-primary'
                      : 'font-semibold text-text-secondary/70'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                {point.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Chú thích Legend: Mốc mục tiêu & Lượng calo trung bình/ngày */}
      <div className="flex items-center justify-between pt-3 text-[12px] font-display border-0">
        {/* Mốc mục tiêu với chấm tròn Matcha Glow */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          <span className="font-medium">
            Mục tiêu: {formatCalorieNumber(targetCalories)} kcal
          </span>
        </div>

        {/* Lượng calo trung bình ngày */}
        {averageDailyCalories > 0 && (
          <span className="font-semibold text-text-secondary">
            Trung bình: {formatCalorieNumber(averageDailyCalories)} kcal/ngày
          </span>
        )}
      </div>
    </div>
  );
}
