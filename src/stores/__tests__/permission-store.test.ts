import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  usePermissionStore,
  PERMISSIONS_STORAGE_KEY,
  LOCATION_STORAGE_KEY,
  type CachedLocation,
} from '../permission-store';

describe('usePermissionStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePermissionStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('initializes with prompt permissions and unasked state by default', () => {
      const state = usePermissionStore.getState();
      expect(state.permissions).toEqual({
        camera: 'prompt',
        location: 'prompt',
      });
      expect(state.hasAsked).toEqual({
        camera: false,
        location: false,
      });
      expect(state.hasAskedCamera).toBe(false);
      expect(state.hasAskedLocation).toBe(false);
      expect(state.cachedLocation).toBeNull();
    });
  });

  describe('setPermission', () => {
    it('updates camera permission and synchronizes with localStorage', () => {
      usePermissionStore.getState().setPermission('camera', 'granted');

      const state = usePermissionStore.getState();
      expect(state.permissions.camera).toBe('granted');
      expect(state.hasAsked.camera).toBe(true);
      expect(state.hasAskedCamera).toBe(true);

      const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.permissions.camera).toBe('granted');
      expect(parsed.hasAsked.camera).toBe(true);
    });

    it('updates location permission and synchronizes with localStorage', () => {
      usePermissionStore.getState().setPermission('location', 'denied');

      const state = usePermissionStore.getState();
      expect(state.permissions.location).toBe('denied');
      expect(state.hasAsked.location).toBe(true);
      expect(state.hasAskedLocation).toBe(true);

      const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.permissions.location).toBe('denied');
      expect(parsed.hasAsked.location).toBe(true);
    });
  });

  describe('hasAsked persistence', () => {
    it('allows explicitly setting hasAsked without changing permission status', () => {
      usePermissionStore.getState().setHasAsked('camera', true);

      const state = usePermissionStore.getState();
      expect(state.hasAsked.camera).toBe(true);
      expect(state.hasAskedCamera).toBe(true);
      expect(state.permissions.camera).toBe('prompt');

      const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      const parsed = JSON.parse(raw!);
      expect(parsed.hasAsked.camera).toBe(true);
    });

    it('restores permissions and hasAsked from localStorage', () => {
      localStorage.setItem(
        PERMISSIONS_STORAGE_KEY,
        JSON.stringify({
          permissions: { camera: 'granted', location: 'denied' },
          hasAsked: { camera: true, location: true },
        })
      );

      usePermissionStore.getState().loadFromStorage();

      const state = usePermissionStore.getState();
      expect(state.permissions.camera).toBe('granted');
      expect(state.permissions.location).toBe('denied');
      expect(state.hasAsked.camera).toBe(true);
      expect(state.hasAsked.location).toBe(true);
      expect(state.hasAskedCamera).toBe(true);
      expect(state.hasAskedLocation).toBe(true);
    });
  });

  describe('cachedLocation', () => {
    const mockLocation: CachedLocation = {
      coords: {
        latitude: 10.7769,
        longitude: 106.7009,
        accuracy: 15,
      },
      locationName: 'Quận 1, TP. Hồ Chí Minh',
      timestamp: 1710000000000,
    };

    it('stores cached location in state and localStorage with key checked_last_location', () => {
      usePermissionStore.getState().setCachedLocation(mockLocation);

      const state = usePermissionStore.getState();
      expect(state.cachedLocation).toEqual(mockLocation);

      const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toEqual(mockLocation);
    });

    it('removes cached location when set to null', () => {
      usePermissionStore.getState().setCachedLocation(mockLocation);
      expect(localStorage.getItem(LOCATION_STORAGE_KEY)).toBeTruthy();

      usePermissionStore.getState().setCachedLocation(null);
      expect(usePermissionStore.getState().cachedLocation).toBeNull();
      expect(localStorage.getItem(LOCATION_STORAGE_KEY)).toBeNull();
    });

    it('loads cached location from localStorage on loadFromStorage', () => {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(mockLocation));

      usePermissionStore.getState().loadFromStorage();
      expect(usePermissionStore.getState().cachedLocation).toEqual(mockLocation);
    });
  });

  describe('checkSystemPermissions', () => {
    it('queries navigator.permissions when available and updates state', async () => {
      const cameraStatus = {
        state: 'granted',
        onchange: null as (() => void) | null,
      };
      const geoStatus = {
        state: 'prompt',
        onchange: null as (() => void) | null,
      };

      const queryMock = vi.fn().mockImplementation((desc: { name: string }) => {
        if (desc.name === 'camera') return Promise.resolve(cameraStatus);
        if (desc.name === 'geolocation') return Promise.resolve(geoStatus);
        return Promise.reject(new Error('Unknown permission'));
      });

      Object.defineProperty(navigator, 'permissions', {
        value: { query: queryMock },
        configurable: true,
        writable: true,
      });

      await usePermissionStore.getState().checkSystemPermissions();

      expect(queryMock).toHaveBeenCalledWith({ name: 'camera' });
      expect(queryMock).toHaveBeenCalledWith({ name: 'geolocation' });

      expect(usePermissionStore.getState().permissions.camera).toBe('granted');
      expect(usePermissionStore.getState().permissions.location).toBe('prompt');

      // Test onchange listener update
      if (cameraStatus.onchange) {
        cameraStatus.state = 'denied';
        cameraStatus.onchange();
        expect(usePermissionStore.getState().permissions.camera).toBe('denied');
      }
    });

    it('gracefully handles unsupported permission query (e.g. Safari camera query failure)', async () => {
      const geoStatus = {
        state: 'granted',
        onchange: null,
      };

      const queryMock = vi.fn().mockImplementation((desc: { name: string }) => {
        if (desc.name === 'camera') {
          return Promise.reject(new TypeError("Permission name 'camera' is not supported"));
        }
        if (desc.name === 'geolocation') {
          return Promise.resolve(geoStatus);
        }
        return Promise.reject(new Error('Unknown permission'));
      });

      Object.defineProperty(navigator, 'permissions', {
        value: { query: queryMock },
        configurable: true,
        writable: true,
      });

      await expect(
        usePermissionStore.getState().checkSystemPermissions()
      ).resolves.not.toThrow();

      expect(usePermissionStore.getState().permissions.location).toBe('granted');
    });

    it('does nothing if navigator.permissions is undefined', async () => {
      Object.defineProperty(navigator, 'permissions', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      await expect(
        usePermissionStore.getState().checkSystemPermissions()
      ).resolves.not.toThrow();
    });
  });

  describe('reset', () => {
    it('resets permissions, hasAsked, cachedLocation and storage', () => {
      usePermissionStore.getState().setPermission('camera', 'granted');
      usePermissionStore.getState().setCachedLocation({
        coords: { latitude: 10, longitude: 106 },
        locationName: 'Test',
        timestamp: 12345,
      });

      usePermissionStore.getState().reset();

      const state = usePermissionStore.getState();
      expect(state.permissions.camera).toBe('prompt');
      expect(state.permissions.location).toBe('prompt');
      expect(state.hasAsked.camera).toBe(false);
      expect(state.hasAsked.location).toBe(false);
      expect(state.cachedLocation).toBeNull();
      expect(localStorage.getItem(PERMISSIONS_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(LOCATION_STORAGE_KEY)).toBeNull();
    });
  });
});
