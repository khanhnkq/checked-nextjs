import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../useGeolocation';
import { usePermissionStore } from '@/stores/permission-store';

describe('useGeolocation Hook (iOS LocationService Parity)', () => {
  let mockGetCurrentPosition: any;

  beforeEach(() => {
    vi.clearAllMocks();
    usePermissionStore.getState().reset();
    mockGetCurrentPosition = vi.fn();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      configurable: true,
      writable: true,
    });
  });

  it('initializes with default location name TP. Hồ Chí Minh when no cache exists', () => {
    const { result } = renderHook(() => useGeolocation({ autoFetch: false }));

    expect(result.current.locationName).toBe('TP. Hồ Chí Minh');
    expect(result.current.coords).toBeNull();
    expect(result.current.isLocating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('immediately returns cached location name and coords when cachedLocation exists in store', () => {
    usePermissionStore.getState().setCachedLocation({
      coords: { latitude: 21.0285, longitude: 105.8542, accuracy: 5 },
      locationName: 'Hà Nội Phố Cổ',
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useGeolocation({ autoFetch: false }));

    expect(result.current.locationName).toBe('Hà Nội Phố Cổ');
    expect(result.current.coords).toEqual({
      latitude: 21.0285,
      longitude: 105.8542,
      accuracy: 5,
    });
    expect(result.current.isLocating).toBe(false);
  });

  it('triggers getCurrentPosition when autoFetch is true and no cache exists', () => {
    renderHook(() => useGeolocation({ autoFetch: true }));

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('does NOT call getCurrentPosition when autoFetch is true if cached location is fresh (< 30 mins)', () => {
    usePermissionStore.getState().setCachedLocation({
      coords: { latitude: 10.7769, longitude: 106.7009, accuracy: 10 },
      locationName: 'Nhà thờ Đức Bà',
      timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    });

    renderHook(() => useGeolocation({ autoFetch: true }));

    expect(mockGetCurrentPosition).not.toHaveBeenCalled();
  });

  it('calls getCurrentPosition when autoFetch is true if cached location is expired (> 30 mins)', () => {
    usePermissionStore.getState().setCachedLocation({
      coords: { latitude: 10.7769, longitude: 106.7009, accuracy: 10 },
      locationName: 'Nhà thờ Đức Bà',
      timestamp: Date.now() - 35 * 60 * 1000, // 35 minutes ago
    });

    renderHook(() => useGeolocation({ autoFetch: true }));

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('does NOT call getCurrentPosition automatically when permission is denied', () => {
    usePermissionStore.getState().setPermission('location', 'denied');

    renderHook(() => useGeolocation({ autoFetch: true }));

    expect(mockGetCurrentPosition).not.toHaveBeenCalled();
  });

  it('updates coordinates and saves to permissionStore when geolocation succeeds', async () => {
    mockGetCurrentPosition.mockImplementationOnce((success: any) => {
      success({
        coords: {
          latitude: 10.7769,
          longitude: 106.7009,
          accuracy: 10,
        },
      });
    });

    const { result } = renderHook(() => useGeolocation({ autoFetch: false }));

    await act(async () => {
      result.current.refreshLocation();
    });

    expect(result.current.coords).toEqual({
      latitude: 10.7769,
      longitude: 106.7009,
      accuracy: 10,
    });
    expect(result.current.isLocating).toBe(false);
    expect(result.current.error).toBeNull();

    // Verify permission store updated
    expect(usePermissionStore.getState().permissions.location).toBe('granted');
    expect(usePermissionStore.getState().cachedLocation).toEqual(
      expect.objectContaining({
        coords: {
          latitude: 10.7769,
          longitude: 106.7009,
          accuracy: 10,
        },
        locationName: expect.any(String),
      })
    );
  });

  it('updates permission store to denied when user denies geolocation', () => {
    mockGetCurrentPosition.mockImplementationOnce((_success: any, error: any) => {
      error({
        code: 1,
        message: 'User denied Geolocation',
      });
    });

    const { result } = renderHook(() => useGeolocation({ autoFetch: false }));

    act(() => {
      result.current.refreshLocation();
    });

    expect(result.current.locationName).toBe('TP. Hồ Chí Minh');
    expect(result.current.error).toBe('User denied Geolocation');
    expect(result.current.isLocating).toBe(false);
    expect(usePermissionStore.getState().permissions.location).toBe('denied');
  });

  it('allows manual updating of location name', () => {
    const { result } = renderHook(() => useGeolocation({ autoFetch: false }));

    act(() => {
      result.current.setLocationName('Phở Thìn Lò Đúc, Hà Nội');
    });

    expect(result.current.locationName).toBe('Phở Thìn Lò Đúc, Hà Nội');
  });

  it('allows manual refreshLocation() even when cachedLocation exists', () => {
    usePermissionStore.getState().setCachedLocation({
      coords: { latitude: 21.0285, longitude: 105.8542, accuracy: 5 },
      locationName: 'Hà Nội',
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useGeolocation({ autoFetch: false }));
    expect(mockGetCurrentPosition).not.toHaveBeenCalled();

    act(() => {
      result.current.refreshLocation();
    });

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
