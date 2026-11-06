import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ExpenseHeroSummaryCard } from '../ExpenseHeroSummaryCard';
import { haptics } from '@/lib/utils/haptics';
import type { ExpenseDashboardSummary } from '@/types/expense';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('ExpenseHeroSummaryCard Component', () => {
  const baseSummary: ExpenseDashboardSummary = {
    monthKey: '202610',
    totalIncome: 25000000,
    totalExpense: 12500000,
    netCashflow: 12500000,
    budgetLimit: 15000000,
    budgetUsedPct: 83,
    budgetRemaining: 2500000,
    isBudgetExceeded: false,
    alertThresholdPct: 80,
    savingsTarget: 5000000,
    currentSaved: 2500000,
    savingsProgressPct: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render tiêu đề tháng và tổng chi tiêu lớn dạng tiền VNĐ', () => {
    render(<ExpenseHeroSummaryCard summary={baseSummary} monthTitle="Tháng 10, 2026" />);

    expect(screen.getByText('TỔNG CHI TIÊU • THÁNG 10, 2026')).toBeInTheDocument();
    expect(screen.getByText('12.500.000 đ')).toBeInTheDocument();
  });

  it('render thanh tiến độ và nhãn "Đã chi 83% (15tr)" khi chưa vượt hạn mức', () => {
    render(<ExpenseHeroSummaryCard summary={baseSummary} monthTitle="Tháng 10, 2026" />);

    expect(screen.getByText('Đã chi 83% (15tr)')).toBeInTheDocument();
  });

  it('render trạng thái cảnh báo đỏ khi đã vượt ngân sách', () => {
    const exceededSummary: ExpenseDashboardSummary = {
      ...baseSummary,
      totalExpense: 18000000,
      budgetUsedPct: 120,
      isBudgetExceeded: true,
      netCashflow: 7000000,
    };

    render(<ExpenseHeroSummaryCard summary={exceededSummary} monthTitle="Tháng 10, 2026" />);

    expect(screen.getByText('Vượt 120%')).toBeInTheDocument();
    const alertBtn = screen.getByRole('button', { name: 'Vượt ngân sách 120%' });
    expect(alertBtn).toBeInTheDocument();
  });

  it('render nhãn "Thiết lập ngân sách" khi chưa cài đặt hạn mức', () => {
    const noLimitSummary: ExpenseDashboardSummary = {
      ...baseSummary,
      budgetLimit: null,
      budgetUsedPct: 0,
      isBudgetExceeded: false,
    };

    render(<ExpenseHeroSummaryCard summary={noLimitSummary} monthTitle="Tháng 10, 2026" />);

    expect(screen.getByText('Thiết lập ngân sách')).toBeInTheDocument();
  });

  it('render đúng 3 cột tài chính: Thu nhập, Chi tiêu, Thuần', () => {
    render(<ExpenseHeroSummaryCard summary={baseSummary} monthTitle="Tháng 10, 2026" />);

    expect(screen.getByText('Thu nhập')).toBeInTheDocument();
    expect(screen.getByText('+25tr')).toBeInTheDocument();

    expect(screen.getByText('Chi tiêu')).toBeInTheDocument();
    expect(screen.getByText('-12.5tr')).toBeInTheDocument();

    expect(screen.getByText('Thuần')).toBeInTheDocument();
    expect(screen.getByText('+12.5tr')).toBeInTheDocument();
  });

  it('click vào vùng tiến độ ngân sách gọi onOpenBudgetSetting và haptics.light()', () => {
    const handleOpen = vi.fn();
    render(
      <ExpenseHeroSummaryCard
        summary={baseSummary}
        monthTitle="Tháng 10, 2026"
        onOpenBudgetSetting={handleOpen}
      />
    );

    const progressBtn = screen.getByRole('button', { name: /Đã chi 83% ngân sách/i });
    fireEvent.click(progressBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });

  it('click vào nút icon edit ở phần số gọi onOpenBudgetSetting và haptics.light()', () => {
    const handleOpen = vi.fn();
    render(
      <ExpenseHeroSummaryCard
        summary={baseSummary}
        monthTitle="Tháng 10, 2026"
        onOpenBudgetSetting={handleOpen}
      />
    );

    const editBtn = screen.getByRole('button', { name: 'Chỉnh sửa ngân sách' });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });
});
