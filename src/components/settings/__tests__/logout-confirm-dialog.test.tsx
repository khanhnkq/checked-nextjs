import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LogoutConfirmDialog } from '../LogoutConfirmDialog';
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

describe('LogoutConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <LogoutConfirmDialog
        isOpen={false}
        onDismiss={vi.fn()}
        onConfirmLogout={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders dialog with heading, message, cancel button, and confirm button when isOpen is true', () => {
    render(
      <LogoutConfirmDialog
        isOpen={true}
        onDismiss={vi.fn()}
        onConfirmLogout={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Đăng xuất tài khoản?' })).toBeInTheDocument();
    expect(
      screen.getByText('Bạn có chắc chắn muốn đăng xuất khỏi Checked trên thiết bị này?')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
  });

  it('calls onDismiss and triggers haptics.click when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();

    render(
      <LogoutConfirmDialog
        isOpen={true}
        onDismiss={handleDismiss}
        onConfirmLogout={vi.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    await user.click(cancelButton);

    expect(haptics.click).toHaveBeenCalled();
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirmLogout and triggers haptics.click when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const handleConfirmLogout = vi.fn().mockResolvedValue(undefined);

    render(
      <LogoutConfirmDialog
        isOpen={true}
        onDismiss={vi.fn()}
        onConfirmLogout={handleConfirmLogout}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Đăng xuất' });
    await user.click(confirmButton);

    expect(haptics.click).toHaveBeenCalled();
    expect(handleConfirmLogout).toHaveBeenCalledTimes(1);
  });

  it('displays spinner and "Đang đăng xuất..." when isLoading is true', () => {
    render(
      <LogoutConfirmDialog
        isOpen={true}
        isLoading={true}
        onDismiss={vi.fn()}
        onConfirmLogout={vi.fn()}
      />
    );

    expect(screen.getByText('Đang đăng xuất...')).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /đang đăng xuất/i });
    expect(confirmButton).toBeDisabled();
  });

  it('does not trigger callbacks when clicking buttons while isLoading is true', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();
    const handleConfirmLogout = vi.fn();

    render(
      <LogoutConfirmDialog
        isOpen={true}
        isLoading={true}
        onDismiss={handleDismiss}
        onConfirmLogout={handleConfirmLogout}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    const confirmButton = screen.getByRole('button', { name: /đang đăng xuất/i });

    await user.click(cancelButton);
    await user.click(confirmButton);

    expect(handleDismiss).not.toHaveBeenCalled();
    expect(handleConfirmLogout).not.toHaveBeenCalled();
  });

  it('calls onDismiss when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();

    render(
      <LogoutConfirmDialog
        isOpen={true}
        onDismiss={handleDismiss}
        onConfirmLogout={vi.fn()}
      />
    );

    const backdrop = screen.getByTestId('logout-dialog-backdrop');
    await user.click(backdrop);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when Escape key is pressed', () => {
    const handleDismiss = vi.fn();

    render(
      <LogoutConfirmDialog
        isOpen={true}
        onDismiss={handleDismiss}
        onConfirmLogout={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to Zero Border, Zero Shadow, Zero Blur styling', () => {
    const { container } = render(
      <LogoutConfirmDialog
        isOpen={true}
        onDismiss={vi.fn()}
        onConfirmLogout={vi.fn()}
      />
    );

    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      const cls = el.className;
      if (typeof cls === 'string') {
        expect(cls).not.toMatch(/\bshadow\b/);
        expect(cls).not.toMatch(/\bborder\b/);
        expect(cls).not.toMatch(/\bblur\b/);
        expect(cls).not.toMatch(/\bbackdrop-blur\b/);
      }
    });

    const confirmButton = screen.getByRole('button', { name: 'Đăng xuất' });
    expect(confirmButton).toHaveClass('bg-[#FF5252]');
    expect(confirmButton).toHaveClass('h-[52px]');
    expect(confirmButton).toHaveClass('rounded-full');

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    expect(cancelButton).toHaveClass('bg-[#FFFFFF]');
    expect(cancelButton).toHaveClass('h-[52px]');
    expect(cancelButton).toHaveClass('rounded-full');
  });
});
