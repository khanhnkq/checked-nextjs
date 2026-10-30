import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PriceEditSheet,
  parsePriceToNumber,
  formatVndPrice,
} from '../PriceEditSheet';

describe('PriceEditSheet Component (1:1 iOS Parity)', () => {
  it('parses price strings and formats currency accurately', () => {
    expect(parsePriceToNumber('75.000 đ')).toBe(75000);
    expect(parsePriceToNumber('120000')).toBe(120000);
    expect(parsePriceToNumber(50000)).toBe(50000);
    expect(parsePriceToNumber(null)).toBe(0);
    expect(parsePriceToNumber('')).toBe(0);

    expect(formatVndPrice(75000)).toMatch(/75\.000\s*đ/);
    expect(formatVndPrice(150000)).toMatch(/150\.000\s*đ/);
  });

  it('renders with initial price formatted correctly', () => {
    render(
      <PriceEditSheet
        isOpen={true}
        initialPriceText="75.000 đ"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Giá tiền & Chi phí' })).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Nhập số tiền' }) as HTMLInputElement;
    expect(input.value).toBe('75000');
    expect(screen.getByText('đ')).toBeInTheDocument();
    expect(screen.getByText('75k')).toBeInTheDocument();
  });

  it('allows typing new amounts and filters out non-numeric characters', async () => {
    const user = userEvent.setup();
    render(
      <PriceEditSheet
        isOpen={true}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Nhập số tiền' }) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'abc65000xyz');

    expect(input.value).toBe('65000');
  });

  it('selects quick price preset and highlights it', async () => {
    const user = userEvent.setup();
    render(
      <PriceEditSheet
        isOpen={true}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Nhập số tiền' }) as HTMLInputElement;
    const preset50k = screen.getByRole('button', { name: '50k' });

    await user.click(preset50k);
    expect(input.value).toBe('50000');
    // Button should have Matcha Glow styling class bg-[#D4EB70]
    expect(preset50k.className).toContain('bg-[#D4EB70]');
  });

  it('calls onConfirm with parsed number and formatted text on save', async () => {
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <PriceEditSheet
        isOpen={true}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    const preset100k = screen.getByRole('button', { name: '100k' });
    await user.click(preset100k);

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith(100000, expect.stringMatching(/100\.000\s*đ/));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to zero border, blur, shadow rule', () => {
    const { container } = render(
      <PriceEditSheet
        isOpen={true}
        initialPrice={50000}
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
