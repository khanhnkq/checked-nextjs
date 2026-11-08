import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/user';
import { isTokenExpired } from '@/lib/auth/jwt';
import { syncSessionCookies, clearSessionCookies } from '@/lib/auth/session-sync';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
}

export interface AuthActions {
  setSession: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setHydrated: (isHydrated: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

// Memory storage fallback cho SSR và môi trường test
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

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      isHydrated: false,

      setSession: (user, token) => {
        if (!token || isTokenExpired(token)) {
          get().logout();
          return;
        }

        // 1. Đồng bộ cookie trình duyệt tức thời
        if (typeof document !== 'undefined') {
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          document.cookie = `checked_token=${encodeURIComponent(token)}; path=/; max-age=${7 * 86400}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        }

        // 2. Cập nhật state đồng bộ
        set((state) => {
          state.user = user;
          state.accessToken = token;
          state.isAuthenticated = true;
          state.isLoading = false;
        });

        // 3. Đồng bộ server session cookie ở background
        syncSessionCookies(token).catch(() => {});
      },

      setAccessToken: (token) => {
        if (!token || isTokenExpired(token)) {
          get().logout();
          return;
        }

        if (typeof document !== 'undefined') {
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          document.cookie = `checked_token=${encodeURIComponent(token)}; path=/; max-age=${7 * 86400}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        }

        set((state) => {
          state.accessToken = token;
          state.isAuthenticated = true;
        });
      },

      updateUser: (partial) =>
        set((state) => {
          if (state.user) {
            Object.assign(state.user, partial);
          }
        }),

      logout: () => {
        // 1. Xóa cookie client-side tức thì
        if (typeof document !== 'undefined') {
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          document.cookie = `checked_token=; path=/; max-age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        }

        // 2. Xóa store state
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        });

        // 3. Xóa cookie server-side
        clearSessionCookies().catch(() => {});
      },

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setHydrated: (isHydrated) =>
        set((state) => {
          state.isHydrated = isHydrated;
        }),
    })),
    {
      name: 'checked-auth-store',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Nếu token đã hết hạn trong lúc offline / reload -> tự động logout
        if (state.accessToken && isTokenExpired(state.accessToken)) {
          state.logout();
        } else if (state.accessToken && typeof document !== 'undefined') {
          // Đảm bảo cookie luôn khớp với token trong localStorage
          document.cookie = `checked_token=${encodeURIComponent(state.accessToken)}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
        }

        state.setLoading(false);
        state.setHydrated(true);
      },
    }
  )
);
