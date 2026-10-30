import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodEditSheet, removeEmojis } from '../FoodEditSheet';

describe('FoodEditSheet Component (1:1 iOS Parity)', () => {
  it('correctly cleans emoji from dish name', () => {
    expect(removeEmojis('🍜 Phở Bò Tái')).toBe('Phở Bò Tái');
    expect(removeEmojis('Bún Chả Hà Nội 🔥')).toBe('Bún Chả Hà Nội');
    expect(removeEmojis('Cà Phê Muối ☕✨')).toBe('Cà Phê Muối');
    expect(removeEmojis('Pizza Hải Sản')).toBe('Pizza Hải Sản');
    expect(removeEmojis('')).toBe('');
  });

  it('renders with initial dish name stripped of emojis', () => {
    render(
      <FoodEditSheet
        isOpen={true}
        initialDishName="🍜 Phở Bò Đặc Biệt"
        initialCategory="Món nước & Sợi"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Món ăn & Đồ uống' })).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Tên món ăn' }) as HTMLInputElement;
    expect(input.value).toBe('Phở Bò Đặc Biệt');

    const noodleCat = screen.getByRole('button', { name: 'Món nước & Sợi' });
    expect(noodleCat.className).toContain('bg-[#D4EB70]');
  });

  it('allows user to change dish name and select different category', async () => {
    const user = userEvent.setup();
    render(
      <FoodEditSheet
        isOpen={true}
        initialDishName="Cơm tấm"
        initialCategory="Món ăn"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Tên món ăn' }) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'Bánh mì chảo 🍳');

    const snackCat = screen.getByRole('button', { name: 'Bánh & Ăn vặt' });
    await user.click(snackCat);
    expect(snackCat.className).toContain('bg-[#D4EB70]');
  });

  it('confirms with stripped dish name and selected category', async () => {
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <FoodEditSheet
        isOpen={true}
        initialDishName=""
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Tên món ăn' }) as HTMLInputElement;
    await user.type(input, 'Trà Sữa Oolong Nướng 🧋');

    const drinkCat = screen.getByRole('button', { name: 'Đồ uống & Cafe' });
    await user.click(drinkCat);

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith('Trà Sữa Oolong Nướng', 'Đồ uống & Cafe');
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to zero border, blur, shadow rule', () => {
    const { container } = render(
      <FoodEditSheet
        isOpen={true}
        initialDishName="Gà nướng"
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
