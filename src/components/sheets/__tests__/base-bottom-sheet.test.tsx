import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag } from 'lucide-react';
import { BaseBottomSheet, BottomSheetCard } from '../BaseBottomSheet';

describe('BaseBottomSheet & BottomSheetCard Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <BaseBottomSheet
        isOpen={false}
        onDismiss={vi.fn()}
        title="Test Sheet"
      >
        <p>Test content</p>
      </BaseBottomSheet>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders all elements correctly when isOpen is true', () => {
    render(
      <BaseBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        title="Giá tiền & Chi phí"
        icon={<Tag data-testid="test-icon" size={16} />}
        actionTitle="Xác nhận & Cập nhật"
        onAction={vi.fn()}
      >
        <BottomSheetCard title="SỐ TIỀN">
          <p>50.000 đ</p>
        </BottomSheetCard>
      </BaseBottomSheet>
    );

    expect(screen.getByRole('dialog', { name: 'Giá tiền & Chi phí' })).toBeInTheDocument();
    expect(screen.getByTestId('bottom-sheet-backdrop')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-sheet-grabber')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Giá tiền & Chi phí')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
    expect(screen.getByText('SỐ TIỀN')).toBeInTheDocument();
    expect(screen.getByText('50.000 đ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xác nhận & Cập nhật' })).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <BaseBottomSheet
        isOpen={true}
        onDismiss={handleDismiss}
        title="Test Sheet"
      >
        <div>Content</div>
      </BaseBottomSheet>
    );

    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when backdrop is clicked', async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <BaseBottomSheet
        isOpen={true}
        onDismiss={handleDismiss}
        title="Test Sheet"
      >
        <div>Content</div>
      </BaseBottomSheet>
    );

    await user.click(screen.getByTestId('bottom-sheet-backdrop'));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when Escape key is pressed', async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <BaseBottomSheet
        isOpen={true}
        onDismiss={handleDismiss}
        title="Test Sheet"
      >
        <div>Content</div>
      </BaseBottomSheet>
    );

    await user.keyboard('{Escape}');
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onAction when action button is clicked', async () => {
    const handleAction = vi.fn();
    const user = userEvent.setup();

    render(
      <BaseBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        title="Test Sheet"
        actionTitle="Xác nhận"
        onAction={handleAction}
      >
        <div>Content</div>
      </BaseBottomSheet>
    );

    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to zero border, blur, shadow rule', () => {
    const { container } = render(
      <BaseBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        title="Test Sheet"
        actionTitle="Xác nhận"
        onAction={vi.fn()}
      >
        <BottomSheetCard title="TEST CARD">
          <p>Inner content</p>
        </BottomSheetCard>
      </BaseBottomSheet>
    );

    const html = container.innerHTML;
    // Đảm bảo không chứa bất kỳ class border, blur, shadow nào
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bblur\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
