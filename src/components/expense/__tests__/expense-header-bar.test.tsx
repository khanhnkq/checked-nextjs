import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ExpenseHeaderBar } from '../ExpenseHeaderBar';
import { haptics } from '@/lib/utils/haptics';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('ExpenseHeaderBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render đúng tiêu đề mặc định và nút Back tròn', () => {
    render(<ExpenseHeaderBar />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chi tiêu');
    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveClass('w-11', 'h-11', 'bg-surface', 'rounded-full');
  });

  it('render đúng tiêu đề tùy biến khi được truyền prop title', () => {
    render(<ExpenseHeaderBar title="Lịch sử chi tiêu" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lịch sử chi tiêu');
  });

  it('gọi haptics.light() và router.back() khi click nút Back mà không truyền onBack', () => {
    render(<ExpenseHeaderBar />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('gọi haptics.light() và prop onBack khi được truyền', () => {
    const handleBack = vi.fn();
    render(<ExpenseHeaderBar onBack={handleBack} />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
  });
});
