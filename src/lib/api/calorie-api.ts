/**
 * Calorie API Client & TanStack Query Hooks
 * Kết nối các endpoint /api/v1/calories/* của checked-backend (CalorieController.java)
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { customFetcher } from './custom-fetcher';
import type {
  CalorieGoalResponse,
  CalorieGoalRequest,
  DailyCalorieSummary,
  MonthlyCalorieSummary,
  CalorieMealItem,
  CreateCalorieLogRequest,
} from '@/types/calorie';

export const calorieKeys = {
  all: ['/api/v1/calories'] as const,
  goal: () => ['/api/v1/calories/goal'] as const,
  daily: (date?: string) => ['/api/v1/calories/daily', date] as const,
  summary: (month?: string) => ['/api/v1/calories/summary', month] as const,
  logs: () => ['/api/v1/calories/logs'] as const,
};

/**
 * Lấy mức Calo mục tiêu hàng ngày của người dùng (mặc định 2000 kcal)
 */
export const getCalorieGoal = (signal?: AbortSignal): Promise<CalorieGoalResponse> => {
  return customFetcher<CalorieGoalResponse>({
    url: '/api/v1/calories/goal',
    method: 'GET',
    signal,
  });
};

export const getGetCalorieGoalQueryOptions = <
  TData = CalorieGoalResponse,
  TError = unknown
>(options?: {
  query?: Partial<UseQueryOptions<CalorieGoalResponse, TError, TData>>;
}) => {
  const queryKey = calorieKeys.goal();
  const queryFn = ({ signal }: { signal?: AbortSignal }) => getCalorieGoal(signal);

  return {
    queryKey,
    queryFn,
    ...options?.query,
  };
};

export function useGetCalorieGoal<TData = CalorieGoalResponse, TError = unknown>(options?: {
  query?: Partial<UseQueryOptions<CalorieGoalResponse, TError, TData>>;
}) {
  const queryOptions = getGetCalorieGoalQueryOptions(options);
  return useQuery(queryOptions);
}

/**
 * Cập nhật mức Calo mục tiêu hàng ngày
 */
export const updateCalorieGoal = (
  data: CalorieGoalRequest,
  signal?: AbortSignal
): Promise<CalorieGoalResponse> => {
  return customFetcher<CalorieGoalResponse>({
    url: '/api/v1/calories/goal',
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
    signal,
  });
};

export function useUpdateCalorieGoal<TError = unknown, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<CalorieGoalResponse, TError, CalorieGoalRequest, TContext>;
}) {
  return useMutation({
    mutationFn: (data: CalorieGoalRequest) => updateCalorieGoal(data),
    ...options?.mutation,
  });
}

/**
 * Xem tổng quan Calo theo ngày (tổng nạp, mục tiêu, mức còn lại/vượt)
 */
export const getDailyCalorieSummary = (
  date?: string,
  signal?: AbortSignal
): Promise<DailyCalorieSummary> => {
  return customFetcher<DailyCalorieSummary>({
    url: '/api/v1/calories/daily',
    method: 'GET',
    params: date ? { date } : undefined,
    signal,
  });
};

export const getGetDailyCalorieSummaryQueryOptions = <
  TData = DailyCalorieSummary,
  TError = unknown
>(
  date?: string,
  options?: {
    query?: Partial<UseQueryOptions<DailyCalorieSummary, TError, TData>>;
  }
) => {
  const queryKey = calorieKeys.daily(date);
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    getDailyCalorieSummary(date, signal);

  return {
    queryKey,
    queryFn,
    ...options?.query,
  };
};

export function useGetDailyCalorieSummary<TData = DailyCalorieSummary, TError = unknown>(
  date?: string,
  options?: {
    query?: Partial<UseQueryOptions<DailyCalorieSummary, TError, TData>>;
  }
) {
  const queryOptions = getGetDailyCalorieSummaryQueryOptions(date, options);
  return useQuery(queryOptions);
}

/**
 * Xem báo cáo xu hướng Calo theo tháng (biểu đồ các ngày trong tháng)
 */
export const getMonthlyCalorieSummary = (
  month?: string,
  signal?: AbortSignal
): Promise<MonthlyCalorieSummary> => {
  return customFetcher<MonthlyCalorieSummary>({
    url: '/api/v1/calories/summary',
    method: 'GET',
    params: month ? { month } : undefined,
    signal,
  });
};

export const getGetMonthlyCalorieSummaryQueryOptions = <
  TData = MonthlyCalorieSummary,
  TError = unknown
>(
  month?: string,
  options?: {
    query?: Partial<UseQueryOptions<MonthlyCalorieSummary, TError, TData>>;
  }
) => {
  const queryKey = calorieKeys.summary(month);
  const queryFn = ({ signal }: { signal?: AbortSignal }) =>
    getMonthlyCalorieSummary(month, signal);

  return {
    queryKey,
    queryFn,
    ...options?.query,
  };
};

export function useGetMonthlyCalorieSummary<TData = MonthlyCalorieSummary, TError = unknown>(
  month?: string,
  options?: {
    query?: Partial<UseQueryOptions<MonthlyCalorieSummary, TError, TData>>;
  }
) {
  const queryOptions = getGetMonthlyCalorieSummaryQueryOptions(month, options);
  return useQuery(queryOptions);
}

/**
 * Ghi nhận Calo nhanh thủ công (bữa ăn / món ăn)
 */
export const createCalorieLog = (
  data: CreateCalorieLogRequest,
  signal?: AbortSignal
): Promise<CalorieMealItem> => {
  return customFetcher<CalorieMealItem>({
    url: '/api/v1/calories/logs',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    signal,
  });
};

export function useCreateCalorieLog<TError = unknown, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<CalorieMealItem, TError, CreateCalorieLogRequest, TContext>;
}) {
  return useMutation({
    mutationFn: (data: CreateCalorieLogRequest) => createCalorieLog(data),
    ...options?.mutation,
  });
}

/**
 * Xóa một bản ghi bữa ăn đã log
 */
export const deleteCalorieLog = (
  id: string,
  signal?: AbortSignal
): Promise<void> => {
  return customFetcher<void>({
    url: `/api/v1/calories/logs/${id}`,
    method: 'DELETE',
    signal,
  });
};

export function useDeleteCalorieLog<TError = unknown, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<void, TError, string, TContext>;
}) {
  return useMutation({
    mutationFn: (id: string) => deleteCalorieLog(id),
    ...options?.mutation,
  });
}
