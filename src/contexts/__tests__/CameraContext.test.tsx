import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act, screen } from '@testing-library/react';
import { CameraProvider, useCameraContext } from '../CameraContext';
import { usePermissionStore } from '@/stores/permission-store';
import { useAuthStore } from '@/stores/auth-store';

describe('CameraContext (Global MediaStream Singleton & Hardware Lifecycle)', () => {
  let mockTrack: {
    kind: string;
    enabled: boolean;
    readyState?: string;
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
    usePermissionStore.getState().reset();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });

    mockTrack = {
      kind: 'video',
      enabled: true,
      readyState: 'live',
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

  it('provides the complete camera context interface', () => {
    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

    expect(result.current.videoRef).toBeDefined();
    expect(result.current.stream).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.facingMode).toBe('environment');
    expect(result.current.isFlashOn).toBe(false);
    expect(result.current.isFlashSupported).toBe(false);
    expect(result.current.zoomLevel).toBe('1x');
    expect(result.current.isZoomSupported).toBe(false);
    expect(typeof result.current.startCamera).toBe('function');
    expect(typeof result.current.stopCamera).toBe('function');
    expect(typeof result.current.toggleFacingMode).toBe('function');
    expect(typeof result.current.toggleFlash).toBe('function');
    expect(typeof result.current.toggleZoom).toBe('function');
    expect(typeof result.current.setZoom).toBe('function');
  });

  it('updates status and records permission granted in usePermissionStore on successful startCamera', async () => {
    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

    expect(usePermissionStore.getState().permissions.camera).toBe('prompt');

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
    expect(usePermissionStore.getState().permissions.camera).toBe('granted');
  });

  it('records permission denied in usePermissionStore on NotAllowedError', async () => {
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      permissionError
    );

    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.error).toBe(permissionError);
    expect(result.current.stream).toBeNull();
    expect(usePermissionStore.getState().permissions.camera).toBe('denied');
  });

  it('auto-starts camera stream when camera permission is already granted in permission store and user is authenticated', async () => {
    useAuthStore.setState({ isAuthenticated: true });
    usePermissionStore.getState().setPermission('camera', 'granted');

    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

    // Wait for auto-start effect to settle
    await act(async () => {
      await Promise.resolve();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('streaming');
    expect(result.current.stream).toBe(mockStream);
  });

  it('does NOT auto-start camera stream if user is unauthenticated even when permission is granted', async () => {
    useAuthStore.setState({ isAuthenticated: false });
    usePermissionStore.getState().setPermission('camera', 'granted');

    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

    // Wait for auto-start effect to settle
    await act(async () => {
      await Promise.resolve();
    });

    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.stream).toBeNull();
  });

  it('DOES NOT stop MediaStream tracks when child component unmounts (survives tab navigation)', async () => {
    const ChildComponent = () => {
      const { status } = useCameraContext();
      return <div data-testid="child-status">{status}</div>;
    };

    const { unmount, rerender } = render(
      <CameraProvider>
        <ChildComponent />
      </CameraProvider>
    );

    // Get the context and start camera
    let contextValues: ReturnType<typeof useCameraContext> | null = null;
    const TestConsumer = () => {
      contextValues = useCameraContext();
      return null;
    };

    rerender(
      <CameraProvider>
        <TestConsumer />
        <ChildComponent />
      </CameraProvider>
    );

    await act(async () => {
      await contextValues!.startCamera();
    });

    expect(contextValues!.status).toBe('streaming');
    expect(mockTrack.stop).not.toHaveBeenCalled();

    // Simulate navigating to another tab (ChildComponent unmounts, but CameraProvider stays mounted)
    rerender(
      <CameraProvider>
        <TestConsumer />
      </CameraProvider>
    );

    // Tracks must NOT be stopped!
    expect(mockTrack.stop).not.toHaveBeenCalled();
    expect(contextValues!.stream).toBe(mockStream);
  });

  it('immediately binds videoRef to existing stream when child mounts without calling getUserMedia again', async () => {
    let capturedContext: ReturnType<typeof useCameraContext> | null = null;

    const ContextGrabber = () => {
      capturedContext = useCameraContext();
      return null;
    };

    const ViewfinderChild = () => {
      const { videoRef, attachVideo } = useCameraContext();
      return (
        <video
          data-testid="video-element"
          ref={(el) => {
            if (attachVideo) {
              attachVideo(el);
            } else if (videoRef) {
              (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
            }
          }}
        />
      );
    };

    const { rerender } = render(
      <CameraProvider>
        <ContextGrabber />
        <ViewfinderChild />
      </CameraProvider>
    );

    // Initial start camera call
    await act(async () => {
      await capturedContext!.startCamera();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    const firstVideo = screen.getByTestId('video-element') as HTMLVideoElement;
    expect(firstVideo.srcObject).toBe(mockStream);

    // Simulate navigation away from Home (ViewfinderChild unmounts)
    rerender(
      <CameraProvider>
        <ContextGrabber />
        <div data-testid="settings-page">Settings Page</div>
      </CameraProvider>
    );

    expect(screen.queryByTestId('video-element')).toBeNull();
    // Tracks are still running!
    expect(mockTrack.stop).not.toHaveBeenCalled();

    // Simulate returning to Home (ViewfinderChild remounts)
    rerender(
      <CameraProvider>
        <ContextGrabber />
        <ViewfinderChild />
      </CameraProvider>
    );

    const secondVideo = screen.getByTestId('video-element') as HTMLVideoElement;
    // Binds immediately to existing singleton stream without second getUserMedia call
    expect(secondVideo.srcObject).toBe(mockStream);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('pauses video track enabled state on visibilitychange to hidden, and resumes on visible without stopping track', async () => {
    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockTrack.enabled).toBe(true);

    // App goes to background / tab is hidden
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockTrack.enabled).toBe(false);
    expect(mockTrack.stop).not.toHaveBeenCalled();

    // App resumes / tab becomes visible
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockTrack.enabled).toBe(true);
    expect(mockTrack.stop).not.toHaveBeenCalled();
  });

  it('flips facingMode and re-requests stream with new constraints', async () => {
    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

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

  it('controls flash and zoom hardware constraints', async () => {
    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

    await act(async () => {
      await result.current.startCamera();
    });

    // Toggle flash
    expect(result.current.isFlashOn).toBe(false);
    await act(async () => {
      await result.current.toggleFlash();
    });
    expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true } as any],
    });
    expect(result.current.isFlashOn).toBe(true);

    // Toggle zoom
    expect(result.current.zoomLevel).toBe('1x');
    act(() => {
      result.current.toggleZoom();
    });
    expect(result.current.zoomLevel).toBe('0.5x');

    act(() => {
      result.current.setZoom('1x');
    });
    expect(result.current.zoomLevel).toBe('1x');
  });

  it('stops camera and cleans up stream tracks on stopCamera call', async () => {
    const { result } = renderHook(() => useCameraContext(), {
      wrapper: ({ children }) => <CameraProvider>{children}</CameraProvider>,
    });

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
});
