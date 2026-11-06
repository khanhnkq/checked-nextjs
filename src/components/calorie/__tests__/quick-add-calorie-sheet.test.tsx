import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QuickAddCalorieSheet } from '../QuickAddCalorieSheet';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
    medium: vi.fn(),
  },
}));

describe('QuickAddCalorieSheet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onDismiss: vi.fn(),
    initialMealType: 'LUNCH' as const,
    onAdd: vi.fn().mockResolvedValue(true),
  };

  it('render đúng tiêu đề theo bữa khởi tạo và các section nhập liệu', () => {
    render(<QuickAddCalorieSheet {...defaultProps} />);

    expect(screen.getByText('Thêm vào Bữa trưa')).toBeInTheDocument();
    expect(screen.getByText('BỮA ĂN (TỰ ĐỘNG THEO GIỜ)')).toBeInTheDocument();
    expect(screen.getByText('NĂNG LƯỢNG (KCAL)')).toBeInTheDocument();
    expect(screen.getByText('CHỌN NHANH')).toBeInTheDocument();
    expect(screen.getByText('TÊN MÓN ĂN (TÙY CHỌN)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm món' })).toBeInTheDocument();
  });

  it('cho phép chọn bữa ăn khác trong 4 bữa', () => {
    render(<QuickAddCalorieSheet {...defaultProps} />);

    const breakfastBtn = screen.getByRole('button', { name: 'Bữa sáng' });
    fireEvent.click(breakfastBtn);

    expect(screen.getByText('Thêm vào Bữa sáng')).toBeInTheDocument();
  });

  it('chọn nhanh mức calo cập nhật số calo', () => {
    render(<QuickAddCalorieSheet {...defaultProps} />);

    const preset500 = screen.getByRole('button', { name: '+500' });
    fireEvent.click(preset500);

    const input = screen.getByPlaceholderText('350') as HTMLInputElement;
    expect(input.value).toBe('500');
  });

  it('nhập tên món ăn và bấm Thêm món gọi onAdd với dữ liệu hợp lệ', async () => {
    const handleAdd = vi.fn().mockResolvedValue(true);
    const handleDismiss = vi.fn();

    render(
      <QuickAddCalorieSheet
        {...defaultProps}
        onAdd={handleAdd}
        onDismiss={handleDismiss}
      />
    );

    // Đổi tên món
    const nameInput = screen.getByPlaceholderText(/Ví dụ: Bánh mì/i);
    fireEvent.change(nameInput, { target: { value: 'Phở bò tái nạm' } });

    // Chọn mức 500 kcal
    const preset500 = screen.getByRole('button', { name: '+500' });
    fireEvent.click(preset500);

    // Bấm Thêm món
    const submitBtn = screen.getByRole('button', { name: 'Thêm món' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleAdd).toHaveBeenCalledWith(500, 'LUNCH', 'Phở bò tái nạm');
      expect(haptics.medium).toHaveBeenCalledTimes(1);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('không gọi onAdd khi calo bằng 0 hoặc rỗng', async () => {
    const handleAdd = vi.fn();
    render(<QuickAddCalorieSheet {...defaultProps} onAdd={handleAdd} />);

    const input = screen.getByPlaceholderText('350');
    fireEvent.change(input, { target: { value: '0' } });

    const submitBtn = screen.getByRole('button', { name: 'Thêm món' });
    fireEvent.click(submitBtn);

    expect(handleAdd).not.toHaveBeenCalled();
  });
});
