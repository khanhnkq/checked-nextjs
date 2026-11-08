import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resendOtp } from '../auth-api';
import { customFetcher } from '../custom-fetcher';

vi.mock('../custom-fetcher', () => ({
  customFetcher: vi.fn(),
}));

describe('Auth API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resendOtp', () => {
    it('gọi POST /api/v1/auth/resend-otp với payload email', async () => {
      const mockResponse = {
        message: 'Mã OTP mới đã được gửi tới email của bạn',
        email: 'test@example.com',
        nextStep: 'VERIFY_OTP',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockResponse);

      const result = await resendOtp({ email: 'test@example.com' });

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/auth/resend-otp',
        method: 'POST',
        data: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
