'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import * as userSettingsApi from '@/lib/api/user-settings-api';
import { useAuthStore } from '@/stores/auth-store';

export const SETTINGS_QUERY_KEY = ['/api/v1/users/me/settings/personal-info'] as const;
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface UseSettingsActionsReturn {
  isUpdating: boolean;
  isUploadingAvatar: boolean;
  isLoggingOut: boolean;
  updateName: (firstName: string, lastName: string) => Promise<void>;
  updateDob: (dob: string) => Promise<void>;
  uploadAvatarFile: (file: File) => Promise<void>;
  logoutAccount: () => Promise<void>;
}

/**
 * useSettingsActions
 * Hook điều phối cập nhật tên, ngày sinh, tải lên avatar kèm kiểm tra dung lượng <= 5MB,
 * và điều hướng đăng xuất tài khoản sạch sẽ (cookie/Zustand purge + redirection).
 */
export function useSettingsActions(): UseSettingsActionsReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const updateName = useCallback(
    async (firstName: string, lastName: string): Promise<void> => {
      setIsUpdating(true);
      try {
        const updatedUser = await userSettingsApi.updatePersonalInfo({
          firstName,
          lastName,
        });

        if (updatedUser) {
          useAuthStore.getState().updateUser(updatedUser);
          queryClient.setQueryData(SETTINGS_QUERY_KEY, updatedUser);
        } else {
          useAuthStore.getState().updateUser({ firstName, lastName });
        }

        await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      } finally {
        setIsUpdating(false);
      }
    },
    [queryClient]
  );

  const updateDob = useCallback(
    async (dob: string): Promise<void> => {
      setIsUpdating(true);
      try {
        const updatedUser = await userSettingsApi.updatePersonalInfo({ dob });

        if (updatedUser) {
          useAuthStore.getState().updateUser(updatedUser);
          queryClient.setQueryData(SETTINGS_QUERY_KEY, updatedUser);
        } else {
          useAuthStore.getState().updateUser({ dob });
        }

        await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      } finally {
        setIsUpdating(false);
      }
    },
    [queryClient]
  );

  const uploadAvatarFile = useCallback(
    async (file: File): Promise<void> => {
      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        throw new Error('Dung lượng ảnh tối đa là 5MB');
      }

      setIsUploadingAvatar(true);
      try {
        const updatedUser = await userSettingsApi.uploadAvatar(file);

        if (updatedUser) {
          useAuthStore.getState().updateUser(updatedUser);
          queryClient.setQueryData(SETTINGS_QUERY_KEY, updatedUser);
        }

        await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [queryClient]
  );

  const logoutAccount = useCallback(async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'checked_token=; Max-Age=0; path=/;';
      }
      useAuthStore.getState().logout();
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  return {
    isUpdating,
    isUploadingAvatar,
    isLoggingOut,
    updateName,
    updateDob,
    uploadAvatarFile,
    logoutAccount,
  };
}
