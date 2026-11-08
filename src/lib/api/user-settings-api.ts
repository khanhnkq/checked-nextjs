import { customFetcher } from './custom-fetcher';
import type { User } from '@/types/user';

export interface UpdatePersonalInfoRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  dob?: string | null;
}

/**
 * Lấy thông tin cá nhân của người dùng hiện tại trong màn hình Cài đặt.
 */
export const getCurrentUserPersonalInfo = async (signal?: AbortSignal): Promise<User> => {
  return customFetcher<User>('/api/v1/users/me/settings/personal-info', {
    method: 'GET',
    signal,
  });
};

/**
 * Cập nhật thông tin cá nhân (họ tên, username, ngày sinh, avatarUrl).
 */
export const updatePersonalInfo = async (
  data: UpdatePersonalInfoRequest,
  signal?: AbortSignal
): Promise<User> => {
  return customFetcher<User>('/api/v1/users/me/settings/personal-info', {
    method: 'PATCH',
    data,
    signal,
  });
};

/**
 * Tải lên và cập nhật ảnh đại diện mới qua Garage S3 multipart/form-data.
 */
export const uploadAvatar = async (file: File, signal?: AbortSignal): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);

  return customFetcher<User>('/api/v1/users/me/settings/avatar', {
    method: 'PATCH',
    data: formData,
    signal,
  });
};
