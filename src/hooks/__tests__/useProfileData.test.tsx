import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProfileData } from '../useProfileData';
import * as endpoints from '@/lib/api/generated/endpoints';
import * as calorieApi from '@/lib/api/calorie-api';

vi.mock('@/lib/api/generated/endpoints', () => ({
  useGetCashflowSummary: vi.fn(),
  useGetBudget: vi.fn(),
  useGetSavingsGoal: vi.fn(),
  useGetExpenseEntries: vi.fn(),
  useGetMyPhotos: vi.fn(),
  upsertBudget: vi.fn(),
  upsertSavingsGoal: vi.fn(),
}));

vi.mock('@/lib/api/calorie-api', () => ({
  calorieKeys: {
    goal: () => ['/api/v1/calories/goal'],
  },
  useGetCalorieGoal: vi.fn(),
  useGetDailyCalorieSummary: vi.fn(),
  useUpdateCalorieGoal: vi.fn(),
}));

describe('useProfileData Hook (Two-Tier Architecture & Aggregation)', () => {
  let queryClient: QueryClient;
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(calorieApi.useUpdateCalorieGoal).mockReturnValue({
      mutateAsync: mockMutateAsync,
    } as any);

    // Mặc định các query trả về dữ liệu mẫu thành công
    vi.mocked(endpoints.useGetCashflowSummary).mockReturnValue({
      data: { totalExpense: 1200000, budgetLimit: 3000000 },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(endpoints.useGetBudget).mockReturnValue({
      data: { amountLimit: 3000000, alertThresholdPct: 80 },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(endpoints.useGetSavingsGoal).mockReturnValue({
      data: { targetAmount: 500000 },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(calorieApi.useGetCalorieGoal).mockReturnValue({
      data: { dailyTargetCalories: 2000 },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(calorieApi.useGetDailyCalorieSummary).mockReturnValue({
      data: {
        consumedCalories: 1500,
        dailyTargetCalories: 2000,
        percentage: 75,
        isExceeded: false,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(endpoints.useGetExpenseEntries).mockReturnValue({
      data: {
        content: [
          {
            photoId: 'expense-1',
            imageUrl: 'https://example.com/receipt.jpg',
            takenAt: new Date(2026, 9, 30, 10, 0).toISOString(),
          },
        ],
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(endpoints.useGetMyPhotos).mockReturnValue({
      data: {
        content: [
          {
            id: 'photo-1',
            imageUrl: 'https://example.com/photo.jpg',
            createdAt: new Date(2026, 9, 30, 12, 0).toISOString(),
          },
        ],
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('tính toán chính xác chỉ số tài chính và năng lượng tóm tắt (Tier 1)', () => {
    const fixedDate = new Date(2026, 9, 30);
    const { result } = renderHook(() => useProfileData({ targetDate: fixedDate }), {
      wrapper,
    });

    expect(result.current.monthTitle).toBe('Tháng 10 2026');
    expect(result.current.monthKey).toBe('202610');
    expect(result.current.todayDateKey).toBe('2026-10-30');

    // Chi tiêu: 1.200.000 / 3.000.000 = 40%
    expect(result.current.summaryState.totalSpent).toBe(1200000);
    expect(result.current.summaryState.budgetLimit).toBe(3000000);
    expect(result.current.summaryState.percentUsed).toBe(40);
    expect(result.current.summaryState.remaining).toBe(1800000);
    expect(result.current.summaryState.isBudgetExceeded).toBe(false);
    expect(result.current.summaryState.alertPct).toBe(80);
    expect(result.current.summaryState.savingsTarget).toBe(500000);

    // Calo: 1500 / 2000 = 75%
    expect(result.current.summaryState.todayCalories).toBe(1500);
    expect(result.current.summaryState.targetCalories).toBe(2000);
    expect(result.current.summaryState.caloriePercentage).toBe(75);
    expect(result.current.summaryState.calorieExceeded).toBe(false);
  });

  it('xử lý đúng trạng thái vượt hạn mức ngân sách', () => {
    vi.mocked(endpoints.useGetCashflowSummary).mockReturnValue({
      data: { totalExpense: 3500000 },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(endpoints.useGetBudget).mockReturnValue({
      data: { amountLimit: 3000000, alertThresholdPct: 80 },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(
      () => useProfileData({ targetDate: new Date(2026, 9, 30) }),
      { wrapper }
    );

    expect(result.current.summaryState.totalSpent).toBe(3500000);
    expect(result.current.summaryState.remaining).toBe(-500000);
    expect(result.current.summaryState.isBudgetExceeded).toBe(true);
  });

  it('tổng hợp đúng dữ liệu lịch và số bài checked (Tier 2)', () => {
    const fixedDate = new Date(2026, 9, 30);
    const { result } = renderHook(() => useProfileData({ targetDate: fixedDate }), {
      wrapper,
    });

    // Ngày 30 có 2 bài post
    expect(result.current.dayCalendarData[30]).toBeDefined();
    expect(result.current.dayCalendarData[30].postCount).toBe(2);
    expect(result.current.summaryState.checkedCount).toBe(2);
    expect(result.current.summaryState.streakDays).toBe(1);
  });

  it('gọi mutation updateBudget và invalidate query cache thành công', async () => {
    vi.mocked(endpoints.upsertBudget).mockResolvedValueOnce({} as any);
    vi.mocked(endpoints.upsertSavingsGoal).mockResolvedValueOnce({} as any);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () => useProfileData({ targetDate: new Date(2026, 9, 30) }),
      { wrapper }
    );

    let success = false;
    await act(async () => {
      success = await result.current.updateBudget(5000000, 85, 1000000);
    });

    expect(success).toBe(true);
    expect(endpoints.upsertBudget).toHaveBeenCalledWith('202610', {
      amountLimit: 5000000,
      alertThresholdPct: 85,
    });
    expect(endpoints.upsertSavingsGoal).toHaveBeenCalledWith('202610', {
      targetAmount: 1000000,
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('gọi mutation updateCalorieTarget thành công', async () => {
    mockMutateAsync.mockResolvedValueOnce({ dailyTargetCalories: 2500 });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () => useProfileData({ targetDate: new Date(2026, 9, 30) }),
      { wrapper }
    );

    let success = false;
    await act(async () => {
      success = await result.current.updateCalorieTarget(2500);
    });

    expect(success).toBe(true);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      dailyTargetCalories: 2500,
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
