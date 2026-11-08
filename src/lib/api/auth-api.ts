import { customFetcher } from './custom-fetcher';

export interface ResendOtpRequest {
  email: string;
}

export interface RegisterResponse {
  message?: string;
  email?: string;
  nextStep?: string;
}

/**
 * Gửi lại mã OTP xác thực mà không làm thay đổi hay ghi đè mật khẩu của người dùng.
 */
export async function resendOtp(data: ResendOtpRequest): Promise<RegisterResponse> {
  return customFetcher<RegisterResponse>({
    url: '/api/v1/auth/resend-otp',
    method: 'POST',
    data,
  });
}
