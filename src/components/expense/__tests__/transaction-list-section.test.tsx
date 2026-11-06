import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TransactionListSection } from '../TransactionListSection';
import { haptics } from '@/lib/utils/haptics';
import type { ExpenseTransaction } from '@/types/expense';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('TransactionListSection Component', () => {
  const mockTransactions: ExpenseTransaction[] = [
    {
      id: 'tx-1',
      amount: 150000,
      isIncome: false,
      categoryName: 'Ăn uống',
      note: 'Phở bò tái nạm',
      createdAt: '2026-10-30T12:30:00Z',
      imageUrl: 'https://example.com/receipt-1.jpg',
      thumbnailUrl: 'https://example.com/receipt-1-thumb.jpg',
    },
    {
      id: 'tx-2',
      amount: 5000000,
      isIncome: true,
      categoryName: 'Lương & Thưởng',
      note: 'Thưởng quý 3',
      createdAt: '2026-10-29T08:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render trạng thái rỗng khi danh sách không có giao dịch', () => {
    render(<TransactionListSection transactions={[]} />);

    expect(screen.getByText('Giao dịch')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Chưa có giao dịch')).toBeInTheDocument();
  });

  it('render danh sách giao dịch với đúng tiêu đề, số lượng và ngày giờ', () => {
    render(<TransactionListSection transactions={mockTransactions} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Phở bò tái nạm')).toBeInTheDocument();
    expect(screen.getByText('Thưởng quý 3')).toBeInTheDocument();
  });

  it('render đúng định dạng tiền tệ và màu sắc (chi tiêu màu đen, thu nhập màu xanh lá text-success)', () => {
    render(<TransactionListSection transactions={mockTransactions} />);

    const expenseAmount = screen.getByText('-150.000 đ');
    expect(expenseAmount).toBeInTheDocument();
    expect(expenseAmount.className).toContain('text-text-primary');

    const incomeAmount = screen.getByText('+5.000.000 đ');
    expect(incomeAmount).toBeInTheDocument();
    expect(incomeAmount.className).toContain('text-success');
  });

  it('render ảnh thumbnail khi có ảnh hóa đơn và fallback icon khi không có ảnh', () => {
    render(<TransactionListSection transactions={mockTransactions} />);

    const img = screen.getByAltText('Phở bò tái nạm');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/receipt-1.jpg');
  });

  it('click vào giao dịch có ảnh hóa đơn gọi onSelectReceiptPhoto và haptics.light()', () => {
    const handleSelectPhoto = vi.fn();
    render(
      <TransactionListSection
        transactions={mockTransactions}
        onSelectReceiptPhoto={handleSelectPhoto}
      />
    );

    const photoCard = screen.getByRole('button', {
      name: /Xem ảnh hóa đơn giao dịch Phở bò tái nạm/i,
    });
    fireEvent.click(photoCard);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleSelectPhoto).toHaveBeenCalledWith('https://example.com/receipt-1.jpg');
  });

  it('click vào giao dịch không có ảnh không gọi callback hoặc haptics', () => {
    const handleSelectPhoto = vi.fn();
    render(
      <TransactionListSection
        transactions={mockTransactions}
        onSelectReceiptPhoto={handleSelectPhoto}
      />
    );

    const nonPhotoCard = screen.getByText('Thưởng quý 3').closest('div');
    if (nonPhotoCard) {
      fireEvent.click(nonPhotoCard);
    }

    expect(haptics.light).not.toHaveBeenCalled();
    expect(handleSelectPhoto).not.toHaveBeenCalled();
  });

  it('hiển thị thông báo "Đang tải thêm..." khi isLoadingMore = true', () => {
    render(
      <TransactionListSection
        transactions={mockTransactions}
        isLoadingMore={true}
      />
    );

    expect(screen.getByText('Đang tải thêm...')).toBeInTheDocument();
  });
});
