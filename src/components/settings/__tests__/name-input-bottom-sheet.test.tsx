import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { NameInputBottomSheet } from '../NameInputBottomSheet';
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

describe('NameInputBottomSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <NameInputBottomSheet
        isOpen={false}
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the bottom sheet and inputs when isOpen is true', () => {
    render(
      <NameInputBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tên (First name)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Họ và tên đệm (Last name)')).toBeInTheDocument();
  });

  it('pre-fills currentFirstName and currentLastName if provided', () => {
    render(
      <NameInputBottomSheet
        isOpen={true}
        currentFirstName="Anh"
        currentLastName="Nguyễn Văn"
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const firstNameInput = screen.getByPlaceholderText('Tên (First name)') as HTMLInputElement;
    const lastNameInput = screen.getByPlaceholderText('Họ và tên đệm (Last name)') as HTMLInputElement;

    expect(firstNameInput.value).toBe('Anh');
    expect(lastNameInput.value).toBe('Nguyễn Văn');
  });

  it('enforces maxLength of 50 characters on both inputs', () => {
    render(
      <NameInputBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const firstNameInput = screen.getByPlaceholderText('Tên (First name)');
    const lastNameInput = screen.getByPlaceholderText('Họ và tên đệm (Last name)');

    expect(firstNameInput).toHaveAttribute('maxLength', '50');
    expect(lastNameInput).toHaveAttribute('maxLength', '50');
  });

  it('disables save button when firstName is blank or whitespace only', async () => {
    const user = userEvent.setup();
    render(
      <NameInputBottomSheet
        isOpen={true}
        currentFirstName=""
        currentLastName="Nguyễn"
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const saveButton = screen.getByRole('button', { name: /lưu/i });
    expect(saveButton).toBeDisabled();

    const firstNameInput = screen.getByPlaceholderText('Tên (First name)');
    await user.type(firstNameInput, '   ');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when firstName has non-whitespace characters', async () => {
    const user = userEvent.setup();
    render(
      <NameInputBottomSheet
        isOpen={true}
        currentFirstName=""
        currentLastName=""
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const saveButton = screen.getByRole('button', { name: /lưu/i });
    expect(saveButton).toBeDisabled();

    const firstNameInput = screen.getByPlaceholderText('Tên (First name)');
    await user.type(firstNameInput, 'Minh');

    expect(saveButton).not.toBeDisabled();
  });

  it('calls onSave with trimmed firstName and lastName, triggers haptics, and dismisses on success', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleDismiss = vi.fn();

    render(
      <NameInputBottomSheet
        isOpen={true}
        currentFirstName="  Huy  "
        currentLastName="  Trần Quốc  "
        onDismiss={handleDismiss}
        onSave={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /lưu/i });
    await user.click(saveButton);

    expect(haptics.click).toHaveBeenCalled();
    expect(handleSave).toHaveBeenCalledWith('Huy', 'Trần Quốc');
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
      <NameInputBottomSheet
        isOpen={true}
        currentFirstName="Linh"
        onDismiss={vi.fn()}
        onSave={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /lưu/i });
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
      <NameInputBottomSheet
        isOpen={true}
        onDismiss={handleDismiss}
        onSave={vi.fn()}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Đóng' });
    await user.click(closeButton);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('follows Checked design system tokens: rounded-[18px], p-3.5 on input containers, and no borders/shadows', () => {
    const { container } = render(
      <NameInputBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const inputCards = container.querySelectorAll('.rounded-\\[18px\\]');
    expect(inputCards.length).toBeGreaterThanOrEqual(1);

    inputCards.forEach((card) => {
      expect(card).toHaveClass('p-3.5');
      expect(card.className).not.toMatch(/\bshadow\b/);
      expect(card.className).not.toMatch(/\bborder\b/);
    });
  });
});
