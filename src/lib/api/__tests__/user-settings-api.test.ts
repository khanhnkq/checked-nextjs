import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updatePersonalInfo,
  uploadAvatar,
  getCurrentUserPersonalInfo,
} from '../user-settings-api';
import { customFetcher } from '../custom-fetcher';
import type { User } from '@/types/user';
import type { UpdatePersonalInfoRequest } from '../user-settings-api';

vi.mock('../custom-fetcher', () => ({
  customFetcher: vi.fn(),
}));

describe('User Settings API Client', () => {
  const mockUser: User = {
    id: 'user-456',
    email: 'user@example.com',
    username: 'testuser',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: 'https://example.com/avatar.jpg',
    dob: '1995-05-15',
    isVerified: true,
    profileCompleted: true,
    isGoldMember: false,
    bio: 'Hello world',
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUserPersonalInfo', () => {
    it('gọi GET /api/v1/users/me/settings/personal-info và trả về User', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(mockUser);
      const controller = new AbortController();

      const result = await getCurrentUserPersonalInfo(controller.signal);

      expect(customFetcher).toHaveBeenCalledWith(
        '/api/v1/users/me/settings/personal-info',
        {
          method: 'GET',
          signal: controller.signal,
        }
      );
      expect(result).toEqual(mockUser);
    });

    it('hoạt động không cần abort signal', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(mockUser);

      const result = await getCurrentUserPersonalInfo();

      expect(customFetcher).toHaveBeenCalledWith(
        '/api/v1/users/me/settings/personal-info',
        {
          method: 'GET',
          signal: undefined,
        }
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('updatePersonalInfo', () => {
    it('gọi PATCH /api/v1/users/me/settings/personal-info với payload và trả về User đã cập nhật', async () => {
      const updatedUser: User = { ...mockUser, firstName: 'NewFirst', lastName: 'NewLast', dob: '2000-01-01' };
      vi.mocked(customFetcher).mockResolvedValueOnce(updatedUser);
      const updateData: UpdatePersonalInfoRequest = {
        firstName: 'NewFirst',
        lastName: 'NewLast',
        dob: '2000-01-01',
      };
      const controller = new AbortController();

      const result = await updatePersonalInfo(updateData, controller.signal);

      expect(customFetcher).toHaveBeenCalledWith(
        '/api/v1/users/me/settings/personal-info',
        {
          method: 'PATCH',
          data: updateData,
          signal: controller.signal,
        }
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('uploadAvatar', () => {
    it('gọi PATCH /api/v1/users/me/settings/avatar với FormData và trả về User đã cập nhật', async () => {
      const updatedUser: User = { ...mockUser, avatarUrl: 'https://garage.example.com/avatar.jpg' };
      vi.mocked(customFetcher).mockResolvedValueOnce(updatedUser);

      const fakeFile = new File(['dummy-image-content'], 'avatar.jpg', { type: 'image/jpeg' });
      const controller = new AbortController();

      const result = await uploadAvatar(fakeFile, controller.signal);

      expect(customFetcher).toHaveBeenCalledTimes(1);
      expect(customFetcher).toHaveBeenCalledWith(
        '/api/v1/users/me/settings/avatar',
        expect.objectContaining({
          method: 'PATCH',
          signal: controller.signal,
          data: expect.any(FormData),
        })
      );

      const calls = vi.mocked(customFetcher).mock.calls as unknown as [string, { data?: FormData }][];
      const formData = calls[0][1]?.data;
      expect(formData?.get('file')).toEqual(fakeFile);
      expect(result).toEqual(updatedUser);
    });
  });
});
