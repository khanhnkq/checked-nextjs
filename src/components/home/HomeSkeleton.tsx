'use client';

import React from 'react';
import { SkeletonBone } from '@/components/common/SkeletonBone';

export const HomeSkeleton: React.FC = () => {
  return (
    <div
      className="relative w-full h-dvh max-w-[430px] mx-auto bg-[#EDE9DF] flex flex-col justify-between items-center select-none overflow-hidden"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 14px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
      role="status"
      aria-label="Đang tải giao diện chính"
    >
      {/* 1. TOP BAR SKELETON */}
      <header className="relative w-full h-[44px] flex items-center justify-between px-5 z-50 flex-shrink-0">
        {/* Left Avatar Button Skeleton */}
        <SkeletonBone variant="circle" className="w-[44px] h-[44px] bg-[#DFDACD]/70" />

        {/* Center Pill Skeleton */}
        <SkeletonBone className="w-[144px] h-[44px] rounded-full bg-[#DFDACD]/70" />

        {/* Right Chat Button Skeleton */}
        <SkeletonBone variant="circle" className="w-[44px] h-[44px] bg-[#DFDACD]/70" />
      </header>

      {/* 2. CAMERA BOX SKELETON */}
      <div className="w-full flex justify-center px-[18px] flex-shrink-0">
        <div className="w-full max-w-[390px] aspect-square rounded-[32px] bg-[#DFDACD]/50 relative overflow-hidden flex items-center justify-center animate-pulse">
          {/* Inner Lens Icon Circle */}
          <div className="w-[72px] h-[72px] rounded-full bg-[#DFDACD]/80 flex items-center justify-center" />
        </div>
      </div>

      {/* 3. STACKED CARDS SKELETON */}
      <div className="w-full flex justify-center items-center flex-shrink-0">
        <SkeletonBone className="w-[96px] h-[74px] rounded-[18px] bg-[#DFDACD]/70" />
      </div>

      {/* 4. BOTTOM CONTROLS SKELETON */}
      <footer className="w-full flex flex-col items-center gap-3.5 px-[28px] flex-shrink-0">
        <div className="w-full flex items-center justify-between">
          {/* PhotosPicker Button Skeleton */}
          <SkeletonBone variant="circle" className="w-[52px] h-[52px] bg-[#DFDACD]/70" />

          {/* Shutter Button Skeleton */}
          <SkeletonBone variant="circle" className="w-[86px] h-[86px] bg-[#DFDACD]/70" />

          {/* FlipCamera Button Skeleton */}
          <SkeletonBone variant="circle" className="w-[52px] h-[52px] bg-[#DFDACD]/70" />
        </div>

        {/* History Link Skeleton */}
        <SkeletonBone className="w-32 h-3.5 rounded-full bg-[#DFDACD]/70 mt-0.5" />
      </footer>
    </div>
  );
};
