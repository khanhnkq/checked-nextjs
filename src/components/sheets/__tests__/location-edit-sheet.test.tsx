import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationEditSheet } from '../LocationEditSheet';

describe('LocationEditSheet Component (1:1 iOS Parity)', () => {
  it('renders with initial location name in input', () => {
    render(
      <LocationEditSheet
        isOpen={true}
        initialLocationName="Phở Thìn Lò Đúc"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Vị trí & Địa điểm' })).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Tên quán hoặc địa điểm' }) as HTMLInputElement;
    expect(input.value).toBe('Phở Thìn Lò Đúc');
  });

  it('allows user to change the location name', async () => {
    const user = userEvent.setup();
    render(
      <LocationEditSheet
        isOpen={true}
        initialLocationName="Hà Nội"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Tên quán hoặc địa điểm' }) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'Cà Phê Trứng Giảng');

    expect(input.value).toBe('Cà Phê Trứng Giảng');
  });

  it('renders GPS suggestion and fills input when clicking Dùng button', async () => {
    const user = userEvent.setup();
    render(
      <LocationEditSheet
        isOpen={true}
        initialLocationName="Quán cũ"
        currentGpsPlace="Phường Bến Nghé, Quận 1"
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('Phường Bến Nghé, Quận 1')).toBeInTheDocument();
    const useGpsBtn = screen.getByRole('button', { name: 'Dùng địa điểm Phường Bến Nghé, Quận 1' });
    await user.click(useGpsBtn);

    const input = screen.getByRole('textbox', { name: 'Tên quán hoặc địa điểm' }) as HTMLInputElement;
    expect(input.value).toBe('Phường Bến Nghé, Quận 1');
  });

  it('triggers onRefreshGps when clicking refresh button', async () => {
    const handleRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <LocationEditSheet
        isOpen={true}
        onRefreshGps={handleRefresh}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const refreshBtn = screen.getByRole('button', { name: 'Cập nhật lại GPS hiện tại' });
    await user.click(refreshBtn);

    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it('confirms and trims input name on save', async () => {
    const handleConfirm = vi.fn();
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <LocationEditSheet
        isOpen={true}
        initialLocationName=""
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Tên quán hoặc địa điểm' }) as HTMLInputElement;
    await user.type(input, '   Bánh Mì Huỳnh Hoa   ');

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith('Bánh Mì Huỳnh Hoa');
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('strictly adheres to zero border, blur, shadow rule', () => {
    const { container } = render(
      <LocationEditSheet
        isOpen={true}
        initialLocationName="Quán Ăn Ngon"
        currentGpsPlace="Quận 3, TP.HCM"
        onRefreshGps={vi.fn()}
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
