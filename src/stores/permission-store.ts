import { create } from 'zustand';

export type PermissionType = 'camera' | 'location';
export type AppPermissionStatus = 'prompt' | 'granted' | 'denied';

export interface CachedLocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface CachedLocation {
  coords: CachedLocationCoords;
  locationName: string;
  timestamp: number;
}

export interface PermissionState {
  permissions: {
    camera: AppPermissionStatus;
    location: AppPermissionStatus;
  };
  hasAsked: {
    camera: boolean;
    location: boolean;
  };
  hasAskedCamera: boolean;
  hasAskedLocation: boolean;
  cachedLocation: CachedLocation | null;
}

export interface PermissionActions {
  setPermission: (type: PermissionType, status: AppPermissionStatus) => void;
  setHasAsked: (type: PermissionType, asked?: boolean) => void;
  setCachedLocation: (location: CachedLocation | null) => void;
  loadFromStorage: () => void;
  checkSystemPermissions: () => Promise<void>;
  reset: () => void;
}

export type PermissionStore = PermissionState & PermissionActions;

export const PERMISSIONS_STORAGE_KEY = 'checked_permissions_v1';
export const LOCATION_STORAGE_KEY = 'checked_last_location';

const memoryStorage = new Map<string, string>();

export const safeLocalStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return memoryStorage.get(name) || null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return memoryStorage.get(name) || null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') {
      memoryStorage.set(name, value);
      return;
    }
    try {
      window.localStorage.setItem(name, value);
    } catch {
      memoryStorage.set(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') {
      memoryStorage.delete(name);
      return;
    }
    try {
      window.localStorage.removeItem(name);
    } catch {
      memoryStorage.delete(name);
    }
  },
};

const DEFAULT_STATE: PermissionState = {
  permissions: {
    camera: 'prompt',
    location: 'prompt',
  },
  hasAsked: {
    camera: false,
    location: false,
  },
  hasAskedCamera: false,
  hasAskedLocation: false,
  cachedLocation: null,
};

function readStoredPermissions(): Pick<
  PermissionState,
  'permissions' | 'hasAsked' | 'hasAskedCamera' | 'hasAskedLocation'
> {
  const raw = safeLocalStorage.getItem(PERMISSIONS_STORAGE_KEY);
  if (!raw) {
    return {
      permissions: { ...DEFAULT_STATE.permissions },
      hasAsked: { ...DEFAULT_STATE.hasAsked },
      hasAskedCamera: DEFAULT_STATE.hasAskedCamera,
      hasAskedLocation: DEFAULT_STATE.hasAskedLocation,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const cameraPerm = parsed.permissions?.camera ?? DEFAULT_STATE.permissions.camera;
    const locationPerm = parsed.permissions?.location ?? DEFAULT_STATE.permissions.location;
    const cameraAsked = Boolean(parsed.hasAsked?.camera ?? parsed.hasAskedCamera);
    const locationAsked = Boolean(parsed.hasAsked?.location ?? parsed.hasAskedLocation);

    return {
      permissions: {
        camera: cameraPerm,
        location: locationPerm,
      },
      hasAsked: {
        camera: cameraAsked,
        location: locationAsked,
      },
      hasAskedCamera: cameraAsked,
      hasAskedLocation: locationAsked,
    };
  } catch {
    return {
      permissions: { ...DEFAULT_STATE.permissions },
      hasAsked: { ...DEFAULT_STATE.hasAsked },
      hasAskedCamera: DEFAULT_STATE.hasAskedCamera,
      hasAskedLocation: DEFAULT_STATE.hasAskedLocation,
    };
  }
}

function readStoredLocation(): CachedLocation | null {
  const raw = safeLocalStorage.getItem(LOCATION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CachedLocation;
  } catch {
    return null;
  }
}

function persistPermissions(
  permissions: PermissionState['permissions'],
  hasAsked: PermissionState['hasAsked']
) {
  const payload = {
    permissions,
    hasAsked,
    hasAskedCamera: hasAsked.camera,
    hasAskedLocation: hasAsked.location,
  };
  safeLocalStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(payload));
}

function persistLocation(location: CachedLocation | null) {
  if (location === null) {
    safeLocalStorage.removeItem(LOCATION_STORAGE_KEY);
  } else {
    safeLocalStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  }
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  ...DEFAULT_STATE,
  ...readStoredPermissions(),
  cachedLocation: readStoredLocation(),

  setPermission: (type: PermissionType, status: AppPermissionStatus) => {
    set((state) => {
      const updatedPermissions = {
        ...state.permissions,
        [type]: status,
      };

      const updatedHasAsked = {
        ...state.hasAsked,
        [type]: status !== 'prompt' ? true : state.hasAsked[type],
      };

      persistPermissions(updatedPermissions, updatedHasAsked);

      return {
        permissions: updatedPermissions,
        hasAsked: updatedHasAsked,
        hasAskedCamera: updatedHasAsked.camera,
        hasAskedLocation: updatedHasAsked.location,
      };
    });
  },

  setHasAsked: (type: PermissionType, asked = true) => {
    set((state) => {
      const updatedHasAsked = {
        ...state.hasAsked,
        [type]: asked,
      };

      persistPermissions(state.permissions, updatedHasAsked);

      return {
        hasAsked: updatedHasAsked,
        hasAskedCamera: updatedHasAsked.camera,
        hasAskedLocation: updatedHasAsked.location,
      };
    });
  },

  setCachedLocation: (location: CachedLocation | null) => {
    persistLocation(location);
    set({ cachedLocation: location });
  },

  loadFromStorage: () => {
    const storedPermissions = readStoredPermissions();
    const storedLocation = readStoredLocation();

    set({
      ...storedPermissions,
      cachedLocation: storedLocation,
    });
  },

  checkSystemPermissions: async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.permissions ||
      typeof navigator.permissions.query !== 'function'
    ) {
      return;
    }

    // Check camera permission
    try {
      const cameraResult = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });

      if (cameraResult && cameraResult.state) {
        get().setPermission('camera', cameraResult.state as AppPermissionStatus);
        cameraResult.onchange = () => {
          get().setPermission('camera', cameraResult.state as AppPermissionStatus);
        };
      }
    } catch {
      // Some browsers (e.g. Safari / Firefox) don't support querying 'camera'
    }

    // Check geolocation permission
    try {
      const geoResult = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });

      if (geoResult && geoResult.state) {
        get().setPermission('location', geoResult.state as AppPermissionStatus);
        geoResult.onchange = () => {
          get().setPermission('location', geoResult.state as AppPermissionStatus);
        };
      }
    } catch {
      // Ignore unsupported geolocation query
    }
  },

  reset: () => {
    safeLocalStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    safeLocalStorage.removeItem(LOCATION_STORAGE_KEY);
    set({
      ...DEFAULT_STATE,
    });
  },
}));
