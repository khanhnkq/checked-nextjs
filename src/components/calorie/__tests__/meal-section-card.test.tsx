import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MealSectionCard } from '../MealSectionCard';
import { haptics } from '@/lib/utils/haptics';
import type { CalorieMealItem } from '@/types/calorie';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('MealSectionCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockItems: CalorieMealItem[] = [
    {
      id: 'm1',
      calories: 300,
      mealType: 'LUNCH',
      dishName: 'Cơm gà xối mỡ',
      loggedAt: '2026-11-01T12:00:00Z',
    },
    {
      id: 'm2',
      calories: 150,
      mealType: 'LUNCH',
      dishName: 'Canh chua cá',
      loggedAt: '2026-11-01T12:15:00Z',
    },
  ];

  it('render đúng tên bữa, khung giờ và tổng calo khi có món', () => {
    render(<MealSectionCard type="LUNCH" items={mockItems} isCurrentMealNow={false} />);

    expect(screen.getByText('Bữa trưa')).toBeInTheDocument();
    expect(screen.getByText('10:30 - 14:30')).toBeInTheDocument();
    expect(screen.getByText('450 kcal')).toBeInTheDocument();

    expect(screen.getByText('Cơm gà xối mỡ')).toBeInTheDocument();
    expect(screen.getByText('Canh chua cá')).toBeInTheDocument();
  });

  it('render badge "Hiện tại" khi isCurrentMealNow = true', () => {
    render(<MealSectionCard type="LUNCH" items={[]} isCurrentMealNow={true} />);

    expect(screen.getByTestId('current-meal-badge')).toBeInTheDocument();
    expect(screen.getByText('Hiện tại')).toBeInTheDocument();
    expect(screen.queryByText('10:30 - 14:30')).not.toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: 'Thêm món vào Bữa trưa' });
    expect(addBtn).toHaveClass('bg-primary');
  });

  it('ẩn tổng calo khi chưa có món ăn nào', () => {
    render(<MealSectionCard type="DINNER" items={[]} isCurrentMealNow={false} />);

    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument();
  });

  it('click nút + gọi onQuickAdd với đúng mealType và rung haptics', () => {
    const handleQuickAdd = vi.fn();
    render(
      <MealSectionCard
        type="BREAKFAST"
        items={[]}
        onQuickAdd={handleQuickAdd}
      />
    );

    const addBtn = screen.getByRole('button', { name: 'Thêm món vào Bữa sáng' });
    fireEvent.click(addBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleQuickAdd).toHaveBeenCalledWith('BREAKFAST');
  });
});
