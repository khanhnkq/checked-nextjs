import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../useGeolocation';

describe('useGeolocation Hook (iOS LocationService Parity)', () => {
  let mockGetCurrentPosition: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentPosition = vi.fn();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      configurable: true,
      writable: true,
    });
  });

  it('initializes with default location name TP. Hồ Chí Minh', () => {
    const { result } = renderHook(() => useGeolocation({ autoFetch: false }));

    expect(result.current.locationName).toBe('TP. Hồ Chí Minh');
    expect(result.current.coords).toBeNull();
    expect(result.current.isLocating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('triggers getCurrentPosition when autoFetch is true', () => {
    renderHook(() => useGeolocation({ autoFetch: true }));

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('updates coordinates when geolocation succeeds', async () => {
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
  });

  it('handles permission denied error without losing default location', () => {
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
  });

  it('allows manual updating of location name', () => {
    const { result } = renderHook(() => useGeolocation({ autoFetch: false }));

    act(() => {
      result.current.setLocationName('Phở Thìn Lò Đúc, Hà Nội');
    });

    expect(result.current.locationName).toBe('Phở Thìn Lò Đúc, Hà Nội');
  });
});
