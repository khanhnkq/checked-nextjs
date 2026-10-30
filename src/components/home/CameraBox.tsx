'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Zap, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import type { CameraStatus, CameraFacingMode, CameraZoomLevel } from '@/hooks/useWebRTCCamera';

export interface CameraBoxProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  stream?: MediaStream | null;
  isLive?: boolean;
  status?: CameraStatus;
  facingMode?: CameraFacingMode;
  isFlashOn?: boolean;
  onToggleFlash?: () => void;
  zoomLevel?: CameraZoomLevel;
  onToggleZoom?: () => void;
  onRetryPermission?: () => void;
  className?: string;
}

/**
 * CameraBox (Viewfinder thuần túy)
 * Khung ngắm camera 1:1 kết nối trực tiếp WebRTC Live Stream.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const CameraBox: React.FC<CameraBoxProps> = ({
  videoRef,
  stream,
  isLive = false,
  status = 'idle',
  facingMode = 'environment',
  isFlashOn: controlledFlash,
  onToggleFlash,
  zoomLevel: controlledZoom,
  onToggleZoom,
  onRetryPermission,
  className,
}) => {
  // Fallback internal state nếu không truyền controlled props từ hook
  const [internalFlash, setInternalFlash] = useState(false);
  const [internalZoom, setInternalZoom] = useState<CameraZoomLevel>('1x');

  const isFlashActive = controlledFlash !== undefined ? controlledFlash : internalFlash;
  const currentZoom = controlledZoom !== undefined ? controlledZoom : internalZoom;

  // Gắn luồng MediaStream vào thẻ video ngay khi node được mount (chống lỗi màn hình đen khi quay lại Home)
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (videoRef) {
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
      }
      if (node && stream && node.srcObject !== stream) {
        node.srcObject = stream;
        try {
          const p = node.play?.();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
        } catch {
          // Ignore
        }
      }
    },
    [videoRef, stream]
  );

  // Đảm bảo đồng bộ khi stream thay đổi sau khi video đã mount
  useEffect(() => {
    const videoEl = videoRef?.current;
    if (videoEl && stream && videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
      try {
        const p = videoEl.play?.();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch {
        // Ignore
      }
    }
  }, [stream, isLive, status, videoRef]);

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
      {/* 1. LUỒNG VIDEO CAMERA THẬT WEBRTC */}
      {isStreaming && videoRef ? (
        <video
          ref={setVideoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover',
            facingMode === 'user' && '-scale-x-100'
          )}
        />
      ) : isDenied ? (
        /* 2. TRẠNG THÁI TỪ CHỐI QUYỀN CAMERA */
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
        /* 3. GIAO DIỆN ỐNG KÍNH CHECKED MẶC ĐỊNH */
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-[72px] h-[72px] rounded-full bg-white/10 flex items-center justify-center">
            <Camera size={32} className="text-white/60" strokeWidth={1.8} />
          </div>
          <span className="text-[15px] font-semibold font-display text-white/70 tracking-tight">
            Ống kính Checked
          </span>
        </div>
      )}

      {/* Top Controls Overlay: Nút Flash và Zoom trên khung ngắm */}
      {!isDenied && (
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
