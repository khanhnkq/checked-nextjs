import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CalorieHeaderBar } from '../CalorieHeaderBar';
import { haptics } from '@/lib/utils/haptics';

const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
    medium: vi.fn(),
  },
}));

describe('CalorieHeaderBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render đúng tiêu đề mặc định "Năng lượng" và các nút chức năng', () => {
    render(<CalorieHeaderBar />);

    expect(screen.getByText('Năng lượng')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm món ăn' })).toBeInTheDocument();
    expect(screen.getByText('Thêm món')).toBeInTheDocument();
  });

  it('render đúng tiêu đề tùy biến khi truyền prop title', () => {
    render(<CalorieHeaderBar title="Nhật ký ăn uống" />);

    expect(screen.getByText('Nhật ký ăn uống')).toBeInTheDocument();
  });

  it('bấm nút Back gọi onBack và kích hoạt haptics.light()', () => {
    const handleBack = vi.fn();
    render(<CalorieHeaderBar onBack={handleBack} />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleBack).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('bấm nút Back gọi router.back() nếu không truyền onBack', () => {
    render(<CalorieHeaderBar />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('bấm nút Thêm món gọi onQuickAdd và kích hoạt haptics.medium()', () => {
    const handleQuickAdd = vi.fn();
    render(<CalorieHeaderBar onQuickAdd={handleQuickAdd} />);

    const addBtn = screen.getByRole('button', { name: 'Thêm món ăn' });
    fireEvent.click(addBtn);

    expect(haptics.medium).toHaveBeenCalledTimes(1);
    expect(handleQuickAdd).toHaveBeenCalledTimes(1);
  });
});
