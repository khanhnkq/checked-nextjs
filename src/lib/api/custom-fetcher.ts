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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, any>;
  data?: any;
  headers?: HeadersInit;
  signal?: AbortSignal;
}): Promise<T> {
  // Lấy baseUrl từ env (Tự động ném lỗi nếu biến môi trường bị trống, không dùng hardcode fallback)
  const baseUrl = env.apiBaseUrl;

  // Xây dựng URL hoàn chỉnh kèm query parameters
  const targetUrl = new URL(url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`);
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

  // Xử lý 401 Unauthorized và Silent Refresh Token
  if (response.status === 401 && typeof window !== 'undefined') {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
        if (!refreshRes.ok) throw new Error('Token refresh failed');
        const refreshData = await refreshRes.json();
        const newToken = refreshData.accessToken;
        
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);

        headers.set('Authorization', `Bearer ${newToken}`);
        const retryRes = await fetch(targetUrl.toString(), {
          method,
          headers,
          body,
          signal,
        });
        if (!retryRes.ok) {
          const errData = await retryRes.json().catch(() => ({}));
          throw new ApiError(retryRes.status, errData);
        }
        if (retryRes.status === 204) return {} as T;
        return retryRes.json();
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        throw new ApiError(401, null, 'Phiên đăng nhập đã hết hạn');
      } finally {
        isRefreshing = false;
      }
    } else {
      // Đợi refresh token hoàn thành rồi retry
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            fetch(targetUrl.toString(), { method, headers, body, signal })
              .then((r) => (r.status === 204 ? ({} as T) : r.json()))
              .then(resolve)
              .catch(reject);
          },
          reject,
        });
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
