import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../auth-store';

describe('Auth Store (useAuthStore)', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('khởi tạo với trạng thái ban đầu chính xác', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setSession lưu trữ thông tin user và accessToken thành công', () => {
    const mockUser = {
      id: 'user-123',
      email: 'khanh@vku.udn.vn',
      username: 'khanhnkq',
      displayName: 'Nguyễn Kim Quốc Khánh',
      isVerified: true,
      profileCompleted: true,
      isGoldMember: false,
    };

    useAuthStore.getState().setSession(mockUser, 'mock-jwt-access-token');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('mock-jwt-access-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('updateUser cập nhật từng trường dữ liệu mà không làm mất thông tin cũ', () => {
    const mockUser = {
      id: 'user-123',
      email: 'khanh@vku.udn.vn',
      username: 'khanhnkq',
      displayName: 'Nguyễn Kim Quốc Khánh',
      isVerified: true,
      profileCompleted: false,
      isGoldMember: false,
    };

    useAuthStore.getState().setSession(mockUser, 'mock-jwt-token');
    useAuthStore.getState().updateUser({ profileCompleted: true, displayName: 'Quốc Khánh Checked' });

    const updatedUser = useAuthStore.getState().user;
    expect(updatedUser?.profileCompleted).toBe(true);
    expect(updatedUser?.displayName).toBe('Quốc Khánh Checked');
    expect(updatedUser?.email).toBe('khanh@vku.udn.vn');
  });

  it('logout xóa sạch token và đặt isAuthenticated về false', () => {
    useAuthStore.getState().setSession(
      {
        id: 'user-123',
        email: 'khanh@vku.udn.vn',
        username: 'khanhnkq',
        displayName: 'Khánh',
        isVerified: true,
        profileCompleted: true,
        isGoldMember: true,
      },
      'token-xyz'
    );

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
