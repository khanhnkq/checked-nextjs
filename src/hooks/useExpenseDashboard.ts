'use client';

/**
 * useExpenseDashboard Hook
 * Điều phối dữ liệu & state management cho Bảng điều khiển Chi tiêu (/expense)
 * Chuẩn Parity 1:1 với ExpenseDashboardViewModel.swift trong checked-ios
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCashflowSummary,
  useGetBudget,
  useGetSavingsGoal,
  useGetTopCategories,
  useGetYearlyCashflowSummary,
  getExpenseEntries,
  upsertBudget,
  upsertSavingsGoal,
  getGetCashflowSummaryQueryKey,
  getGetBudgetQueryKey,
  getGetSavingsGoalQueryKey,
  getGetYearlyCashflowSummaryQueryKey,
  getGetTopCategoriesQueryKey,
} from '@/lib/api/generated/endpoints';
import {
  normalizeMonthKey,
  generateAvailableMonths,
  generate12MonthsCashflowPoints,
} from '@/lib/utils/expense-formatters';
import type {
  TransactionFilterOption,
  ExpenseTransaction,
  TopCategorySpend,
  MonthlyCashflowPoint,
  ExpenseDashboardSummary,
} from '@/types/expense';
import type { ExpenseItemResponse } from '@/types/api.generated.ts/expenseItemResponse';

export interface UseExpenseDashboardOptions {
  initialMonthKey?: string;
  enabled?: boolean;
}

export interface UseExpenseDashboardReturn {
  // State
  currentMonthKey: string;
  currentYear: number;
  availableMonths: string[];
  selectedFilter: TransactionFilterOption;

  // Data
  summary: ExpenseDashboardSummary;
  topCategories: TopCategorySpend[];
  transactions: ExpenseTransaction[];
  yearlyPoints: MonthlyCashflowPoint[];

  // Loading & Pagination States
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMorePages: boolean;
  currentPage: number;
  totalPages: number;
  errorMessage: string | null;

  // UI Sheets & Overlays
  isBudgetSheetOpen: boolean;
  setIsBudgetSheetOpen: (open: boolean) => void;
  previewImageUrl: string | null;
  setPreviewImageUrl: (url: string | null) => void;

  // Actions
  selectMonth: (monthKey: string) => Promise<void>;
  changeYear: (offset: number) => Promise<void>;
  selectFilter: (filter: TransactionFilterOption) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  refresh: () => Promise<void>;
  saveBudget: (amountLimit: number, alertThresholdPct: number) => Promise<boolean>;
  saveSavingsGoal: (targetAmount: number) => Promise<boolean>;
}

/**
 * Lấy monthKey mặc định dạng yyyyMM cho thời điểm hiện tại
 */
function getDefaultMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
}

/**
 * Chuyển đổi DTO ExpenseItemResponse từ backend sang ExpenseTransaction UI
 */
function mapExpenseItemToTransaction(item: ExpenseItemResponse, index: number): ExpenseTransaction {
  const isIncome = item.transactionType === 'INCOME';
  return {
    id: item.photoId || `tx-${index}-${item.createdAt || Date.now()}`,
    amount: item.amount ?? 0,
    isIncome,
    note: item.note,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    imageUrl: item.imageUrl,
    thumbnailUrl: item.thumbnailUrl,
    takenAt: item.takenAt,
    createdAt: item.createdAt ?? item.takenAt ?? new Date().toISOString(),
  };
}

export function useExpenseDashboard(options: UseExpenseDashboardOptions = {}): UseExpenseDashboardReturn {
  const { initialMonthKey, enabled = true } = options;
  const queryClient = useQueryClient();

  // 1. Quản lý tháng & năm hiện tại
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(() => {
    if (initialMonthKey) {
      const parsed = normalizeMonthKey(initialMonthKey);
      if (parsed) return parsed.normalizedKey;
    }
    return getDefaultMonthKey();
  });

  const parsedCurrentMonth = useMemo(() => {
    return normalizeMonthKey(currentMonthKey) ?? {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      normalizedKey: currentMonthKey,
    };
  }, [currentMonthKey]);

  const currentYear = parsedCurrentMonth.year;

  // 2. Danh sách các tháng lân cận (7 tháng)
  const availableMonths = useMemo(() => {
    return generateAvailableMonths(currentMonthKey);
  }, [currentMonthKey]);

  // 3. UI States
  const [selectedFilter, setSelectedFilter] = useState<TransactionFilterOption>('ALL');
  const [isBudgetSheetOpen, setIsBudgetSheetOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 4. Phân trang giao dịch
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasMorePages, setHasMorePages] = useState<boolean>(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // 5. TanStack Queries (Stale-While-Revalidate)
  const {
    data: cashflowData,
    isLoading: isCashflowLoading,
    refetch: refetchCashflow,
  } = useGetCashflowSummary(
    { monthKey: currentMonthKey },
    { query: { enabled: enabled && Boolean(currentMonthKey) } }
  );

  const {
    data: budgetData,
    isLoading: isBudgetLoading,
    refetch: refetchBudget,
  } = useGetBudget(
    currentMonthKey,
    { query: { enabled: enabled && Boolean(currentMonthKey) } }
  );

  const {
    data: savingsData,
    isLoading: isSavingsLoading,
    refetch: refetchSavings,
  } = useGetSavingsGoal(
    currentMonthKey,
    { query: { enabled: enabled && Boolean(currentMonthKey) } }
  );

  const {
    data: topCategoriesData,
    isLoading: isTopCategoriesLoading,
    refetch: refetchTopCategories,
  } = useGetTopCategories(
    { monthKey: currentMonthKey, type: 'EXPENSE', limit: 6 },
    { query: { enabled: enabled && Boolean(currentMonthKey) } }
  );

  const {
    data: yearlyData,
    isLoading: isYearlyLoading,
    refetch: refetchYearly,
  } = useGetYearlyCashflowSummary(
    { year: currentYear },
    { query: { enabled: enabled && Boolean(currentYear) } }
  );

  // 6. Hàm nạp danh sách giao dịch theo trang
  const fetchTransactionsPage = useCallback(
    async (monthKey: string, filter: TransactionFilterOption, page: number): Promise<void> => {
      const filterParam = filter === 'ALL' ? undefined : filter;
      try {
        if (page === 0) {
          setIsLoadingTransactions(true);
        } else {
          setIsLoadingMore(true);
        }
        setErrorMessage(null);

        const res = await getExpenseEntries({
          monthKey,
          type: filterParam,
          pageable: { page, size: 20 },
        });

        const items = res?.content ?? [];
        const mapped = items.map((item, idx) => mapExpenseItemToTransaction(item, idx));

        if (page === 0) {
          setTransactions(mapped);
        } else {
          setTransactions((prev) => [...prev, ...mapped]);
        }

        setCurrentPage(res?.number ?? page);
        setTotalPages(res?.totalPages ?? 1);
        setHasMorePages(!res?.last);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách giao dịch');
      } finally {
        setIsLoadingTransactions(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Tự động tải trang đầu tiên khi đổi monthKey hoặc filter
  useEffect(() => {
    if (enabled && currentMonthKey) {
      fetchTransactionsPage(currentMonthKey, selectedFilter, 0);
    }
  }, [enabled, currentMonthKey, selectedFilter, fetchTransactionsPage]);

  // 7. Computed Data Output
  const summary: ExpenseDashboardSummary = useMemo(() => {
    const totalIncome = cashflowData?.totalIncome ?? 0;
    const totalExpense = cashflowData?.totalExpense ?? 0;
    const netCashflow = cashflowData?.netCashflow ?? totalIncome - totalExpense;

    const budgetLimit = budgetData?.amountLimit ?? cashflowData?.budgetLimit ?? null;
    const alertThresholdPct = budgetData?.alertThresholdPct ?? 80;
    const isBudgetExceeded =
      cashflowData?.budgetExceeded ??
      budgetData?.exceeded ??
      (budgetLimit !== null && budgetLimit > 0 ? totalExpense > budgetLimit : false);

    const budgetUsedPct =
      cashflowData?.budgetUsedPct ??
      (budgetLimit !== null && budgetLimit > 0 ? Math.round((totalExpense / budgetLimit) * 100) : 0);

    const budgetRemaining =
      cashflowData?.budgetRemaining ?? (budgetLimit !== null ? budgetLimit - totalExpense : 0);

    const savingsTarget = savingsData?.targetAmount ?? null;
    const currentSaved = savingsData?.currentSaved ?? 0;
    const savingsProgressPct =
      savingsData?.progressPct ??
      (savingsTarget !== null && savingsTarget > 0
        ? Math.min(Math.round((currentSaved / savingsTarget) * 100), 100)
        : 0);

    return {
      monthKey: currentMonthKey,
      totalIncome,
      totalExpense,
      netCashflow,
      budgetLimit,
      budgetUsedPct,
      budgetRemaining,
      isBudgetExceeded,
      alertThresholdPct,
      savingsTarget,
      currentSaved,
      savingsProgressPct,
    };
  }, [currentMonthKey, cashflowData, budgetData, savingsData]);

  const topCategories: TopCategorySpend[] = useMemo(() => {
    if (!topCategoriesData || !Array.isArray(topCategoriesData)) return [];
    return topCategoriesData.map((cat, idx) => ({
      categoryId: cat.categoryId || `cat-${idx}`,
      categoryName: cat.categoryName || 'Khác',
      totalAmount: cat.totalAmount ?? 0,
      percentage: cat.percentage ?? 0,
    }));
  }, [topCategoriesData]);

  const yearlyPoints: MonthlyCashflowPoint[] = useMemo(() => {
    return generate12MonthsCashflowPoints(currentYear, yearlyData?.months);
  }, [currentYear, yearlyData?.months]);

  // 8. Actions
  const selectMonth = useCallback(async (monthKey: string) => {
    const parsed = normalizeMonthKey(monthKey);
    if (!parsed) return;
    setCurrentMonthKey(parsed.normalizedKey);
  }, []);

  const changeYear = useCallback(
    async (offset: number) => {
      const nextYear = currentYear + offset;
      const monthStr = parsedCurrentMonth.month.toString().padStart(2, '0');
      const newMonthKey = `${nextYear}${monthStr}`;
      setCurrentMonthKey(newMonthKey);
    },
    [currentYear, parsedCurrentMonth.month]
  );

  const selectFilter = useCallback(async (filter: TransactionFilterOption) => {
    setSelectedFilter(filter);
  }, []);

  const loadMoreTransactions = useCallback(async () => {
    if (isLoadingMore || !hasMorePages || currentPage + 1 >= totalPages) {
      return;
    }
    await fetchTransactionsPage(currentMonthKey, selectedFilter, currentPage + 1);
  }, [isLoadingMore, hasMorePages, currentPage, totalPages, currentMonthKey, selectedFilter, fetchTransactionsPage]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchCashflow(),
        refetchBudget(),
        refetchSavings(),
        refetchTopCategories(),
        refetchYearly(),
        fetchTransactionsPage(currentMonthKey, selectedFilter, 0),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchCashflow,
    refetchBudget,
    refetchSavings,
    refetchTopCategories,
    refetchYearly,
    fetchTransactionsPage,
    currentMonthKey,
    selectedFilter,
  ]);

  const saveBudget = useCallback(
    async (amountLimit: number, alertThresholdPct: number): Promise<boolean> => {
      try {
        await upsertBudget(currentMonthKey, {
          amountLimit,
          alertThresholdPct,
        });

        // Invalidate queries liên quan để đồng bộ
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetCashflowSummaryQueryKey({ monthKey: currentMonthKey }) }),
          queryClient.invalidateQueries({ queryKey: getGetBudgetQueryKey(currentMonthKey) }),
        ]);

        return true;
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Không thể lưu ngân sách');
        return false;
      }
    },
    [currentMonthKey, queryClient]
  );

  const saveSavingsGoal = useCallback(
    async (targetAmount: number): Promise<boolean> => {
      try {
        await upsertSavingsGoal(currentMonthKey, {
          targetAmount,
        });

        // Invalidate query mục tiêu tiết kiệm
        await queryClient.invalidateQueries({ queryKey: getGetSavingsGoalQueryKey(currentMonthKey) });

        return true;
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Không thể lưu mục tiêu tiết kiệm');
        return false;
      }
    },
    [currentMonthKey, queryClient]
  );

  const isLoading =
    (isCashflowLoading || isBudgetLoading || isSavingsLoading || isTopCategoriesLoading || isYearlyLoading) &&
    !cashflowData &&
    transactions.length === 0;

  return {
    currentMonthKey,
    currentYear,
    availableMonths,
    selectedFilter,
    summary,
    topCategories,
    transactions,
    yearlyPoints,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMorePages,
    currentPage,
    totalPages,
    errorMessage,
    isBudgetSheetOpen,
    setIsBudgetSheetOpen,
    previewImageUrl,
    setPreviewImageUrl,
    selectMonth,
    changeYear,
    selectFilter,
    loadMoreTransactions,
    refresh,
    saveBudget,
    saveSavingsGoal,
  };
}
