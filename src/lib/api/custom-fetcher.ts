import { useAuthStore } from '@/stores/auth-store';
import { isTokenExpired } from '@/lib/auth/jwt';
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
 * Xây dựng URL chuẩn hóa, tự động khử trùng lặp tiền tố /api/v1 giữa baseUrl và endpoint url
 */
function buildTargetUrl(rawBaseUrl: string, url: string): URL {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return new URL(url);
  }

  const base = rawBaseUrl.replace(/\/+$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  // Tránh lỗi /api/v1/api/v1/... nếu cả base và endpoint đều có /api/v1
  if (base.endsWith('/api/v1') && cleanUrl.startsWith('/api/v1/')) {
    return new URL(base + cleanUrl.slice('/api/v1'.length));
  }

  return new URL(base + cleanUrl);
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
  const baseUrl = env.apiBaseUrl;
  const targetUrl = buildTargetUrl(baseUrl, url);

  if (params) {
    const appendParam = (key: string, value: any) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null) {
            targetUrl.searchParams.append(key, String(v));
          }
        });
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        // Tự động phân rã các object lồng nhau như pageable: { page: 0, size: 50 } thành ?page=0&size=50
        Object.entries(value).forEach(([subKey, subVal]) => {
          appendParam(subKey, subVal);
        });
      } else {
        targetUrl.searchParams.append(key, String(value));
      }
    };

    Object.entries(params).forEach(([key, value]) => {
      appendParam(key, value);
    });
  }

  const headers = new Headers(customHeaders);
  let token = useAuthStore.getState().accessToken;

  // Dự phòng: Đọc checked_token từ cookie nếu Zustand store đang rehydrate
  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)checked_token=([^;]*)/);
    if (match && match[1]) {
      token = decodeURIComponent(match[1]);
    }
  }

  // Phân biệt endpoint xác thực công khai vs endpoint bảo vệ
  const isAuthEndpoint =
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/verify') ||
    url.includes('/auth/resend');

  // Kiểm tra token đã hết hạn trước khi gửi request (tránh 401 không cần thiết)
  if (token && isTokenExpired(token) && !isAuthEndpoint) {
    if (typeof window !== 'undefined') {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    throw new ApiError(401, null, 'Phiên đăng nhập đã hết hạn');
  }

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

  // Xử lý 401: Đối với các endpoint bảo vệ, xóa session và điều hướng về trang đăng nhập
  if (response.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
    useAuthStore.getState().logout();
    if (typeof document !== 'undefined') {
      document.cookie = 'checked_token=; Max-Age=0; path=/;';
    }
    if (window.location.pathname !== '/login') {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(401, null, 'Phiên đăng nhập đã hết hạn');
  }

  // Xử lý lỗi trả về từ Backend
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData?.message ||
      (response.status === 401
        ? 'Thông tin đăng nhập không chính xác'
        : response.status === 429
        ? 'Quá nhiều lần thử, vui lòng đợi ít phút'
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
