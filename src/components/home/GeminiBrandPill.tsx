'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface GeminiBrandPillProps {
  isAnalyzing?: boolean;
  className?: string;
}

/**
 * GeminiLogo
 * SVG logo chính hãng của Gemini đồng bộ 1:1 từ checked-ios.
 * Kích thước chuẩn 16x16px với dải màu gradient nguyên bản.
 */
export const GeminiLogo: React.FC<{ className?: string; 'data-testid'?: string }> = ({
  className,
  'data-testid': testId = 'gemini-brand-logo',
}) => (
  <svg
    data-testid={testId}
    viewBox="0 0 24 24"
    width={16}
    height={16}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('w-4 h-4 shrink-0', className)}
    aria-hidden="true"
  >
    <path
      d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
      fill="#3186FF"
    />
    <path
      d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
      fill="url(#gemini-pill-gradient-green)"
    />
    <path
      d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
      fill="url(#gemini-pill-gradient-red)"
    />
    <path
      d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
      fill="url(#gemini-pill-gradient-yellow)"
    />
    <defs>
      <linearGradient
        id="gemini-pill-gradient-green"
        x1="7"
        y1="15.5"
        x2="11"
        y2="12"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#08B962" />
        <stop offset="1" stopColor="#08B962" stopOpacity="0" />
      </linearGradient>
      <linearGradient
        id="gemini-pill-gradient-red"
        x1="8"
        y1="5.5"
        x2="11.5"
        y2="11"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#F94543" />
        <stop offset="1" stopColor="#F94543" stopOpacity="0" />
      </linearGradient>
      <linearGradient
        id="gemini-pill-gradient-yellow"
        x1="3.5"
        y1="13.5"
        x2="17.5"
        y2="12"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FABC12" />
        <stop offset="0.46" stopColor="#FABC12" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * GeminiBrandPill
 * Nhãn thương hiệu Gemini 144x44px trên thanh TopBar của ImagePreviewView.
 * Sử dụng logo chuẩn từ checked-ios.
 * Phản hồi trạng thái AI Vision đang phân tích (isAnalyzing) bằng scale/pulse trực tiếp trên logo.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const GeminiBrandPill: React.FC<GeminiBrandPillProps> = ({
  isAnalyzing = false,
  className,
}) => {
  return (
    <div
      data-testid="gemini-brand-pill"
      aria-label={isAnalyzing ? 'Gemini AI đang phân tích' : 'Gemini AI'}
      className={cn(
        'w-[144px] h-[44px] rounded-full bg-white flex items-center justify-center gap-1.5 select-none transition-colors duration-200',
        className
      )}
    >
      <GeminiLogo
        data-testid="gemini-brand-logo"
        className={cn(
          'transition-transform duration-300',
          isAnalyzing && 'animate-pulse scale-110'
        )}
      />
      <span className="text-[15px] font-bold font-display text-[#141613] tracking-tight">
        Gemini
      </span>
    </div>
  );
};
