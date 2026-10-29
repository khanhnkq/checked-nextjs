'use client';

import React, { useState } from 'react';
import { Camera, Zap, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface CameraBoxProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isLive?: boolean;
  className?: string;
}

export const CameraBox: React.FC<CameraBoxProps> = ({
  videoRef,
  isLive = false,
  className,
}) => {
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'1x' | '0.5x'>('1x');

  const toggleFlash = () => {
    haptics.click();
    setIsFlashOn((prev) => !prev);
  };

  const toggleZoom = () => {
    haptics.medium();
    setZoomLevel((prev) => (prev === '1x' ? '0.5x' : '1x'));
  };

  return (
    <div
      className={cn(
        'w-full max-w-[390px] max-h-[42dvh] aspect-square rounded-[32px] bg-[#141613] relative overflow-hidden select-none flex items-center justify-center',
        className
      )}
    >
      {/* Video feed or simulated viewfinder */}
      {isLive && videoRef ? (
        <video
          ref={videoRef as any}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        /* Giao diện ống kính Checked chuẩn iOS Simulator */
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-[72px] h-[72px] rounded-full bg-white/10 flex items-center justify-center">
            <Camera size={32} className="text-white/60" strokeWidth={1.8} />
          </div>
          <span className="text-[15px] font-semibold font-display text-white/70 tracking-tight">
            Ống kính Checked
          </span>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto">
        {/* Nút Flash (Bật / Tắt) */}
        <button
          type="button"
          onClick={toggleFlash}
          aria-label={isFlashOn ? 'Tắt đèn flash' : 'Bật đèn flash'}
          className="w-[38px] h-[38px] rounded-full bg-black/55 flex items-center justify-center active:scale-90 transition-transform"
        >
          {isFlashOn ? (
            <Zap size={16} className="text-[#D4EB70] fill-[#D4EB70]" />
          ) : (
            <ZapOff size={16} className="text-white/80" />
          )}
        </button>

        {/* Nút Zoom: Chuyển đổi 0.5x <-> 1x chuẩn Locket */}
        <button
          type="button"
          onClick={toggleZoom}
          aria-label="Thu phóng camera"
          className={cn(
            'w-[38px] h-[38px] rounded-full bg-black/55 flex items-center justify-center text-[13px] font-bold font-display active:scale-90 transition-transform',
            zoomLevel === '0.5x' ? 'text-[#D4EB70]' : 'text-white'
          )}
        >
          {zoomLevel}
        </button>
      </div>
    </div>
  );
};
