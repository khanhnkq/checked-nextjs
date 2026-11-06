import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { YearlyCashflowChart } from '../YearlyCashflowChart';
import { haptics } from '@/lib/utils/haptics';
import type { MonthlyCashflowPoint } from '@/types/expense';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
    selection: vi.fn(),
  },
}));

describe('YearlyCashflowChart Component', () => {
  const mockSelectMonth = vi.fn();
  const mockChangeYear = vi.fn();

  const mockYearlyPoints: MonthlyCashflowPoint[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const monthStr = m.toString().padStart(2, '0');
    return {
      monthKey: `2026${monthStr}`,
      monthIndex: m,
      monthName: `T${m}`,
      income: m === 10 ? 25000000 : 10000000,
      expense: m === 10 ? 12000000 : 5000000,
      net: m === 10 ? 13000000 : 5000000,
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render đúng tiêu đề năm, nút chuyển năm và chú thích Legend', () => {
    render(
      <YearlyCashflowChart
        currentYear={2026}
        currentMonthKey="202610"
        yearlyPoints={mockYearlyPoints}
        onSelectMonth={mockSelectMonth}
        onChangeYear={mockChangeYear}
      />
    );

    expect(screen.getByText('Dòng tiền 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Năm trước' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Năm sau' })).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Chi')).toBeInTheDocument();
  });

  it('render đầy đủ 12 cột tháng từ T1 đến T12', () => {
    render(
      <YearlyCashflowChart
        currentYear={2026}
        currentMonthKey="202610"
        yearlyPoints={mockYearlyPoints}
        onSelectMonth={mockSelectMonth}
        onChangeYear={mockChangeYear}
      />
    );

    for (let m = 1; m <= 12; m++) {
      expect(screen.getByText(`T${m}`)).toBeInTheDocument();
    }
  });

  it('tháng đang chọn có aria-current="date" và style active', () => {
    render(
      <YearlyCashflowChart
        currentYear={2026}
        currentMonthKey="202610"
        yearlyPoints={mockYearlyPoints}
        onSelectMonth={mockSelectMonth}
        onChangeYear={mockChangeYear}
      />
    );

    const monthButtons = screen.getAllByRole('button');
    // Tháng 10 là button có aria-current="date"
    const activeMonthBtn = monthButtons.find((btn) => btn.getAttribute('aria-current') === 'date');
    expect(activeMonthBtn).toBeDefined();
    expect(activeMonthBtn).toHaveClass('bg-secondary');
  });

  it('click nút chuyển năm trước và năm sau gọi onChangeYear và haptics.light()', () => {
    render(
      <YearlyCashflowChart
        currentYear={2026}
        currentMonthKey="202610"
        yearlyPoints={mockYearlyPoints}
        onSelectMonth={mockSelectMonth}
        onChangeYear={mockChangeYear}
      />
    );

    const prevBtn = screen.getByRole('button', { name: 'Năm trước' });
    fireEvent.click(prevBtn);
    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(mockChangeYear).toHaveBeenCalledWith(-1);

    const nextBtn = screen.getByRole('button', { name: 'Năm sau' });
    fireEvent.click(nextBtn);
    expect(haptics.light).toHaveBeenCalledTimes(2);
    expect(mockChangeYear).toHaveBeenCalledWith(1);
  });

  it('click vào một tháng gọi onSelectMonth với đúng monthKey và haptics.selection()', () => {
    render(
      <YearlyCashflowChart
        currentYear={2026}
        currentMonthKey="202610"
        yearlyPoints={mockYearlyPoints}
        onSelectMonth={mockSelectMonth}
        onChangeYear={mockChangeYear}
      />
    );

    const month5Btn = screen.getByRole('button', {
      name: /Tháng 5, thu 10000000, chi 5000000/i,
    });
    fireEvent.click(month5Btn);

    expect(haptics.selection).toHaveBeenCalledTimes(1);
    expect(mockSelectMonth).toHaveBeenCalledWith('202605');
  });

  it('xử lý an toàn khi yearlyPoints rỗng', () => {
    render(
      <YearlyCashflowChart
        currentYear={2026}
        currentMonthKey="202610"
        yearlyPoints={[]}
        onSelectMonth={mockSelectMonth}
        onChangeYear={mockChangeYear}
      />
    );

    expect(screen.getByText('Dòng tiền 2026')).toBeInTheDocument();
  });
});
