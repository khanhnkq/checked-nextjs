import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CalorieGoalSettingSheet } from '../CalorieGoalSettingSheet';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
    medium: vi.fn(),
  },
}));

describe('CalorieGoalSettingSheet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onDismiss: vi.fn(),
    onSave: vi.fn().mockResolvedValue(true),
  };

  it('không hiển thị gì khi isOpen=false', () => {
    render(<CalorieGoalSettingSheet {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Mục tiêu năng lượng')).not.toBeInTheDocument();
  });

  it('render đầy đủ tiêu đề và các phần tử khi isOpen=true', () => {
    render(<CalorieGoalSettingSheet {...defaultProps} />);

    expect(screen.getByText('Mục tiêu năng lượng')).toBeInTheDocument();
    expect(
      screen.getByText('MỤC TIÊU NĂNG LƯỢNG (KCAL)')
    ).toBeInTheDocument();
    expect(screen.getByText('GỢI Ý PHỔ BIẾN')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Lưu mục tiêu' })
    ).toBeInTheDocument();
  });

  it('điền giá trị khởi tạo từ currentTarget', () => {
    render(
      <CalorieGoalSettingSheet {...defaultProps} currentTarget={1800} />
    );

    const input = screen.getByPlaceholderText('2000') as HTMLInputElement;
    expect(input.value).toBe('1800');
  });

  it('hiển thị đầy đủ 5 nút gợi ý nhanh (1500, 1800, 2000, 2200, 2500)', () => {
    render(<CalorieGoalSettingSheet {...defaultProps} />);

    expect(screen.getByRole('button', { name: '1500' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1800' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2000' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2200' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2500' })).toBeInTheDocument();
  });

  it('bấm vào nút preset cập nhật giá trị input và kích hoạt rung haptic', () => {
    render(
      <CalorieGoalSettingSheet {...defaultProps} currentTarget={2000} />
    );

    const preset2200 = screen.getByRole('button', { name: '2200' });
    fireEvent.click(preset2200);

    expect(haptics.light).toHaveBeenCalled();
    const input = screen.getByPlaceholderText('2000') as HTMLInputElement;
    expect(input.value).toBe('2200');
    expect(preset2200).toHaveClass('bg-primary');
  });

  it('tự động lọc ký tự chữ và ký tự đặc biệt khi nhập số calo', () => {
    render(<CalorieGoalSettingSheet {...defaultProps} />);

    const input = screen.getByPlaceholderText('2000') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'cal2.200kcal' } });

    expect(input.value).toBe('2200');
  });

  it('không gọi onSave khi input rỗng hoặc <= 0', async () => {
    const handleSave = vi.fn().mockResolvedValue(true);
    render(
      <CalorieGoalSettingSheet
        {...defaultProps}
        currentTarget={0}
        onSave={handleSave}
      />
    );

    const input = screen.getByPlaceholderText('2000');
    fireEvent.change(input, { target: { value: '' } });

    const saveBtn = screen.getByRole('button', { name: 'Lưu mục tiêu' });
    fireEvent.click(saveBtn);

    expect(handleSave).not.toHaveBeenCalled();
  });

  it('gọi onSave và onDismiss khi nhập calo hợp lệ và lưu thành công', async () => {
    const handleSave = vi.fn().mockResolvedValue(true);
    const handleDismiss = vi.fn();

    render(
      <CalorieGoalSettingSheet
        {...defaultProps}
        onSave={handleSave}
        onDismiss={handleDismiss}
      />
    );

    const input = screen.getByPlaceholderText('2000');
    fireEvent.change(input, { target: { value: '2350' } });

    const saveBtn = screen.getByRole('button', { name: 'Lưu mục tiêu' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(2350);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('không gọi onDismiss nếu onSave trả về false (lưu thất bại)', async () => {
    const handleSave = vi.fn().mockResolvedValue(false);
    const handleDismiss = vi.fn();

    render(
      <CalorieGoalSettingSheet
        {...defaultProps}
        currentTarget={2000}
        onSave={handleSave}
        onDismiss={handleDismiss}
      />
    );

    const saveBtn = screen.getByRole('button', { name: 'Lưu mục tiêu' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
      expect(handleDismiss).not.toHaveBeenCalled();
    });
  });

  it('gọi onDismiss khi bấm nút Đóng X', () => {
    const handleDismiss = vi.fn();
    render(
      <CalorieGoalSettingSheet {...defaultProps} onDismiss={handleDismiss} />
    );

    const closeBtn = screen.getByRole('button', { name: 'Đóng' });
    fireEvent.click(closeBtn);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('gọi onDismiss khi bấm vào backdrop', () => {
    const handleDismiss = vi.fn();
    render(
      <CalorieGoalSettingSheet {...defaultProps} onDismiss={handleDismiss} />
    );

    const backdrop = screen.getByTestId('bottom-sheet-backdrop');
    fireEvent.click(backdrop);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('gọi onDismiss khi bấm phím Escape', () => {
    const handleDismiss = vi.fn();
    render(
      <CalorieGoalSettingSheet {...defaultProps} onDismiss={handleDismiss} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
