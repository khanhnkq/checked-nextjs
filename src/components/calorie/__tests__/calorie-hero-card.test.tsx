import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CalorieHeroCard } from '../CalorieHeroCard';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('CalorieHeroCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    consumedCalories: 1650,
    targetCalories: 2000,
    remainingCalories: 350,
    isExceeded: false,
    progressRatio: 0.825,
    progressPct: 83,
    selectedDate: new Date(2026, 9, 31),
  };

  it('render đúng tiêu đề ngày, số calo lớn và đơn vị kcal', () => {
    render(<CalorieHeroCard {...defaultProps} />);

    expect(screen.getByTestId('calorie-hero-card')).toBeInTheDocument();
    expect(screen.getByText(/NĂNG LƯỢNG HÔM NAY/)).toBeInTheDocument();
    expect(screen.getByText('1.650')).toBeInTheDocument();
    expect(screen.getByText('kcal')).toBeInTheDocument();
  });

  it('render thanh tiến độ xanh và thông tin còn lại khi chưa vượt mục tiêu', () => {
    render(<CalorieHeroCard {...defaultProps} />);

    expect(
      screen.getByText('Còn lại 350 kcal (Mục tiêu 2.000)')
    ).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();

    const progressBar = screen.getByTestId('calorie-progress-bar');
    expect(progressBar).toHaveClass('bg-primary');
    expect(progressBar).not.toHaveClass('bg-error');
    expect(progressBar).toHaveStyle({ width: '82.5%' });
  });

  it('render thanh tiến độ đỏ và cảnh báo vượt khi isExceeded = true', () => {
    render(
      <CalorieHeroCard
        {...defaultProps}
        consumedCalories={2450}
        targetCalories={2000}
        remainingCalories={-450}
        isExceeded={true}
        progressRatio={1.0}
        progressPct={123}
      />
    );

    expect(screen.getByText('Vượt 450 kcal')).toBeInTheDocument();
    expect(screen.getByText('123%')).toBeInTheDocument();

    const progressBar = screen.getByTestId('calorie-progress-bar');
    expect(progressBar).toHaveClass('bg-error');
    expect(progressBar).not.toHaveClass('bg-primary');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('click vào nút icon edit ở hàng số gọi onOpenGoalSetting và kích hoạt haptics.light()', () => {
    const handleOpenGoal = vi.fn();
    render(
      <CalorieHeroCard {...defaultProps} onOpenGoalSetting={handleOpenGoal} />
    );

    const editBtn = screen.getByRole('button', {
      name: 'Chỉnh sửa mục tiêu calo',
    });
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleOpenGoal).toHaveBeenCalledTimes(1);
  });
});
