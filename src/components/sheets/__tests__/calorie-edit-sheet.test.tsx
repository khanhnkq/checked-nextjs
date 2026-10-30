import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CalorieEditSheet,
  parseCalorieToNumber,
  formatCalorieText,
} from '../CalorieEditSheet';

describe('CalorieEditSheet Component (1:1 iOS Parity)', () => {
  it('parses calorie strings and formats text accurately', () => {
    expect(parseCalorieToNumber('620 kcal · 30g Đạm')).toBe(620);
    expect(parseCalorieToNumber('450 kcal')).toBe(450);
    expect(parseCalorieToNumber(800)).toBe(800);
    expect(parseCalorieToNumber(null)).toBe(0);
    expect(parseCalorieToNumber('')).toBe(0);

    expect(formatCalorieText(620)).toBe('620 kcal');
  });

  it('renders with initial calories formatted properly', () => {
    render(
      <CalorieEditSheet
        isOpen={true}
        initialCalorieText="620 kcal · 30g Đạm"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Lượng Calo ước tính' })).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Nhập lượng calo' }) as HTMLInputElement;
    expect(input.value).toBe('620');
    expect(screen.getByText('kcal')).toBeInTheDocument();
  });

  it('allows typing new calorie amounts and filters non-numeric characters', async () => {
    const user = userEvent.setup();
    render(
      <CalorieEditSheet
        isOpen={true}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Nhập lượng calo' }) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'cal750kcal');

    expect(input.value).toBe('750');
  });

  it('selects quick calorie preset and highlights it', async () => {
    const user = userEvent.setup();
    render(
      <CalorieEditSheet
        isOpen={true}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Nhập lượng calo' }) as HTMLInputElement;
    const preset550 = screen.getByRole('button', { name: '~550 kcal' });

    await user.click(preset550);
    expect(input.value).toBe('550');
    expect(preset550.className).toContain('bg-[#D4EB70]');
  });

  it('calls onConfirm with parsed number and formatted text on save', async () => {
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <CalorieEditSheet
        isOpen={true}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    const preset700 = screen.getByRole('button', { name: '~700 kcal' });
    await user.click(preset700);

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith(700, '700 kcal');
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to zero border, blur, shadow rule', () => {
    const { container } = render(
      <CalorieEditSheet
        isOpen={true}
        initialCalories={500}
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
