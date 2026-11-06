import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MealItemRow } from '../MealItemRow';
import { haptics } from '@/lib/utils/haptics';
import type { CalorieMealItem } from '@/types/calorie';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('MealItemRow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseMeal: CalorieMealItem = {
    id: 'meal-1',
    calories: 450,
    mealType: 'LUNCH',
    dishName: 'Bún chả Hà Nội',
    note: 'Ít bún, nhiều rau',
    thumbnailUrl: 'https://example.com/buncha.jpg',
    loggedAt: '2026-11-01T12:30:00Z',
  };

  it('render đầy đủ tên món, ghi chú, lượng calo và ảnh thumbnail', () => {
    render(<MealItemRow meal={baseMeal} />);

    expect(screen.getByText('Bún chả Hà Nội')).toBeInTheDocument();
    expect(screen.getByText('Ít bún, nhiều rau')).toBeInTheDocument();
    expect(screen.getByText('+450 kcal')).toBeInTheDocument();

    const img = screen.getByRole('img', { name: 'Bún chả Hà Nội' });
    expect(img).toHaveAttribute('src', 'https://example.com/buncha.jpg');
  });

  it('render icon mặc định khi món ăn không có ảnh', () => {
    const noImgMeal: CalorieMealItem = {
      ...baseMeal,
      id: 'meal-2',
      thumbnailUrl: null,
      imageUrl: null,
    };

    render(<MealItemRow meal={noImgMeal} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('click nút xóa món kích hoạt callback onDelete và haptics.light()', () => {
    const handleDelete = vi.fn();
    render(<MealItemRow meal={baseMeal} onDelete={handleDelete} />);

    const deleteBtn = screen.getByRole('button', { name: 'Xóa Bún chả Hà Nội' });
    fireEvent.click(deleteBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledWith('meal-1');
  });
});
