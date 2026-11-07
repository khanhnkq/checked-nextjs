import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileQrModal } from '../ProfileQrModal';

describe('ProfileQrModal Component (1:1 iOS Parity)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    username: 'alexnguyen',
    displayName: 'Alex Nguyễn',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    onScanTap: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ProfileQrModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly with title, QR image, avatar center, and actions', () => {
    render(<ProfileQrModal {...defaultProps} />);

    expect(screen.getByRole('dialog', { name: 'Mã QR' })).toBeInTheDocument();
    expect(screen.getByText('Mã QR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quét mã QR' })).toBeInTheDocument();

    const qrImage = screen.getByAltText('Mã QR của alexnguyen');
    expect(qrImage.getAttribute('src')).toMatch(/(qr|data:image)/);

    expect(screen.getByRole('button', { name: 'Lưu ảnh' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chia sẻ' })).toBeInTheDocument();
  });

  it('calls onClose when back button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(<ProfileQrModal {...defaultProps} onClose={handleClose} />);

    await user.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();

    render(<ProfileQrModal {...defaultProps} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onScanTap when scan button is clicked', async () => {
    const handleScan = vi.fn();
    const user = userEvent.setup();

    render(<ProfileQrModal {...defaultProps} onScanTap={handleScan} />);

    await user.click(screen.getByRole('button', { name: 'Quét mã QR' }));
    expect(handleScan).toHaveBeenCalledTimes(1);
  });

  it('renders fallback initial when avatarUrl is missing', () => {
    render(<ProfileQrModal {...defaultProps} avatarUrl={null} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('handles share action via navigator.share', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    });

    const user = userEvent.setup();
    render(<ProfileQrModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Chia sẻ' }));
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Kết bạn với tôi trên Checked',
        url: 'https://checked.app/u/alexnguyen',
      })
    );
  });

  it('falls back to copying link and showing toast when navigator.share is unsupported', async () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<ProfileQrModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Chia sẻ' }));
    expect(clipboardSpy).toHaveBeenCalledWith('https://checked.app/u/alexnguyen');
    expect(await screen.findByText('Đã sao chép liên kết')).toBeInTheDocument();
  });

  it('handles save QR image action', async () => {
    const user = userEvent.setup();
    render(<ProfileQrModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Lưu ảnh' }));
    expect(await screen.findByText('Đã lưu mã QR vào máy')).toBeInTheDocument();
  });
});
