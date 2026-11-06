'use client';

/**
 * CalorieDashboardSkeleton Component
 * Giao diện Skeleton Shimmer mô phỏng 100% bố cục của CalorieDashboardView
 * Đảm bảo Zero Layout Shift khi dữ liệu chưa có trong cache
 * Chuẩn Parity 1:1 với CalorieDashboardSkeletonView.swift trên iOS
 */

import React from 'react';

export function CalorieDashboardSkeleton() {
  return (
    <div
      className="w-full flex flex-col space-y-4 px-4 pb-12 pt-14 select-none"
      role="status"
      aria-label="Đang nạp dữ liệu năng lượng..."
      data-testid="calorie-dashboard-skeleton"
    >
      {/* 1. Hero Calorie Card Skeleton */}
      <div
        data-testid="hero-calorie-skeleton"
        className="w-full p-5 bg-surface rounded-[24px] space-y-4 animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="w-[180px] h-3 bg-graySubtle rounded" />
          <div className="w-5 h-5 rounded-full bg-graySubtle" />
        </div>

        <div className="flex items-baseline gap-2 pt-1">
          <div className="w-[140px] h-9 bg-graySubtle rounded-lg" />
          <div className="w-10 h-5 bg-graySubtle rounded" />
        </div>

        <div className="space-y-2 pt-1">
          <div className="w-full h-2 bg-graySubtle rounded-full" />
          <div className="flex items-center justify-between">
            <div className="w-[160px] h-3 bg-graySubtle rounded" />
            <div className="w-10 h-3 bg-graySubtle rounded" />
          </div>
        </div>
      </div>

      {/* 2. Monthly Calorie Chart Card Skeleton */}
      <div
        data-testid="monthly-chart-skeleton"
        className="w-full p-5 bg-surface rounded-[24px] space-y-4 animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="w-[200px] h-3 bg-graySubtle rounded" />
          <div className="w-[100px] h-6 rounded-full bg-graySubtle" />
        </div>

        {/* Giả lập lưới cột ngày */}
        <div className="h-[90px] flex items-end justify-between gap-1 pt-2">
          {Array.from({ length: 24 }).map((_, idx) => (
            <div
              key={idx}
              className="flex-1 bg-graySubtle rounded-t-[3px]"
              style={{ height: `${20 + (idx % 5) * 15}%` }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="w-[120px] h-3 bg-graySubtle rounded" />
          <div className="w-[120px] h-3 bg-graySubtle rounded" />
        </div>
      </div>

      {/* 3. Bữa ăn Skeleton (4 khung thẻ đại diện) */}
      <div data-testid="meals-skeleton" className="space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="w-full p-4 bg-surface rounded-[20px] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-graySubtle" />
              <div className="space-y-1.5">
                <div className="w-[90px] h-4 bg-graySubtle rounded" />
                <div className="w-[70px] h-3 bg-graySubtle rounded" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-14 h-4 bg-graySubtle rounded" />
              <div className="w-7 h-7 rounded-full bg-graySubtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
