import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreviewView, type CapturedPhotoData } from '../ImagePreviewView';

describe('ImagePreviewView Component (1:1 iOS Parity Integration)', () => {
  const mockPhoto: CapturedPhotoData = {
    blob: new Blob(['fake-image-bytes'], { type: 'image/jpeg' }),
    dataUrl: 'data:image/jpeg;base64,mockpreviewdata',
    width: 1080,
    height: 1080,
  };

  it('renders all 4 zones: TopBar, 1:1 Image with tags & caption, Action pills, and Bottom controls', () => {
    render(
      <ImagePreviewView
        photo={mockPhoto}
        onDismiss={vi.fn()}
        initialLocationName="Phở Thìn Lò Đúc"
        initialDishName="Phở Bò Tái Nạm"
        initialPriceText="75.000 đ"
        initialCalorieText="620 kcal"
      />
    );

    // 1. TopBar
    expect(screen.getByRole('button', { name: 'Hủy và chụp lại' })).toBeInTheDocument();
    expect(screen.getByTestId('gemini-brand-pill')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tải ảnh về máy' })).toBeInTheDocument();

    // 2. Khung ảnh 1:1 với Pinned Tags & Caption Bar
    expect(screen.getByAltText('Khoảnh khắc vừa chụp')).toBeInTheDocument();
    expect(screen.getByText('Phở Thìn Lò Đúc')).toBeInTheDocument();
    expect(screen.getByText('Phở Bò Tái Nạm')).toBeInTheDocument();
    expect(screen.getByText('75.000 đ')).toBeInTheDocument();
    expect(screen.getByText('620 kcal')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nhập chú thích khoảnh khắc' })).toBeInTheDocument();

    // 3. Action Pills
    expect(screen.getByTestId('preview-action-pills')).toBeInTheDocument();

    // 4. Bottom Controls
    expect(screen.getByRole('button', { name: 'Xóa ảnh và chụp lại' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gửi khoảnh khắc' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn người nhận' })).toBeInTheDocument();
    expect(screen.getByText('Gửi cho bạn bè')).toBeInTheDocument();
  });

  it('toggles pinned tags when action pills are clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        onDismiss={vi.fn()}
        initialLocationName="Hà Nội"
        initialDishName="Bún Chả"
      />
    );

    expect(screen.getByText('Bún Chả')).toBeInTheDocument();

    // Click 'Ẩn tag món'
    const foodPill = screen.getByRole('button', { name: 'Ẩn tag món' });
    await user.click(foodPill);

    // Food tag should now be unpinned
    expect(screen.queryByText('Bún Chả')).not.toBeInTheDocument();

    // Click 'Ghim tag món' again
    const ghimPill = screen.getByRole('button', { name: 'Ghim tag món' });
    await user.click(ghimPill);

    // Food tag reappears
    expect(screen.getByText('Bún Chả')).toBeInTheDocument();
  });

  it('generates smart AI caption when sparkles button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        onDismiss={vi.fn()}
        initialLocationName="Phở Thìn Lò Đúc"
        initialDishName="Phở Bò"
        initialCalorieText="550 kcal"
      />
    );

    const input = screen.getByRole('textbox', { name: 'Nhập chú thích khoảnh khắc' });
    expect(input).toHaveValue('');

    const sparklesBtn = screen.getByRole('button', { name: 'Gợi ý caption' });
    await user.click(sparklesBtn);

    expect(input).toHaveValue('🍲 Phở Bò · 550 kcal');
  });

  it('submits tagged metadata when send button is clicked', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(
      <ImagePreviewView
        photo={mockPhoto}
        onDismiss={vi.fn()}
        onSend={handleSend}
        initialLocationName="Quán Ăn Ngon"
        initialDishName="Cơm Tấm"
        initialPriceText="65.000 đ"
        initialCalorieText="600 kcal"
      />
    );

    const sendBtn = screen.getByRole('button', { name: 'Gửi khoảnh khắc' });
    await user.click(sendBtn);

    expect(handleSend).toHaveBeenCalledTimes(1);
    expect(handleSend).toHaveBeenCalledWith({
      caption: '',
      locationName: 'Quán Ăn Ngon',
      dishName: 'Cơm Tấm',
      priceText: '65.000 đ',
      calorieText: '600 kcal',
    });
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(
      <ImagePreviewView
        photo={mockPhoto}
        onDismiss={vi.fn()}
        initialLocationName="Quán Ăn Ngon"
      />
    );

    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
