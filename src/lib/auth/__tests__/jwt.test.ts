import { describe, it, expect } from 'vitest';
import { parseJwt, isTokenExpired, getTokenRemainingMs } from '../jwt';

function createMockJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = Buffer.from('mock-signature').toString('base64url');
  return `${header}.${body}.${sig}`;
}

describe('JWT Utilities (parseJwt, isTokenExpired)', () => {
  it('trả về null và coi như expired đối với token rỗng hoặc không hợp lệ', () => {
    expect(parseJwt(null)).toBeNull();
    expect(parseJwt(undefined)).toBeNull();
    expect(parseJwt('')).toBeNull();
    expect(parseJwt('invalid.token')).toBeNull();
    expect(parseJwt('not-a-jwt')).toBeNull();

    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired(undefined)).toBe(true);
    expect(isTokenExpired('')).toBe(true);
    expect(isTokenExpired('garbage-token')).toBe(true);
    expect(getTokenRemainingMs('')).toBe(0);
  });

  it('giải mã chính xác payload của token hợp lệ', () => {
    const payload = {
      sub: 'khanhnkqdev',
      userId: 'uuid-1234',
      name: 'Nguyễn Kim Quốc Khánh',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = createMockJwt(payload);

    const parsed = parseJwt(token);
    expect(parsed?.sub).toBe('khanhnkqdev');
    expect(parsed?.userId).toBe('uuid-1234');
    expect(parsed?.name).toBe('Nguyễn Kim Quốc Khánh');
    expect(parsed?.exp).toBe(payload.exp);
  });

  it('xác định chính xác token đã hết hạn', () => {
    const expiredPayload = {
      sub: 'khanhnkqdev',
      exp: Math.floor(Date.now() / 1000) - 100, // hết hạn 100s trước
    };
    const expiredToken = createMockJwt(expiredPayload);

    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(getTokenRemainingMs(expiredToken)).toBe(0);
  });

  it('xác định token hợp lệ và còn hạn', () => {
    const validPayload = {
      sub: 'khanhnkqdev',
      exp: Math.floor(Date.now() / 1000) + 7200, // còn hạn 2 tiếng
    };
    const validToken = createMockJwt(validPayload);

    expect(isTokenExpired(validToken)).toBe(false);
    expect(getTokenRemainingMs(validToken)).toBeGreaterThan(7000 * 1000);
  });

  it('áp dụng bufferSeconds để phòng ngừa expired race conditions', () => {
    const nearExpiryPayload = {
      sub: 'khanhnkqdev',
      exp: Math.floor(Date.now() / 1000) + 15, // còn hạn 15s
    };
    const nearExpiryToken = createMockJwt(nearExpiryPayload);

    // Với buffer mặc định 30s, token còn 15s bị coi là sắp hết hạn -> true
    expect(isTokenExpired(nearExpiryToken, 30)).toBe(true);
    // Với buffer 5s, token còn 15s vẫn coi là hợp lệ -> false
    expect(isTokenExpired(nearExpiryToken, 5)).toBe(false);
  });
});
