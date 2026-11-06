import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BudgetSettingSheet } from '../BudgetSettingSheet';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
    medium: vi.fn(),
  },
}));

describe('BudgetSettingSheet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onDismiss: vi.fn(),
    onSave: vi.fn().mockResolvedValue(true),
  };

  it('không hiển thị gì khi isOpen=false', () => {
    render(<BudgetSettingSheet {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Ngân sách & Tiết kiệm')).not.toBeInTheDocument();
  });

  it('render đầy đủ giao diện và các thẻ thiết lập khi isOpen=true', () => {
    render(<BudgetSettingSheet {...defaultProps} />);

    expect(screen.getByText('Ngân sách & Tiết kiệm')).toBeInTheDocument();
    expect(screen.getByText('HẠN MỨC CHI TIÊU THÁNG')).toBeInTheDocument();
    expect(screen.getByText(/CẢNH BÁO KHI CHI TIÊU ĐẠT 80%/)).toBeInTheDocument();
    expect(screen.getByText('MỤC TIÊU TIẾT KIỆM (TÙY CHỌN)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu thiết lập' })).toBeInTheDocument();
  });

  it('điền giá trị khởi tạo từ props chính xác', () => {
    render(
      <BudgetSettingSheet
        {...defaultProps}
        currentBudgetLimit={3500000}
        currentAlertPct={75}
        currentSavingsTarget={1000000}
      />
    );

    const budgetInput = screen.getByPlaceholderText('0') as HTMLInputElement;
    expect(budgetInput.value).toBe('3500000');

    expect(screen.getByText('CẢNH BÁO KHI CHI TIÊU ĐẠT 75%')).toBeInTheDocument();

    const goalInput = screen.getByPlaceholderText(
      '0 (Không bắt buộc)'
    ) as HTMLInputElement;
    expect(goalInput.value).toBe('1000000');
  });

  it('thay đổi slider cập nhật tiêu đề cảnh báo chi tiêu', () => {
    render(<BudgetSettingSheet {...defaultProps} currentAlertPct={80} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '90' } });

    expect(screen.getByText('CẢNH BÁO KHI CHI TIÊU ĐẠT 90%')).toBeInTheDocument();
  });

  it('tự động lọc ký tự chữ và ký tự đặc biệt khi nhập số tiền', () => {
    render(<BudgetSettingSheet {...defaultProps} />);

    const budgetInput = screen.getByPlaceholderText('0') as HTMLInputElement;
    fireEvent.change(budgetInput, { target: { value: 'abc3.500.000xyz' } });

    expect(budgetInput.value).toBe('3500000');
  });

  it('không gọi onSave khi hạn mức chi tiêu rỗng hoặc <= 0', async () => {
    const handleSave = vi.fn().mockResolvedValue(true);
    render(
      <BudgetSettingSheet
        {...defaultProps}
        currentBudgetLimit={null}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: 'Lưu thiết lập' });
    fireEvent.click(saveBtn);

    expect(handleSave).not.toHaveBeenCalled();
  });

  it('gọi onSave và onDismiss khi nhập dữ liệu hợp lệ và lưu thành công', async () => {
    const handleSave = vi.fn().mockResolvedValue(true);
    const handleDismiss = vi.fn();

    render(
      <BudgetSettingSheet
        {...defaultProps}
        onSave={handleSave}
        onDismiss={handleDismiss}
      />
    );

    const budgetInput = screen.getByPlaceholderText('0');
    fireEvent.change(budgetInput, { target: { value: '2500000' } });

    const goalInput = screen.getByPlaceholderText('0 (Không bắt buộc)');
    fireEvent.change(goalInput, { target: { value: '500000' } });

    const saveBtn = screen.getByRole('button', { name: 'Lưu thiết lập' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(2500000, 80, 500000);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('không gọi onDismiss nếu onSave trả về false (lưu thất bại)', async () => {
    const handleSave = vi.fn().mockResolvedValue(false);
    const handleDismiss = vi.fn();

    render(
      <BudgetSettingSheet
        {...defaultProps}
        currentBudgetLimit={2000000}
        onSave={handleSave}
        onDismiss={handleDismiss}
      />
    );

    const saveBtn = screen.getByRole('button', { name: 'Lưu thiết lập' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
      expect(handleDismiss).not.toHaveBeenCalled();
    });
  });

  it('gọi onDismiss khi bấm nút Đóng X', () => {
    const handleDismiss = vi.fn();
    render(<BudgetSettingSheet {...defaultProps} onDismiss={handleDismiss} />);

    const closeBtn = screen.getByRole('button', { name: 'Đóng' });
    fireEvent.click(closeBtn);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('gọi onDismiss khi bấm vào backdrop', () => {
    const handleDismiss = vi.fn();
    render(<BudgetSettingSheet {...defaultProps} onDismiss={handleDismiss} />);

    const backdrop = screen.getByTestId('bottom-sheet-backdrop');
    fireEvent.click(backdrop);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('gọi onDismiss khi bấm phím Escape', () => {
    const handleDismiss = vi.fn();
    render(<BudgetSettingSheet {...defaultProps} onDismiss={handleDismiss} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
