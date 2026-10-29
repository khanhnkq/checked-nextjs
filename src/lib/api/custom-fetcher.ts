import { useAuthStore } from '@/stores/auth-store';
import { env } from '@/lib/config/env';

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: any,
    message?: string
  ) {
    super(message || data?.message || `API error with status ${status}`);
    this.name = 'ApiError';
  }
}

/**
 * Custom Fetcher chuẩn hóa cho Orval và mọi API request
 * Sử dụng env.apiBaseUrl nghiêm ngặt. Nếu NEXT_PUBLIC_API_BASE_URL bị trống sẽ ném lỗi ngay lập tức.
 */
export async function customFetcher<T>({
  url,
  method,
  params,
  data,
  headers: customHeaders,
  signal,
}: {
  url: string;
  method: string;
  params?: any;
  data?: any;
  headers?: any;
  signal?: AbortSignal;
}): Promise<T> {
  // Lấy baseUrl từ env (Tự động ném lỗi nếu biến môi trường bị trống, không dùng hardcode fallback)
  const baseUrl = env.apiBaseUrl;

  // Xây dựng URL hoàn chỉnh kèm query parameters
  const targetUrl = new URL(
    url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        targetUrl.searchParams.append(key, String(value));
      }
    });
  }

  const headers = new Headers(customHeaders);
  const token = useAuthStore.getState().accessToken;

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Tự động set Content-Type nếu không phải FormData
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  if (!isFormData && !headers.has('Content-Type') && data !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const body = isFormData ? data : data !== undefined ? JSON.stringify(data) : undefined;

  let response: Response;
  try {
    response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      signal,
    });
  } catch (error) {
    throw new ApiError(0, null, 'Lỗi kết nối mạng');
  }

  // Phân biệt endpoint xác thực công khai vs endpoint bảo vệ
  const isAuthEndpoint =
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/verify') ||
    url.includes('/auth/resend');

  // Xử lý 401: Chỉ báo hết hạn phiên đối với các endpoint bảo vệ khi người dùng đã có token
  if (response.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
    const hasToken = Boolean(useAuthStore.getState().accessToken);
    if (hasToken) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new ApiError(401, null, 'Phiên đăng nhập đã hết hạn');
    }
  }

  // Xử lý lỗi trả về từ Backend
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData?.message ||
      (response.status === 401
        ? 'Thông tin đăng nhập không chính xác'
        : response.status === 404
        ? 'Không tìm thấy tài nguyên'
        : `Yêu cầu thất bại (${response.status})`);
    throw new ApiError(response.status, errorData, errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
