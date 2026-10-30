'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UseGeolocationOptions {
  autoFetch?: boolean;
  defaultLocationName?: string;
}

export interface UseGeolocationReturn {
  locationName: string;
  coords: GeolocationCoords | null;
  isLocating: boolean;
  error: string | null;
  refreshLocation: () => void;
  setLocationName: (name: string) => void;
}

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
 * Hook quản lý định vị GPS và chuyển đổi địa danh.
 * Tái hiện 100% logic của LocationService.swift trên Checked iOS.
 */
export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const { autoFetch = true, defaultLocationName = 'TP. Hồ Chí Minh' } = options;

  const [locationName, setLocationName] = useState(defaultLocationName);
  const [coords, setCoords] = useState<GeolocationCoords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

        // Reverse Geocoding
        const placeName = await reverseGeocodeCoords(newCoords.latitude, newCoords.longitude);
        if (isMountedRef.current) {
          if (placeName) {
            setLocationName(placeName);
          }
          setIsLocating(false);
        }
      },
      (geoError) => {
        if (!isMountedRef.current) return;
        setIsLocating(false);
        setError(geoError.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      refreshLocation();
    }
  }, [autoFetch, refreshLocation]);

  return {
    locationName,
    coords,
    isLocating,
    error,
    refreshLocation,
    setLocationName,
  };
}
