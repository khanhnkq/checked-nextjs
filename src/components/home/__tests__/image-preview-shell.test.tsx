import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreviewView, type CapturedPhotoData } from '../ImagePreviewView';

describe('ImagePreviewView Shell Component', () => {
  const mockPhoto: CapturedPhotoData = {
    blob: new Blob(['fake-image-bytes'], { type: 'image/jpeg' }),
    dataUrl: 'data:image/jpeg;base64,mockpreviewdata',
    width: 1080,
    height: 1080,
  };

  it('renders captured photo and essential controls', () => {
    render(<ImagePreviewView photo={mockPhoto} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('image-preview-view')).toBeInTheDocument();
    expect(screen.getByAltText('Khoảnh khắc vừa chụp')).toHaveAttribute('src', mockPhoto.dataUrl);
    expect(screen.getByTestId('gemini-brand-pill')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy và chụp lại' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tải ảnh về máy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xóa ảnh và chụp lại' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gửi khoảnh khắc' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn người nhận' })).toBeInTheDocument();
  });

  it('triggers onDismiss when close button is clicked', async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();
    render(<ImagePreviewView photo={mockPhoto} onDismiss={handleDismiss} />);

    const closeBtn = screen.getByRole('button', { name: 'Hủy và chụp lại' });
    await user.click(closeBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('triggers onDismiss when trash button is clicked', async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();
    render(<ImagePreviewView photo={mockPhoto} onDismiss={handleDismiss} />);

    const trashBtn = screen.getByRole('button', { name: 'Xóa ảnh và chụp lại' });
    await user.click(trashBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('triggers onSend when matcha send button is clicked', async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup();
    render(<ImagePreviewView photo={mockPhoto} onDismiss={vi.fn()} onSend={handleSend} />);

    const sendBtn = screen.getByRole('button', { name: 'Gửi khoảnh khắc' });
    await user.click(sendBtn);
    expect(handleSend).toHaveBeenCalledTimes(1);
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(<ImagePreviewView photo={mockPhoto} onDismiss={vi.fn()} />);
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
