/**
 * useCalorieDashboard Hook
 * Điều phối dữ liệu Dashboard Calorie theo kiến trúc TanStack Query & Stale-While-Revalidate
 * Chuẩn Parity 1:1 với CalorieDashboardViewModel.swift trên iOS
 */

import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCalorieGoal,
  useUpdateCalorieGoal,
  useGetDailyCalorieSummary,
  useGetMonthlyCalorieSummary,
  useCreateCalorieLog,
  useDeleteCalorieLog,
  calorieKeys,
} from '@/lib/api/calorie-api';
import {
  getCurrentMealType,
  formatDateKey,
  formatMonthKey,
} from '@/lib/utils/calorie-formatters';
import type {
  MealType,
  CalorieMealItem,
  DailyCalorieSummary,
  MonthlyCalorieSummary,
  CalorieGoalResponse,
} from '@/types/calorie';

export interface UseCalorieDashboardOptions {
  /** Ngày được chọn khởi tạo (mặc định hôm nay) */
  initialDate?: Date;
  /** Cờ cho phép gọi API (thường kết hợp với trạng thái isAuthenticated) */
  enabled?: boolean;
}

export interface UseCalorieDashboardReturn {
  // Trạng thái ngày & tháng
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  dateKey: string;
  monthKey: string;

  // Dữ liệu tổng hợp
  dailySummary: DailyCalorieSummary | null;
  monthlySummary: MonthlyCalorieSummary | null;
  goal: CalorieGoalResponse | null;

  // Chỉ số tính toán nhanh
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  isExceeded: boolean;
  progressRatio: number;
  progressPct: number;
  daysOnTrack: number;
  averageDailyCalories: number;
  monthlyDays: { day: number; calories: number }[];

  // Helpers phân loại theo 4 bữa ăn
  mealsByMealType: (type: MealType) => CalorieMealItem[];
  totalCaloriesByMealType: (type: MealType) => number;

  // Trạng thái tải & lỗi
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;

  // Trạng thái Bottom Sheets
  isGoalSheetOpen: boolean;
  setIsGoalSheetOpen: (open: boolean) => void;
  isAddSheetOpen: boolean;
  setIsAddSheetOpen: (open: boolean) => void;
  selectedMealTypeForAdd: MealType;
  setSelectedMealTypeForAdd: (type: MealType) => void;

  // Actions
  prepareQuickAdd: (mealType?: MealType) => void;
  updateTargetGoal: (newTarget: number) => Promise<boolean>;
  addQuickCalorie: (
    calories: number,
    mealType: MealType,
    dishName?: string
  ) => Promise<boolean>;
  deleteMealItem: (id: string) => Promise<boolean>;
  refetchAll: () => Promise<void>;
}

export function useCalorieDashboard({
  initialDate,
  enabled = true,
}: UseCalorieDashboardOptions = {}): UseCalorieDashboardReturn {
  const queryClient = useQueryClient();

  // 1. Quản lý ngày xem hiện tại
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => initialDate ?? new Date()
  );

  const dateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const monthKey = useMemo(() => formatMonthKey(selectedDate), [selectedDate]);

  // 2. Trạng thái Bottom Sheets & Form
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState<boolean>(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState<boolean>(false);
  const [selectedMealTypeForAdd, setSelectedMealTypeForAdd] = useState<MealType>(
    () => getCurrentMealType()
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3. TanStack Query: Lấy mục tiêu Calo hàng ngày
  const goalQuery = useGetCalorieGoal({
    query: {
      enabled,
      staleTime: 5 * 60 * 1000,
    },
  });

  // 4. TanStack Query: Lấy tổng quan Calo theo ngày
  const dailyQuery = useGetDailyCalorieSummary(dateKey, {
    query: {
      enabled,
      staleTime: 30 * 1000,
    },
  });

  // 5. TanStack Query: Lấy báo cáo xu hướng Calo theo tháng
  const monthlyQuery = useGetMonthlyCalorieSummary(monthKey, {
    query: {
      enabled,
      staleTime: 2 * 60 * 1000,
    },
  });

  // 6. Mutations
  const updateGoalMutation = useUpdateCalorieGoal();
  const createLogMutation = useCreateCalorieLog();
  const deleteLogMutation = useDeleteCalorieLog();

  // 7. Computed Values
  const dailySummary: DailyCalorieSummary | null = dailyQuery.data ?? null;
  const monthlySummary: MonthlyCalorieSummary | null = monthlyQuery.data ?? null;
  const goal: CalorieGoalResponse | null = goalQuery.data ?? null;

  const targetCalories = useMemo(() => {
    return (
      dailySummary?.dailyTargetCalories ??
      goal?.dailyTargetCalories ??
      2000
    );
  }, [dailySummary?.dailyTargetCalories, goal?.dailyTargetCalories]);

  const consumedCalories = useMemo(() => {
    return dailySummary?.consumedCalories ?? 0;
  }, [dailySummary?.consumedCalories]);

  const remainingCalories = useMemo(() => {
    if (dailySummary && typeof dailySummary.remainingCalories === 'number') {
      return dailySummary.remainingCalories;
    }
    return Math.max(0, targetCalories - consumedCalories);
  }, [dailySummary, targetCalories, consumedCalories]);

  const isExceeded = useMemo(() => {
    return consumedCalories > targetCalories;
  }, [consumedCalories, targetCalories]);

  const progressRatio = useMemo(() => {
    if (targetCalories <= 0) return 0;
    return Math.min(consumedCalories / targetCalories, 1.0);
  }, [consumedCalories, targetCalories]);

  const progressPct = useMemo(() => {
    if (targetCalories <= 0) return 0;
    return Math.round((consumedCalories / targetCalories) * 100);
  }, [consumedCalories, targetCalories]);

  const daysOnTrack = useMemo(() => {
    return monthlySummary?.daysOnTrack ?? 0;
  }, [monthlySummary?.daysOnTrack]);

  const averageDailyCalories = useMemo(() => {
    return monthlySummary?.averageDailyCalories ?? 0;
  }, [monthlySummary?.averageDailyCalories]);

  const monthlyDays = useMemo(() => {
    return monthlySummary?.days ?? [];
  }, [monthlySummary?.days]);

  const meals = useMemo(() => {
    return dailySummary?.meals ?? [];
  }, [dailySummary?.meals]);

  const mealsByMealType = useCallback(
    (type: MealType): CalorieMealItem[] => {
      return meals.filter((item) => item.mealType === type);
    },
    [meals]
  );

  const totalCaloriesByMealType = useCallback(
    (type: MealType): number => {
      const filtered = meals.filter((item) => item.mealType === type);
      return filtered.reduce((acc, curr) => acc + (curr.calories || 0), 0);
    },
    [meals]
  );

  const isLoading =
    (goalQuery.isLoading && !goal) ||
    (dailyQuery.isLoading && !dailySummary) ||
    (monthlyQuery.isLoading && !monthlySummary);

  const isRefreshing =
    goalQuery.isRefetching ||
    dailyQuery.isRefetching ||
    monthlyQuery.isRefetching;

  // 8. Actions
  const prepareQuickAdd = useCallback((mealType?: MealType) => {
    setSelectedMealTypeForAdd(mealType ?? getCurrentMealType());
    setIsAddSheetOpen(true);
  }, []);

  const updateTargetGoal = useCallback(
    async (newTarget: number): Promise<boolean> => {
      try {
        setErrorMessage(null);
        await updateGoalMutation.mutateAsync({
          dailyTargetCalories: newTarget,
        });

        // Invalidate và refetch các queries liên quan
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: calorieKeys.goal() }),
          queryClient.invalidateQueries({ queryKey: calorieKeys.daily(dateKey) }),
          queryClient.invalidateQueries({ queryKey: calorieKeys.summary(monthKey) }),
          queryClient.invalidateQueries({ queryKey: calorieKeys.all }),
        ]);

        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể cập nhật mục tiêu calo';
        setErrorMessage(msg);
        return false;
      }
    },
    [updateGoalMutation, queryClient, dateKey, monthKey]
  );

  const addQuickCalorie = useCallback(
    async (
      calories: number,
      mealType: MealType,
      dishName?: string
    ): Promise<boolean> => {
      try {
        setErrorMessage(null);
        await createLogMutation.mutateAsync({
          calories,
          mealType,
          dishName,
        });

        // Invalidate và refetch daily, monthly & profile
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: calorieKeys.daily(dateKey) }),
          queryClient.invalidateQueries({ queryKey: calorieKeys.summary(monthKey) }),
          queryClient.invalidateQueries({ queryKey: calorieKeys.all }),
        ]);

        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể thêm món ăn';
        setErrorMessage(msg);
        return false;
      }
    },
    [createLogMutation, queryClient, dateKey, monthKey]
  );

  const deleteMealItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setErrorMessage(null);
        await deleteLogMutation.mutateAsync(id);

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: calorieKeys.daily(dateKey) }),
          queryClient.invalidateQueries({ queryKey: calorieKeys.summary(monthKey) }),
          queryClient.invalidateQueries({ queryKey: calorieKeys.all }),
        ]);

        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể xóa món ăn';
        setErrorMessage(msg);
        return false;
      }
    },
    [deleteLogMutation, queryClient, dateKey, monthKey]
  );

  const refetchAll = useCallback(async () => {
    await Promise.all([
      goalQuery.refetch(),
      dailyQuery.refetch(),
      monthlyQuery.refetch(),
    ]);
  }, [goalQuery, dailyQuery, monthlyQuery]);

  return {
    selectedDate,
    setSelectedDate,
    dateKey,
    monthKey,
    dailySummary,
    monthlySummary,
    goal,
    targetCalories,
    consumedCalories,
    remainingCalories,
    isExceeded,
    progressRatio,
    progressPct,
    daysOnTrack,
    averageDailyCalories,
    monthlyDays,
    mealsByMealType,
    totalCaloriesByMealType,
    isLoading,
    isRefreshing,
    errorMessage,
    isGoalSheetOpen,
    setIsGoalSheetOpen,
    isAddSheetOpen,
    setIsAddSheetOpen,
    selectedMealTypeForAdd,
    setSelectedMealTypeForAdd,
    prepareQuickAdd,
    updateTargetGoal,
    addQuickCalorie,
    deleteMealItem,
    refetchAll,
  };
}
