import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ReceiptPhotoModal } from '../ReceiptPhotoModal';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
  },
}));

describe('ReceiptPhotoModal Component', () => {
  const sampleUrl = 'https://example.com/receipt-photo.jpg';

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('không render gì (trả về null) khi imageUrl là null hoặc rỗng', () => {
    const { container: nullContainer } = render(
      <ReceiptPhotoModal imageUrl={null} onClose={vi.fn()} />
    );
    expect(nullContainer.firstChild).toBeNull();

    const { container: emptyContainer } = render(
      <ReceiptPhotoModal imageUrl="" onClose={vi.fn()} />
    );
    expect(emptyContainer.firstChild).toBeNull();
  });

  it('render ảnh phóng to và nút đóng khi có imageUrl', () => {
    render(<ReceiptPhotoModal imageUrl={sampleUrl} onClose={vi.fn()} />);

    const img = screen.getByAltText('Ảnh hóa đơn phóng to');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', sampleUrl);

    expect(screen.getByRole('button', { name: 'Đóng xem ảnh' })).toBeInTheDocument();
  });

  it('click nút đóng kích hoạt haptics.light() và gọi onClose', () => {
    const handleClose = vi.fn();
    render(<ReceiptPhotoModal imageUrl={sampleUrl} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: 'Đóng xem ảnh' });
    fireEvent.click(closeBtn);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('click vào vùng nền ngoài ảnh (backdrop) đóng modal', () => {
    const handleClose = vi.fn();
    render(<ReceiptPhotoModal imageUrl={sampleUrl} onClose={handleClose} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('click trực tiếp vào ảnh không đóng modal (stopPropagation)', () => {
    const handleClose = vi.fn();
    render(<ReceiptPhotoModal imageUrl={sampleUrl} onClose={handleClose} />);

    const img = screen.getByAltText('Ảnh hóa đơn phóng to');
    fireEvent.click(img);

    expect(handleClose).not.toHaveBeenCalled();
    expect(haptics.light).not.toHaveBeenCalled();
  });

  it('bấm phím Escape đóng modal', () => {
    const handleClose = vi.fn();
    render(<ReceiptPhotoModal imageUrl={sampleUrl} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(haptics.light).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('khoá cuộn trang và phục hồi overflow khi unmount', () => {
    const { unmount } = render(
      <ReceiptPhotoModal imageUrl={sampleUrl} onClose={vi.fn()} />
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
