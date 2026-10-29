import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebRTCCamera } from '../useWebRTCCamera';

describe('useWebRTCCamera Hook (iOS Parity, Hardware Control & Lifecycle)', () => {
  let mockTrack: {
    kind: string;
    enabled: boolean;
    stop: ReturnType<typeof vi.fn>;
    getCapabilities: ReturnType<typeof vi.fn>;
    applyConstraints: ReturnType<typeof vi.fn>;
  };
  let mockStream: {
    getTracks: ReturnType<typeof vi.fn>;
    getVideoTracks: ReturnType<typeof vi.fn>;
    getAudioTracks: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTrack = {
      kind: 'video',
      enabled: true,
      stop: vi.fn(),
      getCapabilities: vi.fn().mockReturnValue({ torch: true, zoom: { min: 0.5, max: 2.0 } }),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
    };

    mockStream = {
      getTracks: vi.fn().mockReturnValue([mockTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
      getAudioTracks: vi.fn().mockReturnValue([]),
    };

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default values and idle status when autoStart is false', () => {
    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    expect(result.current.status).toBe('idle');
    expect(result.current.stream).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.facingMode).toBe('environment');
    expect(result.current.isFlashOn).toBe(false);
    expect(result.current.zoomLevel).toBe('1x');
  });

  it('starts camera stream and updates status to streaming', async () => {
    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1080 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    expect(result.current.status).toBe('streaming');
    expect(result.current.stream).toBe(mockStream);
    expect(result.current.isFlashSupported).toBe(true);
    expect(result.current.isZoomSupported).toBe(true);
  });

  it('attaches stream to videoRef when provided and startCamera is called', async () => {
    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));
    const mockVideo = document.createElement('video');
    result.current.videoRef.current = mockVideo;

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockVideo.srcObject).toBe(mockStream);
  });

  it('handles permission denied error (NotAllowedError)', async () => {
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      permissionError
    );

    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.error).toBe(permissionError);
    expect(result.current.stream).toBeNull();
  });

  it('flips facingMode from environment to user and re-requests stream', async () => {
    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.facingMode).toBe('environment');

    await act(async () => {
      await result.current.toggleFacingMode();
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(result.current.facingMode).toBe('user');
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenLastCalledWith({
      video: {
        facingMode: { ideal: 'user' },
        width: { ideal: 1080 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
  });

  it('toggles flash/torch and applies video constraints', async () => {
    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isFlashOn).toBe(false);

    await act(async () => {
      await result.current.toggleFlash();
    });

    expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true } as any],
    });
    expect(result.current.isFlashOn).toBe(true);

    await act(async () => {
      await result.current.toggleFlash();
    });

    expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: false } as any],
    });
    expect(result.current.isFlashOn).toBe(false);
  });

  it('toggles zoom between 1x and 0.5x', async () => {
    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.zoomLevel).toBe('1x');

    await act(async () => {
      result.current.toggleZoom();
    });

    expect(result.current.zoomLevel).toBe('0.5x');

    await act(async () => {
      result.current.toggleZoom();
    });

    expect(result.current.zoomLevel).toBe('1x');
  });

  it('stops camera and cleans up stream tracks on stopCamera call', async () => {
    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.status).toBe('streaming');

    act(() => {
      result.current.stopCamera();
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.stream).toBeNull();
  });

  it('stops tracks on unmount to prevent camera light remaining on', async () => {
    const { result, unmount } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });

    unmount();

    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('marks status as unsupported if navigator.mediaDevices is absent', async () => {
    delete (navigator as any).mediaDevices;

    const { result } = renderHook(() => useWebRTCCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('unsupported');
    expect(result.current.error?.message).toContain('trình duyệt');
  });
});
