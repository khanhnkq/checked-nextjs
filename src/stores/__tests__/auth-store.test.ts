import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../auth-store';

function createValidJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 })
  ).toString('base64url');
  return `${header}.${payload}.sig`;
}

function createExpiredJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 100 })
  ).toString('base64url');
  return `${header}.${payload}.sig`;
}

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

  it('setSession lưu trữ thông tin user và accessToken thành công khi token còn hạn', () => {
    const mockUser = {
      id: 'user-123',
      email: 'khanh@vku.udn.vn',
      username: 'khanhnkq',
      displayName: 'Nguyễn Kim Quốc Khánh',
      isVerified: true,
      profileCompleted: true,
      isGoldMember: false,
    };
    const validToken = createValidJwt();

    useAuthStore.getState().setSession(mockUser, validToken);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe(validToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it('setSession từ chối token đã hết hạn và đưa về trạng thái unauthenticated', () => {
    const mockUser = {
      id: 'user-123',
      email: 'khanh@vku.udn.vn',
      username: 'khanhnkq',
      displayName: 'Khánh',
      isVerified: true,
      profileCompleted: true,
      isGoldMember: false,
    };
    const expiredToken = createExpiredJwt();

    useAuthStore.getState().setSession(mockUser, expiredToken);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
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
    const validToken = createValidJwt();

    useAuthStore.getState().setSession(mockUser, validToken);
    useAuthStore.getState().updateUser({ profileCompleted: true, displayName: 'Quốc Khánh Checked' });

    const updatedUser = useAuthStore.getState().user;
    expect(updatedUser?.profileCompleted).toBe(true);
    expect(updatedUser?.displayName).toBe('Quốc Khánh Checked');
    expect(updatedUser?.email).toBe('khanh@vku.udn.vn');
  });

  it('logout xóa sạch token và đặt isAuthenticated về false', () => {
    const validToken = createValidJwt();
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
      validToken
    );

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
