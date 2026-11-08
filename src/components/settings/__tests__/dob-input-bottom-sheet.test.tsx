import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DobInputBottomSheet } from '../DobInputBottomSheet';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
    selection: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DobInputBottomSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DobInputBottomSheet
        isOpen={false}
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders date input and elements when isOpen is true', () => {
    render(
      <DobInputBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dob-date-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu ngày sinh' })).toBeInTheDocument();
  });

  it('pre-fills currentDob and displays formatted preview e.g. "15 tháng 08, 2000"', () => {
    render(
      <DobInputBottomSheet
        isOpen={true}
        currentDob="2000-08-15"
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const input = screen.getByTestId('dob-date-input') as HTMLInputElement;
    expect(input.value).toBe('2000-08-15');
    expect(screen.getByText(/15 tháng 08, 2000/i)).toBeInTheDocument();
  });

  it('disables save button when dob is empty or null', () => {
    render(
      <DobInputBottomSheet
        isOpen={true}
        currentDob={null}
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Lưu ngày sinh' });
    expect(saveButton).toBeDisabled();
  });

  it('disables save button and indicates error when selected date is in the future', async () => {
    const user = userEvent.setup();
    render(
      <DobInputBottomSheet
        isOpen={true}
        currentDob="2000-01-01"
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const input = screen.getByTestId('dob-date-input');
    const saveButton = screen.getByRole('button', { name: 'Lưu ngày sinh' });

    // Set future date
    await user.clear(input);
    await user.type(input, '2099-12-31');

    expect(saveButton).toBeDisabled();
  });

  it('enables save button when valid past date is entered', async () => {
    const user = userEvent.setup();
    render(
      <DobInputBottomSheet
        isOpen={true}
        currentDob={null}
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const input = screen.getByTestId('dob-date-input');
    const saveButton = screen.getByRole('button', { name: 'Lưu ngày sinh' });

    expect(saveButton).toBeDisabled();

    await user.type(input, '1998-05-20');
    expect(saveButton).not.toBeDisabled();
    expect(screen.getByText(/20 tháng 05, 1998/i)).toBeInTheDocument();
  });

  it('calls onSave with selected dob, triggers haptics.click, and dismisses on success', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleDismiss = vi.fn();

    render(
      <DobInputBottomSheet
        isOpen={true}
        currentDob="1995-10-12"
        onDismiss={handleDismiss}
        onSave={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Lưu ngày sinh' });
    await user.click(saveButton);

    expect(haptics.click).toHaveBeenCalled();
    expect(handleSave).toHaveBeenCalledWith('1995-10-12');
    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('shows "Đang lưu..." and disables the button while save operation is in progress', async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    const handleSave = vi.fn().mockReturnValue(savePromise);

    render(
      <DobInputBottomSheet
        isOpen={true}
        currentDob="1995-10-12"
        onDismiss={vi.fn()}
        onSave={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Lưu ngày sinh' });
    await user.click(saveButton);

    expect(screen.getByText(/đang lưu/i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    resolveSave();
    await waitFor(() => {
      expect(screen.queryByText(/đang lưu/i)).not.toBeInTheDocument();
    });
  });

  it('calls onDismiss when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();

    render(
      <DobInputBottomSheet
        isOpen={true}
        onDismiss={handleDismiss}
        onSave={vi.fn()}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Đóng' });
    await user.click(closeButton);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('follows Checked design system tokens: rounded-[18px], p-3.5 on container, zero border and zero shadow', () => {
    const { container } = render(
      <DobInputBottomSheet
        isOpen={true}
        currentDob="1995-10-12"
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const cardContainers = container.querySelectorAll('.rounded-\\[18px\\]');
    expect(cardContainers.length).toBeGreaterThanOrEqual(1);

    cardContainers.forEach((card) => {
      expect(card).toHaveClass('p-3.5');
      expect(card.className).not.toMatch(/\bshadow\b/);
      expect(card.className).not.toMatch(/\bborder\b/);
    });
  });
});
