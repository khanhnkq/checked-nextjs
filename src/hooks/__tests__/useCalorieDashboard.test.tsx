import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCalorieDashboard } from '../useCalorieDashboard';
import * as calorieApi from '@/lib/api/calorie-api';
import type {
  DailyCalorieSummary,
  MonthlyCalorieSummary,
  CalorieMealItem,
} from '@/types/calorie';

// Mock toàn bộ module calorie-api
vi.mock('@/lib/api/calorie-api', () => ({
  useGetCalorieGoal: vi.fn(),
  useUpdateCalorieGoal: vi.fn(),
  useGetDailyCalorieSummary: vi.fn(),
  useGetMonthlyCalorieSummary: vi.fn(),
  useCreateCalorieLog: vi.fn(),
  useDeleteCalorieLog: vi.fn(),
  calorieKeys: {
    all: ['/api/v1/calories'],
    goal: () => ['/api/v1/calories/goal'],
    daily: (date?: string) => ['/api/v1/calories/daily', date],
    summary: (month?: string) => ['/api/v1/calories/summary', month],
    logs: () => ['/api/v1/calories/logs'],
  },
}));

describe('useCalorieDashboard Hook', () => {
  let queryClient: QueryClient;

  const mockRefetchGoal = vi.fn().mockResolvedValue({});
  const mockRefetchDaily = vi.fn().mockResolvedValue({});
  const mockRefetchMonthly = vi.fn().mockResolvedValue({});

  const mockMutateUpdateGoal = vi.fn();
  const mockMutateCreateLog = vi.fn();
  const mockMutateDeleteLog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(calorieApi.useGetCalorieGoal).mockReturnValue({
      data: { dailyTargetCalories: 2000 },
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetchGoal,
    } as any);

    vi.mocked(calorieApi.useGetDailyCalorieSummary).mockReturnValue({
      data: undefined,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetchDaily,
    } as any);

    vi.mocked(calorieApi.useGetMonthlyCalorieSummary).mockReturnValue({
      data: undefined,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetchMonthly,
    } as any);

    vi.mocked(calorieApi.useUpdateCalorieGoal).mockReturnValue({
      mutateAsync: mockMutateUpdateGoal,
    } as any);

    vi.mocked(calorieApi.useCreateCalorieLog).mockReturnValue({
      mutateAsync: mockMutateCreateLog,
    } as any);

    vi.mocked(calorieApi.useDeleteCalorieLog).mockReturnValue({
      mutateAsync: mockMutateDeleteLog,
    } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('khởi tạo với các giá trị mặc định khi chưa có dữ liệu daily/monthly', () => {
    const fixedDate = new Date(2026, 9, 31);
    const { result } = renderHook(() => useCalorieDashboard({ initialDate: fixedDate }), {
      wrapper,
    });

    expect(result.current.dateKey).toBe('2026-10-31');
    expect(result.current.monthKey).toBe('202610');
    expect(result.current.targetCalories).toBe(2000);
    expect(result.current.consumedCalories).toBe(0);
    expect(result.current.remainingCalories).toBe(2000);
    expect(result.current.isExceeded).toBe(false);
    expect(result.current.progressRatio).toBe(0);
    expect(result.current.progressPct).toBe(0);
    expect(result.current.daysOnTrack).toBe(0);
  });

  it('tính toán đúng tiến độ và trạng thái khi có dữ liệu trong ngân sách calo', () => {
    const mockDaily: DailyCalorieSummary = {
      dateString: '2026-10-31',
      dailyTargetCalories: 2200,
      consumedCalories: 1650,
      remainingCalories: 550,
      isExceeded: false,
      percentage: 75,
      meals: [],
    };
    vi.mocked(calorieApi.useGetDailyCalorieSummary).mockReturnValue({
      data: mockDaily,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetchDaily,
    } as any);

    const { result } = renderHook(() => useCalorieDashboard(), { wrapper });

    expect(result.current.targetCalories).toBe(2200);
    expect(result.current.consumedCalories).toBe(1650);
    expect(result.current.remainingCalories).toBe(550);
    expect(result.current.isExceeded).toBe(false);
    expect(result.current.progressRatio).toBeCloseTo(0.75);
    expect(result.current.progressPct).toBe(75);
  });

  it('xử lý chính xác trạng thái vượt calo mục tiêu (isExceeded = true)', () => {
    const mockDaily: DailyCalorieSummary = {
      dateString: '2026-10-31',
      dailyTargetCalories: 2000,
      consumedCalories: 2500,
      remainingCalories: -500,
      isExceeded: true,
      percentage: 125,
      meals: [],
    };
    vi.mocked(calorieApi.useGetDailyCalorieSummary).mockReturnValue({
      data: mockDaily,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetchDaily,
    } as any);

    const { result } = renderHook(() => useCalorieDashboard(), { wrapper });

    expect(result.current.isExceeded).toBe(true);
    expect(result.current.progressRatio).toBe(1.0); // max 1.0 cho thanh progress
    expect(result.current.progressPct).toBe(125);
    expect(result.current.remainingCalories).toBe(-500);
  });

  it('phân loại chính xác món ăn và tính tổng calo cho từng bữa ăn', () => {
    const mockMeals: CalorieMealItem[] = [
      {
        id: '1',
        calories: 350,
        mealType: 'BREAKFAST',
        dishName: 'Bánh mì',
        loggedAt: '2026-10-31T07:00:00Z',
      },
      {
        id: '2',
        calories: 150,
        mealType: 'BREAKFAST',
        dishName: 'Cà phê sữa',
        loggedAt: '2026-10-31T08:00:00Z',
      },
      {
        id: '3',
        calories: 700,
        mealType: 'LUNCH',
        dishName: 'Cơm sườn trứng',
        loggedAt: '2026-10-31T12:00:00Z',
      },
      {
        id: '4',
        calories: 500,
        mealType: 'DINNER',
        dishName: 'Salad gà',
        loggedAt: '2026-10-31T18:30:00Z',
      },
    ];

    const mockDaily: DailyCalorieSummary = {
      dailyTargetCalories: 2000,
      consumedCalories: 1700,
      remainingCalories: 300,
      isExceeded: false,
      percentage: 85,
      meals: mockMeals,
    };
    vi.mocked(calorieApi.useGetDailyCalorieSummary).mockReturnValue({
      data: mockDaily,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetchDaily,
    } as any);

    const { result } = renderHook(() => useCalorieDashboard(), { wrapper });

    const breakfastMeals = result.current.mealsByMealType('BREAKFAST');
    expect(breakfastMeals).toHaveLength(2);
    expect(result.current.totalCaloriesByMealType('BREAKFAST')).toBe(500);

    const lunchMeals = result.current.mealsByMealType('LUNCH');
    expect(lunchMeals).toHaveLength(1);
    expect(result.current.totalCaloriesByMealType('LUNCH')).toBe(700);

    const snackMeals = result.current.mealsByMealType('SNACK');
    expect(snackMeals).toHaveLength(0);
    expect(result.current.totalCaloriesByMealType('SNACK')).toBe(0);

    const dinnerMeals = result.current.mealsByMealType('DINNER');
    expect(dinnerMeals).toHaveLength(1);
    expect(result.current.totalCaloriesByMealType('DINNER')).toBe(500);
  });

  it('prepareQuickAdd cập nhật selectedMealType và mở sheet', () => {
    const { result } = renderHook(() => useCalorieDashboard(), { wrapper });

    act(() => {
      result.current.prepareQuickAdd('LUNCH');
    });

    expect(result.current.selectedMealTypeForAdd).toBe('LUNCH');
    expect(result.current.isAddSheetOpen).toBe(true);
  });

  it('updateTargetGoal gọi mutate và trả về true', async () => {
    mockMutateUpdateGoal.mockResolvedValueOnce({ dailyTargetCalories: 2500 });
    const { result } = renderHook(() => useCalorieDashboard(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.updateTargetGoal(2500);
    });

    expect(success).toBe(true);
    expect(mockMutateUpdateGoal).toHaveBeenCalledWith({
      dailyTargetCalories: 2500,
    });
  });

  it('addQuickCalorie gọi mutate thêm món và trả về true', async () => {
    mockMutateCreateLog.mockResolvedValueOnce({ id: 'new-1' });
    const { result } = renderHook(() => useCalorieDashboard(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.addQuickCalorie(400, 'LUNCH', 'Phở gà');
    });

    expect(success).toBe(true);
    expect(mockMutateCreateLog).toHaveBeenCalledWith({
      calories: 400,
      mealType: 'LUNCH',
      dishName: 'Phở gà',
    });
  });

  it('deleteMealItem gọi mutate xóa món và trả về true', async () => {
    mockMutateDeleteLog.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCalorieDashboard(), { wrapper });

    let success = false;
    await act(async () => {
      success = await result.current.deleteMealItem('item-123');
    });

    expect(success).toBe(true);
    expect(mockMutateDeleteLog).toHaveBeenCalledWith('item-123');
  });

  it('refetchAll gọi refetch trên cả 3 queries', async () => {
    const { result } = renderHook(() => useCalorieDashboard(), { wrapper });

    await act(async () => {
      await result.current.refetchAll();
    });

    expect(mockRefetchGoal).toHaveBeenCalled();
    expect(mockRefetchDaily).toHaveBeenCalled();
    expect(mockRefetchMonthly).toHaveBeenCalled();
  });
});
