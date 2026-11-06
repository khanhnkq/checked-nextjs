import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useExpenseDashboard } from '../useExpenseDashboard';
import * as endpoints from '@/lib/api/generated/endpoints';

vi.mock('@/lib/api/generated/endpoints', () => ({
  useGetCashflowSummary: vi.fn(),
  useGetBudget: vi.fn(),
  useGetSavingsGoal: vi.fn(),
  useGetTopCategories: vi.fn(),
  useGetYearlyCashflowSummary: vi.fn(),
  getExpenseEntries: vi.fn(),
  upsertBudget: vi.fn(),
  upsertSavingsGoal: vi.fn(),
  getGetCashflowSummaryQueryKey: vi.fn(() => ['cashflowSummary']),
  getGetBudgetQueryKey: vi.fn(() => ['budget']),
  getGetSavingsGoalQueryKey: vi.fn(() => ['savingsGoal']),
  getGetYearlyCashflowSummaryQueryKey: vi.fn(() => ['yearlyCashflow']),
  getGetTopCategoriesQueryKey: vi.fn(() => ['topCategories']),
}));

describe('useExpenseDashboard Hook (State Management & Parity)', () => {
  let queryClient: QueryClient;

  const mockRefetchCashflow = vi.fn();
  const mockRefetchBudget = vi.fn();
  const mockRefetchSavings = vi.fn();
  const mockRefetchTopCategories = vi.fn();
  const mockRefetchYearly = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock query hooks
    vi.mocked(endpoints.useGetCashflowSummary).mockReturnValue({
      data: {
        monthKey: '202610',
        totalIncome: 25000000,
        totalExpense: 12500000,
        netCashflow: 12500000,
        budgetLimit: 15000000,
        budgetUsedPct: 83,
        budgetRemaining: 2500000,
        budgetExceeded: false,
      },
      isLoading: false,
      refetch: mockRefetchCashflow,
    } as any);

    vi.mocked(endpoints.useGetBudget).mockReturnValue({
      data: {
        monthKey: '202610',
        amountLimit: 15000000,
        alertThresholdPct: 80,
        spent: 12500000,
        remaining: 2500000,
        exceeded: false,
      },
      isLoading: false,
      refetch: mockRefetchBudget,
    } as any);

    vi.mocked(endpoints.useGetSavingsGoal).mockReturnValue({
      data: {
        monthKey: '202610',
        targetAmount: 5000000,
        currentSaved: 2500000,
        progressPct: 50,
      },
      isLoading: false,
      refetch: mockRefetchSavings,
    } as any);

    vi.mocked(endpoints.useGetTopCategories).mockReturnValue({
      data: [
        { categoryId: 'cat-1', categoryName: 'Ăn uống', totalAmount: 6000000, percentage: 48 },
        { categoryId: 'cat-2', categoryName: 'Cafe', totalAmount: 2750000, percentage: 22 },
      ],
      isLoading: false,
      refetch: mockRefetchTopCategories,
    } as any);

    vi.mocked(endpoints.useGetYearlyCashflowSummary).mockReturnValue({
      data: {
        year: 2026,
        totalIncome: 250000000,
        totalExpense: 125000000,
        netCashflow: 125000000,
        months: [
          { monthKey: '202610', income: 25000000, expense: 12500000, net: 12500000 },
        ],
      },
      isLoading: false,
      refetch: mockRefetchYearly,
    } as any);

    // Mock getExpenseEntries trả về 2 giao dịch ban đầu
    vi.mocked(endpoints.getExpenseEntries).mockResolvedValue({
      number: 0,
      totalPages: 2,
      last: false,
      content: [
        {
          photoId: 'p-1',
          amount: 65000,
          note: 'Highlands Coffee',
          categoryName: 'Cafe',
          transactionType: 'EXPENSE',
          imageUrl: 'https://example.com/p1.jpg',
          createdAt: '2026-10-30T10:00:00Z',
        },
        {
          photoId: 'p-2',
          amount: 25000000,
          note: 'Lương tháng 10',
          categoryName: 'Lương',
          transactionType: 'INCOME',
          createdAt: '2026-10-25T08:00:00Z',
        },
      ],
    } as any);

    vi.mocked(endpoints.upsertBudget).mockResolvedValue({} as any);
    vi.mocked(endpoints.upsertSavingsGoal).mockResolvedValue({} as any);
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('khởi tạo với initialMonthKey và tính toán đầy đủ summary state', async () => {
    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    expect(result.current.currentMonthKey).toBe('202610');
    expect(result.current.currentYear).toBe(2026);
    expect(result.current.availableMonths).toHaveLength(7);

    // Kiểm tra dữ liệu Summary
    expect(result.current.summary.totalIncome).toBe(25000000);
    expect(result.current.summary.totalExpense).toBe(12500000);
    expect(result.current.summary.netCashflow).toBe(12500000);
    expect(result.current.summary.budgetLimit).toBe(15000000);
    expect(result.current.summary.budgetUsedPct).toBe(83);
    expect(result.current.summary.budgetRemaining).toBe(2500000);
    expect(result.current.summary.isBudgetExceeded).toBe(false);
    expect(result.current.summary.savingsTarget).toBe(5000000);
    expect(result.current.summary.currentSaved).toBe(2500000);
    expect(result.current.summary.savingsProgressPct).toBe(50);

    // Kiểm tra top categories
    expect(result.current.topCategories).toHaveLength(2);
    expect(result.current.topCategories[0].categoryName).toBe('Ăn uống');

    // Kiểm tra yearlyPoints luôn đủ 12 tháng
    expect(result.current.yearlyPoints).toHaveLength(12);
    expect(result.current.yearlyPoints[9].monthKey).toBe('202610');
    expect(result.current.yearlyPoints[9].income).toBe(25000000);

    // Chờ giao dịch ban đầu được load
    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    expect(result.current.transactions[0].note).toBe('Highlands Coffee');
    expect(result.current.transactions[0].isIncome).toBe(false);
    expect(result.current.transactions[1].isIncome).toBe(true);
  });

  it('chuyển đổi tháng (selectMonth) thành công', async () => {
    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    await act(async () => {
      await result.current.selectMonth('202611');
    });

    expect(result.current.currentMonthKey).toBe('202611');
    expect(endpoints.getExpenseEntries).toHaveBeenCalledWith(
      expect.objectContaining({ monthKey: '202611' })
    );
  });

  it('chuyển đổi năm (changeYear) tăng/giảm chính xác', async () => {
    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    await act(async () => {
      await result.current.changeYear(-1);
    });

    expect(result.current.currentYear).toBe(2025);
    expect(result.current.currentMonthKey).toBe('202510');

    await act(async () => {
      await result.current.changeYear(1);
    });

    expect(result.current.currentYear).toBe(2026);
    expect(result.current.currentMonthKey).toBe('202610');
  });

  it('chuyển đổi bộ lọc giao dịch (selectFilter) và gọi API tương ứng', async () => {
    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    await act(async () => {
      await result.current.selectFilter('EXPENSE');
    });

    expect(result.current.selectedFilter).toBe('EXPENSE');
    expect(endpoints.getExpenseEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        monthKey: '202610',
        type: 'EXPENSE',
      })
    );

    await act(async () => {
      await result.current.selectFilter('INCOME');
    });

    expect(result.current.selectedFilter).toBe('INCOME');
    expect(endpoints.getExpenseEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        monthKey: '202610',
        type: 'INCOME',
      })
    );
  });

  it('hỗ trợ phân trang vô tận (loadMoreTransactions) nối thêm kết quả', async () => {
    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    // Mock trang 2
    vi.mocked(endpoints.getExpenseEntries).mockResolvedValueOnce({
      number: 1,
      totalPages: 2,
      last: true,
      content: [
        {
          photoId: 'p-3',
          amount: 95000,
          note: 'Cơm tấm Ba Ghiền',
          categoryName: 'Ăn uống',
          transactionType: 'EXPENSE',
          createdAt: '2026-10-24T12:00:00Z',
        },
      ],
    } as any);

    await act(async () => {
      await result.current.loadMoreTransactions();
    });

    expect(result.current.transactions).toHaveLength(3);
    expect(result.current.transactions[2].note).toBe('Cơm tấm Ba Ghiền');
    expect(result.current.hasMorePages).toBe(false);
  });

  it('quản lý trạng thái mở sheet ngân sách và ảnh xem trước', async () => {
    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    expect(result.current.isBudgetSheetOpen).toBe(false);
    expect(result.current.previewImageUrl).toBeNull();

    act(() => {
      result.current.setIsBudgetSheetOpen(true);
      result.current.setPreviewImageUrl('https://example.com/receipt.jpg');
    });

    expect(result.current.isBudgetSheetOpen).toBe(true);
    expect(result.current.previewImageUrl).toBe('https://example.com/receipt.jpg');
  });

  it('lưu ngân sách (saveBudget) và invalidate query cache thành công', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    let success = false;
    await act(async () => {
      success = await result.current.saveBudget(20000000, 85);
    });

    expect(success).toBe(true);
    expect(endpoints.upsertBudget).toHaveBeenCalledWith('202610', {
      amountLimit: 20000000,
      alertThresholdPct: 85,
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('lưu mục tiêu tiết kiệm (saveSavingsGoal) thành công', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    let success = false;
    await act(async () => {
      success = await result.current.saveSavingsGoal(8000000);
    });

    expect(success).toBe(true);
    expect(endpoints.upsertSavingsGoal).toHaveBeenCalledWith('202610', {
      targetAmount: 8000000,
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('làm mới toàn bộ dữ liệu khi gọi refresh()', async () => {
    const { result } = renderHook(() => useExpenseDashboard({ initialMonthKey: '202610' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockRefetchCashflow).toHaveBeenCalled();
    expect(mockRefetchBudget).toHaveBeenCalled();
    expect(mockRefetchSavings).toHaveBeenCalled();
    expect(mockRefetchTopCategories).toHaveBeenCalled();
    expect(mockRefetchYearly).toHaveBeenCalled();
  });
});
