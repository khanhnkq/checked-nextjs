import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PreferencesState {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  autoSavePhotos: boolean;
}

export interface PreferencesActions {
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAutoSavePhotos: (enabled: boolean) => void;
  toggleHaptics: () => void;
  toggleSound: () => void;
  toggleAutoSavePhotos: () => void;
}

export type PreferencesStore = PreferencesState & PreferencesActions;

const memoryStorage = new Map<string, string>();

const safeLocalStorage = {
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

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      hapticsEnabled: true,
      soundEnabled: true,
      autoSavePhotos: false,

      setHapticsEnabled: (enabled: boolean) => set({ hapticsEnabled: enabled }),
      setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
      setAutoSavePhotos: (enabled: boolean) => set({ autoSavePhotos: enabled }),

      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleAutoSavePhotos: () => set((state) => ({ autoSavePhotos: !state.autoSavePhotos })),
    }),
    {
      name: 'checked-preferences',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
