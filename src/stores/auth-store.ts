import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setSession: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

// In-memory fallback cho môi trường không có IndexedDB (như SSR hoặc jsdom test)
const memoryStorage = new Map<string, string>();

// IndexedDB Storage Adapter cho Zustand Persist
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    if (typeof indexedDB === 'undefined') return memoryStorage.get(name) || null;
    try {
      return (await get(name)) || null;
    } catch {
      return memoryStorage.get(name) || null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    if (typeof indexedDB === 'undefined') {
      memoryStorage.set(name, value);
      return;
    }
    try {
      await set(name, value);
    } catch {
      memoryStorage.set(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    if (typeof indexedDB === 'undefined') {
      memoryStorage.delete(name);
      return;
    }
    try {
      await del(name);
    } catch {
      memoryStorage.delete(name);
    }
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setSession: (user, token) =>
        set((state) => {
          state.user = user;
          state.accessToken = token;
          state.isAuthenticated = true;
          state.isLoading = false;
        }),

      setAccessToken: (token) =>
        set((state) => {
          state.accessToken = token;
        }),

      updateUser: (partial) =>
        set((state) => {
          if (state.user) {
            Object.assign(state.user, partial);
          }
        }),

      logout: () =>
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        }),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),
    })),
    {
      name: 'checked-auth-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
