'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePermissionStore } from '@/stores/permission-store';

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UseGeolocationOptions {
  autoFetch?: boolean;
  defaultLocationName?: string;
  cacheTtlMs?: number;
}

export interface UseGeolocationReturn {
  locationName: string;
  coords: GeolocationCoords | null;
  isLocating: boolean;
  error: string | null;
  refreshLocation: () => void;
  setLocationName: (name: string) => void;
}

export const LOCATION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Chuyển đổi tọa độ GPS sang tên địa phương (Quận/Huyện, Tỉnh/Thành phố)
 */
export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<string | null> {
  // Bỏ qua trong môi trường test/SSR
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const address = data?.address;
    if (!address) return null;

    const district =
      address.suburb ||
      address.quarter ||
      address.city_district ||
      address.district ||
      address.town;
    const city = address.city || address.province || address.state;

    if (district && city) {
      return `${district}, ${city}`;
    }
    return city || district || null;
  } catch {
    return null;
  }
}

/**
 * useGeolocation
 * Hook quản lý định vị GPS, chuyển đổi địa danh và cache vị trí bền vững.
 * Tái hiện 100% logic của LocationService.swift trên Checked iOS.
 */
export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    autoFetch = true,
    defaultLocationName = 'TP. Hồ Chí Minh',
    cacheTtlMs = LOCATION_CACHE_TTL,
  } = options;

  const cachedLocation = usePermissionStore((state) => state.cachedLocation);
  const locationPermission = usePermissionStore((state) => state.permissions.location);

  const [locationName, setLocationName] = useState<string>(
    () => cachedLocation?.locationName || defaultLocationName
  );
  const [coords, setCoords] = useState<GeolocationCoords | null>(
    () => cachedLocation?.coords || null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const locationNameRef = useRef(locationName);

  useEffect(() => {
    locationNameRef.current = locationName;
  }, [locationName]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Đồng bộ state khi cachedLocation trong store thay đổi
  useEffect(() => {
    if (cachedLocation) {
      setLocationName(cachedLocation.locationName);
      setCoords(cachedLocation.coords);
    }
  }, [cachedLocation]);

  const refreshLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Thiết bị không hỗ trợ định vị Geolocation');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!isMountedRef.current) return;
        const newCoords: GeolocationCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCoords(newCoords);

        // Cập nhật trạng thái quyền vị trí thành granted
        usePermissionStore.getState().setPermission('location', 'granted');

        // Reverse Geocoding
        let placeName = await reverseGeocodeCoords(newCoords.latitude, newCoords.longitude);
        if (isMountedRef.current) {
          if (placeName) {
            setLocationName(placeName);
          }
          setIsLocating(false);
        }

        const finalPlaceName = placeName || locationNameRef.current || defaultLocationName;

        // Lưu vị trí vào cache store và localStorage
        usePermissionStore.getState().setCachedLocation({
          coords: newCoords,
          locationName: finalPlaceName,
          timestamp: Date.now(),
        });
      },
      (geoError) => {
        if (!isMountedRef.current) return;
        setIsLocating(false);
        setError(geoError.message);
        // Code 1 tương ứng PERMISSION_DENIED
        if (geoError.code === 1) {
          usePermissionStore.getState().setPermission('location', 'denied');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }, [defaultLocationName]);

  useEffect(() => {
    if (!autoFetch) return;

    const currentPermission = usePermissionStore.getState().permissions.location;
    const currentCached = usePermissionStore.getState().cachedLocation;

    // Không tự động xin lại nếu người dùng đã từ chối
    if (currentPermission === 'denied') {
      return;
    }

    // Nếu đã có cache còn hạn, không gọi lại getCurrentPosition
    if (currentCached) {
      const isFresh = Date.now() - currentCached.timestamp < cacheTtlMs;
      if (isFresh) {
        return;
      }
    }

    refreshLocation();
  }, [autoFetch, cacheTtlMs, refreshLocation]);

  return {
    locationName,
    coords,
    isLocating,
    error,
    refreshLocation,
    setLocationName,
  };
}
