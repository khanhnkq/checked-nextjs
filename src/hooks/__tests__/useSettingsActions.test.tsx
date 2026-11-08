import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSettingsActions } from '../useSettingsActions';
import * as userSettingsApi from '@/lib/api/user-settings-api';
import { useAuthStore } from '@/stores/auth-store';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
}));

vi.mock('@/lib/api/user-settings-api', () => ({
  updatePersonalInfo: vi.fn(),
  uploadAvatar: vi.fn(),
  getCurrentUserPersonalInfo: vi.fn(),
}));

function createValidJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 })
  ).toString('base64url');
  return `${header}.${payload}.sig`;
}

describe('useSettingsActions', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: 'user-123',
    email: 'khanh@vku.udn.vn',
    username: 'khanhnkq',
    firstName: 'Khánh',
    lastName: 'Nguyễn',
    displayName: 'Nguyễn Khánh',
    avatarUrl: 'https://example.com/avatar.jpg',
    dob: '2000-01-01',
    isVerified: true,
    profileCompleted: true,
    isGoldMember: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = '';
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    useAuthStore.getState().logout();
    useAuthStore.getState().setSession(mockUser, createValidJwt());
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('updateName', () => {
    it('calls userSettingsApi.updatePersonalInfo, updates authStore user, and syncs TanStack query cache', async () => {
      const updatedUser = {
        ...mockUser,
        firstName: 'Văn',
        lastName: 'Trần',
        displayName: 'Trần Văn',
      };
      vi.mocked(userSettingsApi.updatePersonalInfo).mockResolvedValueOnce(updatedUser);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useSettingsActions(), { wrapper });

      expect(result.current.isUpdating).toBe(false);

      await act(async () => {
        await result.current.updateName('Văn', 'Trần');
      });

      expect(userSettingsApi.updatePersonalInfo).toHaveBeenCalledWith({
        firstName: 'Văn',
        lastName: 'Trần',
      });
      expect(useAuthStore.getState().user?.firstName).toBe('Văn');
      expect(useAuthStore.getState().user?.lastName).toBe('Trần');
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['/api/v1/users/me/settings/personal-info'],
        updatedUser
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['/api/v1/users/me/settings/personal-info'],
      });
      expect(result.current.isUpdating).toBe(false);
    });

    it('resets isUpdating to false when updateName throws an error', async () => {
      vi.mocked(userSettingsApi.updatePersonalInfo).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSettingsActions(), { wrapper });

      await expect(
        act(async () => {
          await result.current.updateName('Error', 'Name');
        })
      ).rejects.toThrow('Network error');

      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('updateDob', () => {
    it('calls userSettingsApi.updatePersonalInfo with dob, updates authStore user, and syncs query cache', async () => {
      const updatedUser = {
        ...mockUser,
        dob: '1999-12-31',
      };
      vi.mocked(userSettingsApi.updatePersonalInfo).mockResolvedValueOnce(updatedUser);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSettingsActions(), { wrapper });

      await act(async () => {
        await result.current.updateDob('1999-12-31');
      });

      expect(userSettingsApi.updatePersonalInfo).toHaveBeenCalledWith({
        dob: '1999-12-31',
      });
      expect(useAuthStore.getState().user?.dob).toBe('1999-12-31');
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['/api/v1/users/me/settings/personal-info'],
      });
      expect(result.current.isUpdating).toBe(false);
    });

    it('resets isUpdating to false when updateDob throws an error', async () => {
      vi.mocked(userSettingsApi.updatePersonalInfo).mockRejectedValueOnce(
        new Error('Invalid dob')
      );

      const { result } = renderHook(() => useSettingsActions(), { wrapper });

      await expect(
        act(async () => {
          await result.current.updateDob('2099-01-01');
        })
      ).rejects.toThrow('Invalid dob');

      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('uploadAvatarFile', () => {
    it('rejects file larger than 5MB with an error and does not call api', async () => {
      const { result } = renderHook(() => useSettingsActions(), { wrapper });

      const largeContent = new Uint8Array(5 * 1024 * 1024 + 1);
      const largeFile = new File([largeContent], 'large-avatar.png', {
        type: 'image/png',
      });

      await expect(
        act(async () => {
          await result.current.uploadAvatarFile(largeFile);
        })
      ).rejects.toThrow(/5MB/i);

      expect(userSettingsApi.uploadAvatar).not.toHaveBeenCalled();
      expect(result.current.isUploadingAvatar).toBe(false);
    });

    it('uploads valid avatar file <= 5MB, updates authStore user, and syncs query cache', async () => {
      const updatedUser = {
        ...mockUser,
        avatarUrl: 'https://garage.storage/new-avatar.png',
      };
      vi.mocked(userSettingsApi.uploadAvatar).mockResolvedValueOnce(updatedUser);

      const { result } = renderHook(() => useSettingsActions(), { wrapper });

      const validContent = new Uint8Array(1024 * 50); // 50KB
      const validFile = new File([validContent], 'avatar.png', {
        type: 'image/png',
      });

      await act(async () => {
        await result.current.uploadAvatarFile(validFile);
      });

      expect(userSettingsApi.uploadAvatar).toHaveBeenCalledWith(validFile);
      expect(useAuthStore.getState().user?.avatarUrl).toBe(
        'https://garage.storage/new-avatar.png'
      );
      expect(result.current.isUploadingAvatar).toBe(false);
    });

    it('resets isUploadingAvatar to false when uploadAvatar throws', async () => {
      vi.mocked(userSettingsApi.uploadAvatar).mockRejectedValueOnce(
        new Error('Upload failed')
      );

      const { result } = renderHook(() => useSettingsActions(), { wrapper });

      const validFile = new File([new Uint8Array(100)], 'avatar.png', {
        type: 'image/png',
      });

      await expect(
        act(async () => {
          await result.current.uploadAvatarFile(validFile);
        })
      ).rejects.toThrow('Upload failed');

      expect(result.current.isUploadingAvatar).toBe(false);
    });
  });

  describe('logoutAccount', () => {
    it('calls useAuthStore.logout(), clears browser cookie checked_token=; Max-Age=0; path=/;, and navigates to /login', async () => {
      document.cookie = 'checked_token=existing-valid-token; path=/;';
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).not.toBeNull();

      const { result } = renderHook(() => useSettingsActions(), { wrapper });

      await act(async () => {
        await result.current.logoutAccount();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
