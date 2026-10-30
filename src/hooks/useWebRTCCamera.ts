'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type CameraStatus = 'idle' | 'starting' | 'streaming' | 'denied' | 'unsupported';
export type CameraFacingMode = 'user' | 'environment';
export type CameraZoomLevel = '1x' | '0.5x';

export interface UseWebRTCCameraOptions {
  autoStart?: boolean;
  initialFacingMode?: CameraFacingMode;
  targetResolution?: number;
}

export interface UseWebRTCCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  status: CameraStatus;
  error: Error | null;
  facingMode: CameraFacingMode;
  isFlashOn: boolean;
  isFlashSupported: boolean;
  zoomLevel: CameraZoomLevel;
  isZoomSupported: boolean;
  startCamera: (overrideFacingMode?: CameraFacingMode) => Promise<void>;
  stopCamera: () => void;
  toggleFacingMode: () => Promise<void>;
  toggleFlash: () => Promise<boolean>;
  toggleZoom: () => CameraZoomLevel;
  setZoom: (level: CameraZoomLevel) => void;
}

/**
 * useWebRTCCamera - Hook điều khiển luồng Camera thời gian thực WebRTC
 * Đảm bảo 1:1 tính năng phần cứng với AVCameraService.swift (iOS Checked):
 * - Quản lý luồng video và tự động dọn dẹp (cleanup tracks) khi unmount
 * - Chuyển đổi camera trước/sau (facingMode: user <-> environment)
 * - Bật/tắt đèn Flash / Torch phần cứng
 * - Chuyển đổi mức thu phóng 0.5x <-> 1.0x chuẩn Locket
 * - Báo cáo trạng thái quyền: idle, starting, streaming, denied, unsupported
 */
export function useWebRTCCamera(options: UseWebRTCCameraOptions = {}): UseWebRTCCameraReturn {
  const {
    autoStart = false,
    initialFacingMode = 'environment',
    targetResolution = 1080,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>(initialFacingMode);
  const facingModeRef = useRef<CameraFacingMode>(initialFacingMode);
  facingModeRef.current = facingMode;

  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isFlashSupported, setIsFlashSupported] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<CameraZoomLevel>('1x');
  const [isZoomSupported, setIsZoomSupported] = useState(false);

  // Dừng toàn bộ tracks và giải phóng camera phần cứng
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks?.();
        if (Array.isArray(tracks)) {
          for (const track of tracks) {
            try {
              track.stop?.();
            } catch {
              // Bỏ qua lỗi khi track đã dừng
            }
          }
        }
      } catch {
        // Bỏ qua lỗi
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setIsFlashOn(false);
    setIsFlashSupported(false);
    setIsZoomSupported(false);
  }, []);

  // Dừng camera và chuyển trạng thái về idle
  const stopCamera = useCallback(() => {
    stopTracks();
    setStatus('idle');
  }, [stopTracks]);

  // Kiểm tra năng lực phần cứng của track (Torch, Zoom)
  const inspectCapabilities = useCallback((track: MediaStreamTrack) => {
    try {
      if (typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities() as Record<string, any>;
        setIsFlashSupported(Boolean(capabilities?.torch));
        setIsZoomSupported(Boolean(capabilities?.zoom));
      }
    } catch {
      setIsFlashSupported(false);
      setIsZoomSupported(false);
    }
  }, []);

  // Khởi động luồng camera WebRTC
  const startCamera = useCallback(
    async (overrideFacingMode?: CameraFacingMode): Promise<void> => {
      // 1. Kiểm tra hỗ trợ WebRTC trên trình duyệt
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        const unsupportedErr = new Error(
          'Thiết bị hoặc trình duyệt không hỗ trợ truy cập camera WebRTC.'
        );
        setError(unsupportedErr);
        setStatus('unsupported');
        return;
      }

      const activeFacing = overrideFacingMode ?? facingModeRef.current;

      // 2. Dọn dẹp luồng cũ trước khi tạo luồng mới
      stopTracks();
      setStatus('starting');
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: activeFacing },
          width: { ideal: targetResolution },
          height: { ideal: targetResolution },
        },
        audio: false,
      };

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = mediaStream;
        setStream(mediaStream);
        setFacingMode(activeFacing);
        setStatus('streaming');

        // Gắn luồng vào thẻ video nếu element đã render
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            const playPromise = videoRef.current.play?.();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {});
            }
          } catch {
            // Trình duyệt chặn autoplay khi chưa có user interaction hoặc trong jsdom
          }
        }

        // Đọc tính năng phần cứng của camera vừa mở
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          inspectCapabilities(videoTrack);

          // Tự động xử lý khi track bị hệ thống / phần cứng ngắt
          videoTrack.onended = () => {
            if (autoStart && typeof document !== 'undefined' && document.visibilityState === 'visible') {
              startCamera();
            } else {
              setStatus('idle');
            }
          };
        }
      } catch (err: any) {
        stopTracks();
        setError(err);

        if (
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError' ||
          err?.message?.toLowerCase().includes('denied')
        ) {
          setStatus('denied');
        } else if (
          err?.name === 'NotFoundError' ||
          err?.name === 'DevicesNotFoundError'
        ) {
          setStatus('unsupported');
        } else {
          setStatus('denied');
        }
      }
    },
    [stopTracks, targetResolution, inspectCapabilities, autoStart]
  );

  // Đổi giữa camera trước và sau
  const toggleFacingMode = useCallback(async () => {
    const nextMode: CameraFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    // Reset zoom và flash tương tự iOS AVCameraService.swift
    setZoomLevel('1x');
    setIsFlashOn(false);
    await startCamera(nextMode);
  }, [facingMode, startCamera]);

  // Bật / tắt đèn Flash (Torch)
  const toggleFlash = useCallback(async (): Promise<boolean> => {
    if (!streamRef.current) return false;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return false;

    const nextFlash = !isFlashOn;

    try {
      if (typeof videoTrack.applyConstraints === 'function') {
        await videoTrack.applyConstraints({
          advanced: [{ torch: nextFlash } as any],
        });
      }
      setIsFlashOn(nextFlash);
      return nextFlash;
    } catch {
      // Khi thiết bị không cho phép điều khiển torch
      return isFlashOn;
    }
  }, [isFlashOn]);

  // Đặt mức thu phóng (1x hoặc 0.5x)
  const setZoom = useCallback(
    (level: CameraZoomLevel) => {
      setZoomLevel(level);

      if (!streamRef.current) return;
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;

      try {
        if (typeof videoTrack.applyConstraints === 'function') {
          // Áp dụng hardware zoom nếu trình duyệt hỗ trợ
          const targetZoom = level === '0.5x' ? 0.5 : 1.0;
          videoTrack.applyConstraints({
            advanced: [{ zoom: targetZoom } as any],
          }).catch(() => {
            // Bỏ qua nếu thiết bị không hỗ trợ hardware zoom constraint
          });
        }
      } catch {
        // Fallback
      }
    },
    []
  );

  // Chuyển đổi qua lại giữa 0.5x và 1x
  const toggleZoom = useCallback((): CameraZoomLevel => {
    const nextZoom: CameraZoomLevel = zoomLevel === '1x' ? '0.5x' : '1x';
    setZoom(nextZoom);
    return nextZoom;
  }, [zoomLevel, setZoom]);

  // Tự động khởi động nếu autoStart = true
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    // Cleanup on unmount
    return () => {
      stopTracks();
    };
  }, [autoStart, startCamera]);

  // Lắng nghe sự kiện quay lại trang hoặc đổi tab (visibilitychange / pageshow / focus)
  useEffect(() => {
    if (!autoStart) return;

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const isTrackLive = streamRef.current
          ?.getVideoTracks()
          .some((t) => !t.readyState || t.readyState === 'live');
        if (!isTrackLive && status !== 'starting') {
          startCamera();
        } else if (
          videoRef.current &&
          streamRef.current &&
          videoRef.current.srcObject !== streamRef.current
        ) {
          videoRef.current.srcObject = streamRef.current;
          try {
            const playPromise = videoRef.current.play?.();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {});
            }
          } catch {
            // Ignore
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [autoStart, status, startCamera]);

  // Gắn lại srcObject nếu videoRef thay đổi hoặc render muộn
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      try {
        const playPromise = videoRef.current.play?.();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      } catch {
        // Ignore
      }
    }
  }, [stream]);

  return {
    videoRef,
    stream,
    status,
    error,
    facingMode,
    isFlashOn,
    isFlashSupported,
    zoomLevel,
    isZoomSupported,
    startCamera,
    stopCamera,
    toggleFacingMode,
    toggleFlash,
    toggleZoom,
    setZoom,
  };
}
