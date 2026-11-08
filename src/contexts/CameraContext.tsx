'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type RefObject,
} from 'react';
import { usePermissionStore } from '@/stores/permission-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWebRTCCamera } from '@/hooks/useWebRTCCamera';

export type CameraStatus = 'idle' | 'starting' | 'streaming' | 'denied' | 'unsupported';
export type CameraFacingMode = 'user' | 'environment';
export type CameraZoomLevel = '1x' | '0.5x';

export interface CameraContextType {
  videoRef: RefObject<HTMLVideoElement | null>;
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
  attachVideo: (videoElement: HTMLVideoElement | null) => void;
}

const fallbackVideoRef: RefObject<HTMLVideoElement | null> = { current: null };

export const defaultCameraContextValue: CameraContextType = {
  videoRef: fallbackVideoRef,
  stream: null,
  status: 'idle',
  error: null,
  facingMode: 'environment',
  isFlashOn: false,
  isFlashSupported: false,
  zoomLevel: '1x',
  isZoomSupported: false,
  startCamera: async () => {},
  stopCamera: () => {},
  toggleFacingMode: async () => {},
  toggleFlash: async () => false,
  toggleZoom: () => '1x',
  setZoom: () => {},
  attachVideo: () => {},
};

const CameraContext = createContext<CameraContextType | null>(null);

export interface CameraProviderProps {
  children: ReactNode;
  autoStart?: boolean;
  initialFacingMode?: CameraFacingMode;
  targetResolution?: number;
}

/**
 * CameraProvider - Global Stream Singleton cho toàn ứng dụng Checked
 *
 * Chuyển đổi quản lý vòng đời MediaStream từ cấp Component/Page lên cấp Application Root.
 * Đảm bảo:
 * 1. Stream camera KHÔNG bị hủy (tracks không bị stop) khi chuyển tab (Home <-> Messages <-> Settings).
 * 2. Tự động gắn lại luồng video vào phần tử videoRef ngay lập tức mà không gọi lại getUserMedia.
 * 3. Tích hợp chặt chẽ với usePermissionStore (lưu trạng thái 'granted' / 'denied').
 * 4. Tiết kiệm pin tối đa: tạm dừng track enabled khi ẩn app (visibilitychange = hidden), kích hoạt lại khi mở lại.
 */
export const CameraProvider: React.FC<CameraProviderProps> = ({
  children,
  autoStart = false,
  initialFacingMode = 'environment',
  targetResolution = 1080,
}) => {
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

  // Đọc năng lực phần cứng của video track (Torch, Zoom)
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
              // Bỏ qua lỗi
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

  // Dừng camera và chuyển về idle
  const stopCamera = useCallback(() => {
    stopTracks();
    setStatus('idle');
  }, [stopTracks]);

  // Gắn phần tử video và liên kết ngay lập tức với singleton stream đang hoạt động
  const attachVideo = useCallback((videoElement: HTMLVideoElement | null) => {
    videoRef.current = videoElement;
    if (videoElement && streamRef.current) {
      if (videoElement.srcObject !== streamRef.current) {
        videoElement.srcObject = streamRef.current;
      }
      try {
        const playPromise = videoElement.play?.();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      } catch {
        // Ignore autoplay errors
      }
    }
  }, []);

  // Khởi động luồng camera WebRTC (Singleton)
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

      // 2. Nếu luồng hiện tại đang chạy tốt với cùng facingMode, tái sử dụng ngay lập tức
      const isLive = streamRef.current
        ?.getVideoTracks()
        .some((t) => !t.readyState || t.readyState === 'live');

      if (
        isLive &&
        (!overrideFacingMode || overrideFacingMode === facingModeRef.current) &&
        streamRef.current
      ) {
        setStatus('streaming');
        if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
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
        return;
      }

      // 3. Nếu cần chuyển hướng camera hoặc khởi tạo mới, dọn dẹp luồng cũ
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

        // Ghi nhận trạng thái granted vào PermissionStore
        usePermissionStore.getState().setPermission('camera', 'granted');

        // Gắn luồng vào thẻ video nếu đã có ref
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          try {
            const playPromise = videoRef.current.play?.();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {});
            }
          } catch {
            // Ignore autoplay issues
          }
        }

        // Đọc tính năng phần cứng của camera
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          inspectCapabilities(videoTrack);

          videoTrack.onended = () => {
            setStatus('idle');
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
          usePermissionStore.getState().setPermission('camera', 'denied');
        } else if (
          err?.name === 'NotFoundError' ||
          err?.name === 'DevicesNotFoundError'
        ) {
          setStatus('unsupported');
        } else {
          setStatus('denied');
          usePermissionStore.getState().setPermission('camera', 'denied');
        }
      }
    },
    [stopTracks, targetResolution, inspectCapabilities]
  );

  // Đổi giữa camera trước và sau
  const toggleFacingMode = useCallback(async () => {
    const nextMode: CameraFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setZoomLevel('1x');
    setIsFlashOn(false);
    await startCamera(nextMode);
  }, [facingMode, startCamera]);

  // Bật/tắt đèn Flash (Torch)
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
      return isFlashOn;
    }
  }, [isFlashOn]);

  // Đặt mức thu phóng (1x hoặc 0.5x)
  const setZoom = useCallback((level: CameraZoomLevel) => {
    setZoomLevel(level);

    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      if (typeof videoTrack.applyConstraints === 'function') {
        const targetZoom = level === '0.5x' ? 0.5 : 1.0;
        videoTrack
          .applyConstraints({
            advanced: [{ zoom: targetZoom } as any],
          })
          .catch(() => {});
      }
    } catch {
      // Fallback
    }
  }, []);

  // Chuyển đổi qua lại giữa 0.5x và 1x
  const toggleZoom = useCallback((): CameraZoomLevel => {
    const nextZoom: CameraZoomLevel = zoomLevel === '1x' ? '0.5x' : '1x';
    setZoom(nextZoom);
    return nextZoom;
  }, [zoomLevel, setZoom]);

  // Tự động khởi động nếu autoStart = true hoặc quyền camera đã được cấp (granted) trước đó,
  // và người dùng đã xác thực (tránh tự bật camera ở trang public /login, /register)
  useEffect(() => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    const cameraPermission = usePermissionStore.getState().permissions.camera;

    if (isAuthenticated && (autoStart || cameraPermission === 'granted')) {
      startCamera();
    }

    // Dọn dẹp CHỈ KHI CameraProvider unmount hoàn toàn khỏi ứng dụng
    return () => {
      stopTracks();
    };
  }, [autoStart, startCamera, stopTracks]);

  // Quản trị tiết kiệm pin và đồng bộ luồng:
  // - Ẩn app (hidden): tạm ngắt frame (track.enabled = false) để tiết kiệm pin
  // - Mở lại app (visible): bật lại frame (track.enabled = true) mà không cần tạo lại luồng
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.visibilityState === 'hidden') {
        if (streamRef.current) {
          const tracks = streamRef.current.getVideoTracks();
          for (const track of tracks) {
            track.enabled = false;
          }
        }
      } else if (document.visibilityState === 'visible') {
        if (streamRef.current) {
          const isEnded = streamRef.current
            .getVideoTracks()
            .some((t) => t.readyState === 'ended');

          if (isEnded) {
            const perm = usePermissionStore.getState().permissions.camera;
            if (perm === 'granted') {
              startCamera();
              return;
            }
          }

          const tracks = streamRef.current.getVideoTracks();
          for (const track of tracks) {
            track.enabled = true;
          }

          if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
          try {
            videoRef.current?.play?.().catch(() => {});
          } catch {
            // Ignore
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, [startCamera]);

  // Gắn lại srcObject nếu videoRef thay đổi hoặc stream thay đổi
  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
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

  const value: CameraContextType = {
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
    attachVideo,
  };

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>;
};

/**
 * useCameraContext - Hook tiêu dùng luồng Camera toàn cục
 * Nếu được gọi bên ngoài CameraProvider (ví dụ trong các unit test cũ),
 * tự động fallback sang useWebRTCCamera({ autoStart: true }) để đảm bảo 100% tương thích ngược.
 */
export function useCameraContext(): CameraContextType {
  const context = useContext(CameraContext);
  if (context) {
    return context;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fallback = useWebRTCCamera({ autoStart: true });
  return {
    ...fallback,
    attachVideo: (videoElement: HTMLVideoElement | null) => {
      if (fallback.videoRef && 'current' in fallback.videoRef) {
        (fallback.videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = videoElement;
      }
      if (videoElement && fallback.stream && videoElement.srcObject !== fallback.stream) {
        videoElement.srcObject = fallback.stream;
        try {
          videoElement.play?.().catch(() => {});
        } catch {}
      }
    },
  };
}
