import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ExpenseSavingsGoalCard } from '../ExpenseSavingsGoalCard';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('ExpenseSavingsGoalCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render tiêu đề "Mục tiêu tiết kiệm" và icon cờ', () => {
    render(<ExpenseSavingsGoalCard savingsTarget={null} currentSaved={0} />);

    expect(screen.getByText('Mục tiêu tiết kiệm')).toBeInTheDocument();
  });

  it('render trạng thái chưa đặt mục tiêu với nhãn "Chưa đặt mục tiêu" và nút "Đặt mục tiêu"', () => {
    render(<ExpenseSavingsGoalCard savingsTarget={null} currentSaved={0} />);

    expect(screen.getByText('Chưa đặt mục tiêu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đặt mục tiêu tiết kiệm' })).toBeInTheDocument();
    expect(screen.getByText('Đặt mục tiêu')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('render trạng thái đã đặt mục tiêu với tiến độ, tỷ lệ và nút icon Sửa (không có text)', () => {
    render(
      <ExpenseSavingsGoalCard
        savingsTarget={10000000}
        currentSaved={4000000}
        savingsProgressPct={40}
      />
    );

    expect(screen.getByText('4tr / 10tr')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sửa mục tiêu tiết kiệm' })).toBeInTheDocument();
    expect(screen.queryByText('Sửa')).not.toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '40%' });
    expect(progressBar).toHaveAttribute('aria-valuenow', '40');

    // Chưa đạt 100% thì không có class text-success
    const pctElement = screen.getByText('40%');
    expect(pctElement.className).toContain('text-text-primary');
    expect(pctElement.className).not.toContain('text-success');
  });

  it('tự động tính phần trăm tiến độ nếu savingsProgressPct không được truyền', () => {
    render(
      <ExpenseSavingsGoalCard
        savingsTarget={5000000}
        currentSaved={2500000}
      />
    );

    expect(screen.getByText('2.5tr / 5tr')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '50%' });
  });

  it('hiển thị màu text-success khi hoàn thành hoặc vượt mục tiêu (>= 100%)', () => {
    render(
      <ExpenseSavingsGoalCard
        savingsTarget={10000000}
        currentSaved={12000000}
        savingsProgressPct={120}
      />
    );

    const pctElement = screen.getByText('120%');
    expect(pctElement).toBeInTheDocument();
    expect(pctElement.className).toContain('text-success');

    // Thanh progress được giới hạn tối đa 100%
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('click vào nút capsule gọi onOpenSavingsSetting và kích hoạt haptics.light()', () => {
    const handleOpen = vi.fn();
    render(
      <ExpenseSavingsGoalCard
        savingsTarget={10000000}
        currentSaved={5000000}
        onOpenSavingsSetting={handleOpen}
      />
    );

    const editBtn = screen.getByRole('button', { name: 'Sửa mục tiêu tiết kiệm' });
    fireEvent.click(editBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });
});
