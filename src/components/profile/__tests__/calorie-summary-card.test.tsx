import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CalorieSummaryCard } from '../CalorieSummaryCard';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
  },
}));

describe('CalorieSummaryCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    todayCalories: 1450,
    targetCalories: 2000,
    caloriePercentage: 73,
    calorieExceeded: false,
  };

  it('hiển thị khung skeleton khi isLoading=true và chưa có dữ liệu calo (todayCalories=0)', () => {
    render(
      <CalorieSummaryCard
        todayCalories={0}
        targetCalories={2000}
        caloriePercentage={0}
        calorieExceeded={false}
        isLoading={true}
      />
    );

    expect(screen.getByTestId('calorie-skeleton')).toBeInTheDocument();
    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument();
  });

  it('hiển thị đúng số calo đã nạp, mục tiêu và mức còn lại khi chưa vượt calo', () => {
    render(<CalorieSummaryCard {...defaultProps} />);

    expect(screen.getByText('Năng lượng hôm nay')).toBeInTheDocument();
    expect(screen.getByText('1450 kcal')).toBeInTheDocument();
    expect(screen.getByText('/ 2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('Tiến độ: 73%')).toBeInTheDocument();
    expect(screen.getByText('Còn lại: 550 kcal')).toBeInTheDocument();

    const progressBar = screen.getByTestId('calorie-progress-bar');
    expect(progressBar).toHaveClass('bg-primary');
    expect(progressBar).not.toHaveClass('bg-error');
    expect(progressBar).toHaveStyle({ width: '73%' });
  });

  it('đổi màu thanh tiến độ sang đỏ và hiển thị Vượt khi vượt calo mục tiêu', () => {
    render(
      <CalorieSummaryCard
        todayCalories={2350}
        targetCalories={2000}
        caloriePercentage={118}
        calorieExceeded={true}
      />
    );

    expect(screen.getByText('2350 kcal')).toBeInTheDocument();
    expect(screen.getByText('Tiến độ: 118%')).toBeInTheDocument();
    expect(screen.getByText('Vượt: 350 kcal')).toBeInTheDocument();

    const progressBar = screen.getByTestId('calorie-progress-bar');
    expect(progressBar).toHaveClass('bg-error');
    expect(progressBar).not.toHaveClass('bg-primary');
    // Thanh progress tối đa 100%
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('xử lý an toàn khi todayCalories bằng đúng targetCalories (Còn lại: 0 kcal)', () => {
    render(
      <CalorieSummaryCard
        todayCalories={2000}
        targetCalories={2000}
        caloriePercentage={100}
        calorieExceeded={false}
      />
    );

    expect(screen.getByText('2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('Tiến độ: 100%')).toBeInTheDocument();
    expect(screen.getByText('Còn lại: 0 kcal')).toBeInTheDocument();

    const progressBar = screen.getByTestId('calorie-progress-bar');
    expect(progressBar).toHaveClass('bg-primary');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('gọi haptics.click và callback onClick khi click vào thẻ', () => {
    const handleClick = vi.fn();
    render(<CalorieSummaryCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: 'Thẻ năng lượng hôm nay' });
    fireEvent.click(card);

    expect(haptics.click).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('hỗ trợ điều khiển bàn phím (phím Enter và Space)', () => {
    const handleClick = vi.fn();
    render(<CalorieSummaryCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: 'Thẻ năng lượng hôm nay' });

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('gọi callback onArrowClick và haptics.light khi bấm vào mũi tên mà không kích hoạt onClick của thẻ', () => {
    const onClick = vi.fn();
    const onArrowClick = vi.fn();
    render(
      <CalorieSummaryCard
        {...defaultProps}
        onClick={onClick}
        onArrowClick={onArrowClick}
      />
    );

    const arrowBtn = screen.getByRole('button', {
      name: 'Xem chi tiết màn hình năng lượng',
    });
    fireEvent.click(arrowBtn);

    expect(onArrowClick).toHaveBeenCalledTimes(1);
    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
