import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillDetailSheet, type BillItemData } from '../BillDetailSheet';

describe('BillDetailSheet Component (1:1 iOS Parity)', () => {
  const mockItems: BillItemData[] = [
    { id: '1', name: 'Phở Bò Tái Lăn', quantity: 2, price: 65000 },
    { id: '2', name: 'Quẩy giòn', quantity: 4, price: 10000 },
    { id: '3', name: 'Trà đá', quantity: 1, price: 5000 },
  ];

  it('renders with initial values and extracted items correctly', () => {
    render(
      <BillDetailSheet
        isOpen={true}
        initialMerchantName="Phở Thìn Lò Đúc"
        initialTotalAmount={180000}
        initialCategory="Ăn uống"
        initialItems={mockItems}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Chi tiết Hóa đơn' })).toBeInTheDocument();
    const amountInput = screen.getByRole('textbox', { name: 'Tổng tiền thanh toán' }) as HTMLInputElement;
    expect(amountInput.value).toBe('180000');

    const merchantInput = screen.getByRole('textbox', { name: 'Tên cửa hàng' }) as HTMLInputElement;
    expect(merchantInput.value).toBe('Phở Thìn Lò Đúc');

    // Extracted items card
    expect(screen.getByText('CÁC MÓN ĐÃ BÓC TÁCH (3)')).toBeInTheDocument();
    expect(screen.getByText('Phở Bò Tái Lăn')).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
    expect(screen.getByText('Quẩy giòn')).toBeInTheDocument();
  });

  it('allows user to modify amount, merchant and select category', async () => {
    const user = userEvent.setup();
    render(
      <BillDetailSheet
        isOpen={true}
        initialMerchantName="Quán cafe"
        initialTotalAmount={45000}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const amountInput = screen.getByRole('textbox', { name: 'Tổng tiền thanh toán' }) as HTMLInputElement;
    await user.clear(amountInput);
    await user.type(amountInput, '95000');
    expect(amountInput.value).toBe('95000');

    const merchantInput = screen.getByRole('textbox', { name: 'Tên cửa hàng' }) as HTMLInputElement;
    await user.clear(merchantInput);
    await user.type(merchantInput, 'The Coffee House');
    expect(merchantInput.value).toBe('The Coffee House');

    const coffeeCat = screen.getByRole('button', { name: 'Cafe & Trà' });
    await user.click(coffeeCat);
    expect(coffeeCat.className).toContain('bg-[#D4EB70]');
  });

  it('generates smart suggested caption and calls onConfirm on submit', async () => {
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <BillDetailSheet
        isOpen={true}
        initialMerchantName="Cơm Tấm Ba Ghiền"
        initialTotalAmount={85000}
        initialCategory="Ăn uống"
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantName: 'Cơm Tấm Ba Ghiền',
        totalAmount: 85000,
        category: 'Ăn uống',
        formattedAmount: expect.stringMatching(/85\.000\s*đ/),
        suggestedCaption: expect.stringMatching(/🧾 Cơm Tấm Ba Ghiền · 85\.000\s*đ/),
      })
    );
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to zero border, blur, shadow rule', () => {
    const { container } = render(
      <BillDetailSheet
        isOpen={true}
        initialMerchantName="Highlands Coffee"
        initialTotalAmount={69000}
        initialItems={mockItems}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bblur\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
