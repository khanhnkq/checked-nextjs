import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TransactionFilterTabs } from '../TransactionFilterTabs';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('TransactionFilterTabs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render đầy đủ 3 tabs: Tất cả, Chi tiêu, Thu nhập', () => {
    render(
      <TransactionFilterTabs
        selectedFilter="ALL"
        onSelectFilter={vi.fn()}
      />
    );

    expect(screen.getByRole('tab', { name: 'Tất cả' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Chi tiêu' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Thu nhập' })).toBeInTheDocument();
  });

  it('đánh dấu đúng tab đang active với aria-selected và màu Matcha Glow (bg-primary)', () => {
    render(
      <TransactionFilterTabs
        selectedFilter="EXPENSE"
        onSelectFilter={vi.fn()}
      />
    );

    const expenseTab = screen.getByRole('tab', { name: 'Chi tiêu' });
    const allTab = screen.getByRole('tab', { name: 'Tất cả' });
    const incomeTab = screen.getByRole('tab', { name: 'Thu nhập' });

    expect(expenseTab).toHaveAttribute('aria-selected', 'true');
    expect(expenseTab.className).toContain('bg-primary');
    expect(expenseTab.className).toContain('font-bold');

    expect(allTab).toHaveAttribute('aria-selected', 'false');
    expect(allTab.className).toContain('bg-surface');

    expect(incomeTab).toHaveAttribute('aria-selected', 'false');
    expect(incomeTab.className).toContain('bg-surface');
  });

  it('click vào tab khác kích hoạt haptics.light() và gọi onSelectFilter', () => {
    const handleSelect = vi.fn();
    render(
      <TransactionFilterTabs
        selectedFilter="ALL"
        onSelectFilter={handleSelect}
      />
    );

    const incomeTab = screen.getByRole('tab', { name: 'Thu nhập' });
    fireEvent.click(incomeTab);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith('INCOME');
  });

  it('click vào tab đang được chọn không gọi lại callback hoặc haptic', () => {
    const handleSelect = vi.fn();
    render(
      <TransactionFilterTabs
        selectedFilter="ALL"
        onSelectFilter={handleSelect}
      />
    );

    const allTab = screen.getByRole('tab', { name: 'Tất cả' });
    fireEvent.click(allTab);

    expect(haptics.light).not.toHaveBeenCalled();
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
