'use client';

/**
 * ExpenseDashboardSkeleton Component
 * Giao diện Skeleton Shimmer mô phỏng 100% bố cục của ExpenseDashboardView
 * Đảm bảo Zero Layout Shift khi dữ liệu chưa có trong cache
 * Chuẩn Parity 1:1 với ExpenseDashboardSkeletonView.swift
 */

import React from 'react';

export function ExpenseDashboardSkeleton() {
  return (
    <div
      className="w-full flex flex-col space-y-4 px-4 pb-12 pt-14 select-none"
      role="status"
      aria-label="Đang nạp dữ liệu chi tiêu..."
    >
      {/* 1. Hero Summary Card Skeleton */}
      <div
        data-testid="hero-summary-skeleton"
        className="w-full p-5 bg-surface rounded-[24px] space-y-4 animate-pulse"
      >
        {/* Tiêu đề & Tổng chi tiêu */}
        <div className="space-y-2">
          <div className="w-[150px] h-3 bg-graySubtle rounded" />
          <div className="w-[220px] h-9 bg-graySubtle rounded-lg" />
        </div>

        {/* Thanh tiến độ Ngân sách */}
        <div className="space-y-2 pt-1">
          <div className="w-full h-2 bg-graySubtle rounded-full" />
          <div className="w-[140px] h-3 bg-graySubtle rounded" />
        </div>

        {/* 3 Cột chỉ số: Thu nhập | Chi tiêu | Thuần */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex-1 space-y-1.5">
            <div className="w-12 h-3 bg-graySubtle rounded" />
            <div className="w-20 h-4 bg-graySubtle rounded" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="w-12 h-3 bg-graySubtle rounded" />
            <div className="w-20 h-4 bg-graySubtle rounded" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="w-12 h-3 bg-graySubtle rounded" />
            <div className="w-20 h-4 bg-graySubtle rounded" />
          </div>
        </div>
      </div>

      {/* 2. Savings Goal Card Skeleton */}
      <div
        data-testid="savings-goal-skeleton"
        className="w-full p-4 bg-surface rounded-[20px] space-y-3 animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-graySubtle" />
            <div className="w-[130px] h-4 bg-graySubtle rounded" />
          </div>
          <div className="w-[50px] h-6 rounded-full bg-graySubtle" />
        </div>

        <div className="w-full h-1.5 bg-graySubtle rounded-full" />

        <div className="flex items-center justify-between">
          <div className="w-[110px] h-3 bg-graySubtle rounded" />
          <div className="w-9 h-3 bg-graySubtle rounded" />
        </div>
      </div>

      {/* 3. Filter Tabs Skeleton */}
      <div
        data-testid="filter-tabs-skeleton"
        className="flex items-center gap-2 px-1 animate-pulse"
      >
        <div className="w-[70px] h-8 rounded-full bg-graySubtle" />
        <div className="w-[85px] h-8 rounded-full bg-graySubtle" />
        <div className="w-[85px] h-8 rounded-full bg-graySubtle" />
      </div>

      {/* 4. Transactions List Skeleton (5 dòng phẳng độc lập) */}
      <div data-testid="transactions-skeleton" className="space-y-2.5 animate-pulse">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="w-full p-3.5 bg-surface rounded-[20px] flex items-center gap-3"
          >
            {/* Thumbnail ảnh / icon tròn */}
            <div className="w-11 h-11 rounded-[12px] bg-graySubtle flex-shrink-0" />

            {/* Tên giao dịch & Thời gian */}
            <div className="flex-1 space-y-1.5">
              <div className="w-[130px] h-4 bg-graySubtle rounded" />
              <div className="w-20 h-3 bg-graySubtle rounded" />
            </div>

            {/* Số tiền */}
            <div className="w-20 h-4 bg-graySubtle rounded ml-auto flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
