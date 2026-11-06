'use client';

/**
 * useProfileData Hook
 * Điều phối dữ liệu Profile theo mô hình Two-tier Data Loading
 * Chuẩn parity 1:1 với ProfileView.swift trong checked-ios
 */

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCashflowSummary,
  useGetBudget,
  useGetSavingsGoal,
  useGetExpenseEntries,
  useGetMyPhotos,
  upsertBudget,
  upsertSavingsGoal,
} from '@/lib/api/generated/endpoints';
import {
  useGetCalorieGoal,
  useGetDailyCalorieSummary,
  useUpdateCalorieGoal,
  calorieKeys,
} from '@/lib/api/calorie-api';
import {
  formatCurrentMonthVi,
  formatMonthKey,
  formatDateKey,
} from '@/lib/utils/formatters';
import { aggregateCalendarData } from '@/lib/profile/calendar-aggregator';
import type { ProfileSummaryState, DayCalendarData } from '@/types/profile';

export interface UseProfileDataOptions {
  targetDate?: Date;
  enabled?: boolean;
}

export interface UseProfileDataReturn {
  summaryState: ProfileSummaryState;
  dayCalendarData: Record<number, DayCalendarData>;
  isLoadingSummary: boolean;
  isLoadingCalendar: boolean;
  isLoading: boolean;
  monthTitle: string;
  monthKey: string;
  todayDateKey: string;
  updateBudget: (
    limit: number,
    alertPercent?: number,
    targetSavings?: number | null
  ) => Promise<boolean>;
  updateCalorieTarget: (targetCalories: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useProfileData(options: UseProfileDataOptions = {}): UseProfileDataReturn {
  const { targetDate = new Date(), enabled = true } = options;
  const queryClient = useQueryClient();

  const monthKey = useMemo(() => formatMonthKey(targetDate), [targetDate]);
  const todayDateKey = useMemo(() => formatDateKey(targetDate), [targetDate]);
  const monthTitle = useMemo(() => formatCurrentMonthVi(targetDate), [targetDate]);

  // ==========================================
  // TẦNG 1: DỮ LIỆU TÓM TẮT NHANH (CRITICAL FIRST-PAINT)
  // ==========================================
  const {
    data: cashflowData,
    isLoading: isCashflowLoading,
    refetch: refetchCashflow,
  } = useGetCashflowSummary(
    { monthKey },
    { query: { enabled: enabled && Boolean(monthKey) } }
  );

  const {
    data: budgetData,
    isLoading: isBudgetLoading,
    refetch: refetchBudget,
  } = useGetBudget(
    monthKey,
    { query: { enabled: enabled && Boolean(monthKey) } }
  );

  const {
    data: savingsData,
    isLoading: isSavingsLoading,
    refetch: refetchSavings,
  } = useGetSavingsGoal(
    monthKey,
    { query: { enabled: enabled && Boolean(monthKey) } }
  );

  const {
    data: calorieGoalData,
    isLoading: isCalorieGoalLoading,
    refetch: refetchCalorieGoal,
  } = useGetCalorieGoal({
    query: { enabled },
  });

  const {
    data: dailyCalorieData,
    isLoading: isDailyCalorieLoading,
    refetch: refetchDailyCalorie,
  } = useGetDailyCalorieSummary(
    todayDateKey,
    { query: { enabled } }
  );

  // ==========================================
  // TẦNG 2: DỮ LIỆU LỊCH SỬ CHI TIẾT (BACKGROUND LAZY LOAD)
  // ==========================================
  const {
    data: expenseEntriesData,
    isLoading: isEntriesLoading,
    refetch: refetchEntries,
  } = useGetExpenseEntries(
    {
      monthKey,
      type: 'ALL',
      pageable: { page: 0, size: 50 },
    },
    { query: { enabled: enabled && Boolean(monthKey) } }
  );

  const {
    data: myPhotosData,
    isLoading: isPhotosLoading,
    refetch: refetchPhotos,
  } = useGetMyPhotos(
    {
      pageable: { page: 0, size: 50 },
    },
    { query: { enabled } }
  );

  // Xử lý gom nhóm ảnh theo ngày và tính streak
  const calendarResult = useMemo(() => {
    const entries = expenseEntriesData?.content ?? [];
    const myPhotos = myPhotosData?.content ?? [];
    return aggregateCalendarData({
      entries,
      myPhotos,
      targetDate,
    });
  }, [expenseEntriesData?.content, myPhotosData?.content, targetDate]);

  // Trạng thái loading
  const isLoadingSummary =
    isCashflowLoading ||
    isBudgetLoading ||
    isSavingsLoading ||
    isCalorieGoalLoading ||
    isDailyCalorieLoading;

  const isLoadingCalendar = isEntriesLoading || isPhotosLoading;
  const isLoading = isLoadingSummary || isLoadingCalendar;

  // Tính toán trạng thái tổng hợp Profile
  const summaryState: ProfileSummaryState = useMemo(() => {
    const totalSpent = cashflowData?.totalExpense ?? 0;
    const budgetLimit =
      budgetData?.amountLimit ?? cashflowData?.budgetLimit ?? null;
    const alertPct = budgetData?.alertThresholdPct ?? 80;
    const savingsTarget = savingsData?.targetAmount ?? null;

    const percentUsed =
      budgetLimit && budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
    const remaining = (budgetLimit ?? 0) - totalSpent;
    const isBudgetExceeded =
      budgetLimit !== null && budgetLimit > 0 && remaining < 0;

    const todayCalories = dailyCalorieData?.consumedCalories ?? 0;
    const targetCalories =
      calorieGoalData?.dailyTargetCalories ??
      dailyCalorieData?.dailyTargetCalories ??
      2000;
    const calorieExceeded =
      dailyCalorieData?.isExceeded ?? todayCalories > targetCalories;
    const caloriePercentage =
      dailyCalorieData?.percentage ??
      (targetCalories > 0
        ? Math.round((todayCalories / targetCalories) * 100)
        : 0);

    return {
      totalSpent,
      budgetLimit,
      alertPct,
      savingsTarget,
      percentUsed,
      remaining,
      isBudgetExceeded,
      todayCalories,
      targetCalories,
      calorieExceeded,
      caloriePercentage,
      checkedCount: calendarResult.checkedCount,
      streakDays: calendarResult.streakDays,
    };
  }, [
    cashflowData,
    budgetData,
    savingsData,
    calorieGoalData,
    dailyCalorieData,
    calendarResult,
  ]);

  // ==========================================
  // HÀNH ĐỘNG MUTATION CẬP NHẬT
  // ==========================================
  const updateBudget = useCallback(
    async (
      limit: number,
      alertPercent: number = 80,
      targetSavings?: number | null
    ): Promise<boolean> => {
      try {
        await upsertBudget(monthKey, {
          amountLimit: limit,
          alertThresholdPct: alertPercent,
        });

        if (targetSavings !== undefined && targetSavings !== null && targetSavings > 0) {
          await upsertSavingsGoal(monthKey, {
            targetAmount: targetSavings,
          });
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [`/api/v1/expenses`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/v1/expenses/summary`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/v1/expenses/budget`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/v1/expenses/savings-goal`] }),
        ]);

        return true;
      } catch (err) {
        console.error('Lỗi khi cập nhật hạn mức ngân sách:', err);
        return false;
      }
    },
    [monthKey, queryClient]
  );

  const updateCalorieMutation = useUpdateCalorieGoal();

  const updateCalorieTarget = useCallback(
    async (targetCalories: number): Promise<boolean> => {
      try {
        await updateCalorieMutation.mutateAsync({
          dailyTargetCalories: targetCalories,
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: calorieKeys.goal() }),
          queryClient.invalidateQueries({ queryKey: ['/api/v1/calories'] }),
        ]);

        return true;
      } catch (err) {
        console.error('Lỗi khi cập nhật mục tiêu calo:', err);
        return false;
      }
    },
    [queryClient, updateCalorieMutation]
  );

  const refetch = useCallback(async () => {
    await Promise.all([
      refetchCashflow(),
      refetchBudget(),
      refetchSavings(),
      refetchCalorieGoal(),
      refetchDailyCalorie(),
      refetchEntries(),
      refetchPhotos(),
    ]);
  }, [
    refetchCashflow,
    refetchBudget,
    refetchSavings,
    refetchCalorieGoal,
    refetchDailyCalorie,
    refetchEntries,
    refetchPhotos,
  ]);

  return {
    summaryState,
    dayCalendarData: calendarResult.dayCalendarData,
    isLoadingSummary,
    isLoadingCalendar,
    isLoading,
    monthTitle,
    monthKey,
    todayDateKey,
    updateBudget,
    updateCalorieTarget,
    refetch,
  };
}
