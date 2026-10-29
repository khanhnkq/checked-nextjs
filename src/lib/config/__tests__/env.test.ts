import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { requireEnv, optionalEnv, env } from '../env';

describe('Environment Validator (src/lib/config/env.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('bắt buộc ném lỗi rõ ràng khi biến môi trường bị trống hoặc không tồn tại', () => {
    delete process.env.TEST_MISSING_KEY;
    expect(() => requireEnv('TEST_MISSING_KEY')).toThrowError(
      '[Config Error] Biến môi trường bắt buộc "TEST_MISSING_KEY" đang bị trống hoặc chưa được cấu hình!'
    );

    process.env.TEST_EMPTY_KEY = '   ';
    expect(() => requireEnv('TEST_EMPTY_KEY')).toThrowError(
      '[Config Error] Biến môi trường bắt buộc "TEST_EMPTY_KEY" đang bị trống hoặc chưa được cấu hình!'
    );
  });

  it('trả về giá trị đã trim khi biến môi trường hợp lệ', () => {
    process.env.TEST_VALID_KEY = '  https://api.checked.app/v1  ';
    expect(requireEnv('TEST_VALID_KEY')).toBe('https://api.checked.app/v1');
  });

  it('env.apiBaseUrl ném lỗi khi NEXT_PUBLIC_API_BASE_URL bị trống', () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    expect(() => env.apiBaseUrl).toThrowError(
      '[Config Error] Biến môi trường bắt buộc "NEXT_PUBLIC_API_BASE_URL" đang bị trống hoặc chưa được cấu hình!'
    );
  });

  it('env.geminiApiKey ném lỗi khi GEMINI_API_KEY bị trống', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => env.geminiApiKey).toThrowError(
      '[Config Error] Biến môi trường bắt buộc "GEMINI_API_KEY" đang bị trống hoặc chưa được cấu hình!'
    );
  });

  it('optionalEnv trả về default value khi key không tồn tại', () => {
    delete process.env.TEST_OPTIONAL;
    expect(optionalEnv('TEST_OPTIONAL', 'default-val')).toBe('default-val');
  });
});
