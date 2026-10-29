'use client';

import React, { useState } from 'react';
import { Camera, CameraOff, RotateCcw, X, Zap, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import type { CameraStatus, CameraFacingMode, CameraZoomLevel } from '@/hooks/useWebRTCCamera';

export interface CameraBoxProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isLive?: boolean;
  status?: CameraStatus;
  facingMode?: CameraFacingMode;
  isFlashOn?: boolean;
  onToggleFlash?: () => void;
  zoomLevel?: CameraZoomLevel;
  onToggleZoom?: () => void;
  onRetryPermission?: () => void;
  previewImageUrl?: string | null;
  onRetake?: () => void;
  className?: string;
}

export const CameraBox: React.FC<CameraBoxProps> = ({
  videoRef,
  isLive = false,
  status = 'idle',
  facingMode = 'environment',
  isFlashOn: controlledFlash,
  onToggleFlash,
  zoomLevel: controlledZoom,
  onToggleZoom,
  onRetryPermission,
  previewImageUrl,
  onRetake,
  className,
}) => {
  // Fallback internal state nếu không truyền controlled props từ hook
  const [internalFlash, setInternalFlash] = useState(false);
  const [internalZoom, setInternalZoom] = useState<CameraZoomLevel>('1x');

  const isFlashActive = controlledFlash !== undefined ? controlledFlash : internalFlash;
  const currentZoom = controlledZoom !== undefined ? controlledZoom : internalZoom;

  const handleToggleFlash = () => {
    haptics.click();
    if (onToggleFlash) {
      onToggleFlash();
    } else {
      setInternalFlash((prev) => !prev);
    }
  };

  const handleToggleZoom = () => {
    haptics.medium();
    if (onToggleZoom) {
      onToggleZoom();
    } else {
      setInternalZoom((prev) => (prev === '1x' ? '0.5x' : '1x'));
    }
  };

  const isStreaming = isLive || status === 'streaming';
  const isDenied = status === 'denied';

  return (
    <div
      className={cn(
        'w-full max-w-[390px] aspect-square rounded-[32px] bg-[#141613] relative overflow-hidden select-none flex items-center justify-center',
        className
      )}
    >
      {/* 1. HIỂN THỊ ẢNH VỪA CHỤP (NẾU CÓ) */}
      {previewImageUrl ? (
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImageUrl}
            alt="Khoảnh khắc vừa chụp"
            className="w-full h-full object-cover"
          />
          {onRetake && (
            <button
              type="button"
              onClick={onRetake}
              aria-label="Chụp lại ảnh"
              className="absolute top-4 right-4 w-[38px] h-[38px] rounded-full bg-black/60 flex items-center justify-center text-white active:scale-90 transition-transform z-20"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      ) : isStreaming && videoRef ? (
        /* 2. LUỒNG VIDEO CAMERA THẬT WEBRTC */
        <video
          ref={videoRef as any}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover',
            facingMode === 'user' && '-scale-x-100'
          )}
        />
      ) : isDenied ? (
        /* 3. TRẠNG THÁI TỪ CHỐI QUYỀN CAMERA */
        <div className="flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="w-[64px] h-[64px] rounded-full bg-white/10 flex items-center justify-center">
            <CameraOff size={28} className="text-[#FF5C5C]" strokeWidth={2} />
          </div>
          <span className="text-[14px] font-semibold font-display text-white/80">
            Chưa cấp quyền camera
          </span>
          {onRetryPermission && (
            <button
              type="button"
              onClick={onRetryPermission}
              className="mt-1 px-4 py-2 rounded-full bg-[#D4EB70] text-[#141613] text-xs font-bold font-display active:scale-95 transition-transform"
            >
              Cấp quyền
            </button>
          )}
        </div>
      ) : (
        /* 4. GIAO DIỆN ỐNG KÍNH CHECKED MẶC ĐỊNH */
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-[72px] h-[72px] rounded-full bg-white/10 flex items-center justify-center">
            <Camera size={32} className="text-white/60" strokeWidth={1.8} />
          </div>
          <span className="text-[15px] font-semibold font-display text-white/70 tracking-tight">
            Ống kính Checked
          </span>
        </div>
      )}

      {/* Top Controls Overlay: Chỉ hiển thị khi đang stream hoặc ở ống kính mặc định */}
      {!previewImageUrl && !isDenied && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto">
          {/* Nút Flash (Bật / Tắt) */}
          <button
            type="button"
            onClick={handleToggleFlash}
            aria-label={isFlashActive ? 'Tắt đèn flash' : 'Bật đèn flash'}
            className="w-[38px] h-[38px] rounded-full bg-black/55 flex items-center justify-center active:scale-90 transition-transform"
          >
            {isFlashActive ? (
              <Zap size={16} className="text-[#D4EB70] fill-[#D4EB70]" />
            ) : (
              <ZapOff size={16} className="text-white/80" />
            )}
          </button>

          {/* Nút Zoom: Chuyển đổi 0.5x <-> 1x chuẩn Locket */}
          <button
            type="button"
            onClick={handleToggleZoom}
            aria-label="Thu phóng camera"
            className={cn(
              'w-[38px] h-[38px] rounded-full bg-black/55 flex items-center justify-center text-[13px] font-bold font-display active:scale-90 transition-transform',
              currentZoom === '0.5x' ? 'text-[#D4EB70]' : 'text-white'
            )}
          >
            {currentZoom}
          </button>
        </div>
      )}
    </div>
  );
};
