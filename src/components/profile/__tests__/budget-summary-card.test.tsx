import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BudgetSummaryCard } from '../BudgetSummaryCard';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
  },
}));

describe('BudgetSummaryCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    totalSpent: 1200000,
    budgetLimit: 3000000,
    percentUsed: 40,
    remaining: 1800000,
    isBudgetExceeded: false,
    alertPct: 80,
  };

  it('hiển thị khung skeleton khi isLoading=true và chưa có dữ liệu', () => {
    render(
      <BudgetSummaryCard
        totalSpent={0}
        budgetLimit={null}
        percentUsed={0}
        remaining={0}
        isBudgetExceeded={false}
        isLoading={true}
      />
    );

    expect(screen.getByTestId('budget-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('/ Chưa đặt hạn mức')).not.toBeInTheDocument();
  });

  it('hiển thị đúng số tiền đã chi và hạn mức tháng khi trong ngân sách', () => {
    render(<BudgetSummaryCard {...defaultProps} />);

    expect(screen.getByText('Chi tiêu tháng này')).toBeInTheDocument();
    expect(screen.getByText(/1\.200\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\/.*3\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText('Tiến độ: 40%')).toBeInTheDocument();
    expect(screen.getByText(/Còn lại:.*1\.800\.000/)).toBeInTheDocument();

    const progressBar = screen.getByTestId('budget-progress-bar');
    expect(progressBar).toHaveClass('bg-primary');
    expect(progressBar).not.toHaveClass('bg-error');
  });

  it('hiển thị "/ Chưa đặt hạn mức" và hướng dẫn nếu chưa thiết lập ngân sách', () => {
    render(
      <BudgetSummaryCard
        totalSpent={500000}
        budgetLimit={null}
        percentUsed={0}
        remaining={-500000}
        isBudgetExceeded={false}
      />
    );

    expect(screen.getByText('/ Chưa đặt hạn mức')).toBeInTheDocument();
    expect(
      screen.getByText('Chạm để xem chi tiết & thiết lập hạn mức')
    ).toBeInTheDocument();
  });

  it('đổi màu thanh tiến độ sang đỏ và hiện chữ Vượt khi vượt hạn mức', () => {
    render(
      <BudgetSummaryCard
        totalSpent={3500000}
        budgetLimit={3000000}
        percentUsed={116.6}
        remaining={-500000}
        isBudgetExceeded={true}
      />
    );

    expect(screen.getByText(/Vượt:.*500\.000/)).toBeInTheDocument();
    const progressBar = screen.getByTestId('budget-progress-bar');
    expect(progressBar).toHaveClass('bg-error');
  });

  it('hiển thị cảnh báo khi chạm ngưỡng percentUsed >= alertPct', () => {
    render(
      <BudgetSummaryCard
        totalSpent={2500000}
        budgetLimit={3000000}
        percentUsed={83.3}
        remaining={500000}
        isBudgetExceeded={false}
        alertPct={80}
      />
    );

    const warning = screen.getByTestId('budget-warning');
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent('Đã chạm ngưỡng cảnh báo 80%');
  });

  it('không hiển thị cảnh báo khi đã vượt hạn mức (chuyển sang trạng thái Vượt)', () => {
    render(
      <BudgetSummaryCard
        totalSpent={3500000}
        budgetLimit={3000000}
        percentUsed={116.6}
        remaining={-500000}
        isBudgetExceeded={true}
        alertPct={80}
      />
    );

    expect(screen.queryByTestId('budget-warning')).not.toBeInTheDocument();
  });

  it('hiển thị mục tiêu tiết kiệm khi savingsTarget > 0', () => {
    render(<BudgetSummaryCard {...defaultProps} savingsTarget={1000000} />);

    expect(screen.getByText(/Mục tiêu tiết kiệm:.*1\.000\.000/)).toBeInTheDocument();
  });

  it('gọi callback onClick và kích hoạt rung haptic khi bấm vào thẻ', () => {
    const onClick = vi.fn();
    render(<BudgetSummaryCard {...defaultProps} onClick={onClick} />);

    const card = screen.getByRole('button', { name: 'Thẻ chi tiêu tháng này' });
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(haptics.click).toHaveBeenCalledTimes(1);
  });

  it('gọi callback onArrowClick và haptics.light khi bấm vào mũi tên mà không kích hoạt onClick của thẻ', () => {
    const onClick = vi.fn();
    const onArrowClick = vi.fn();
    render(
      <BudgetSummaryCard
        {...defaultProps}
        onClick={onClick}
        onArrowClick={onArrowClick}
      />
    );

    const arrowBtn = screen.getByRole('button', {
      name: 'Xem chi tiết màn hình chi tiêu',
    });
    fireEvent.click(arrowBtn);

    expect(onArrowClick).toHaveBeenCalledTimes(1);
    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
