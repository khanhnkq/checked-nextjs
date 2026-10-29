import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoDetailView } from '../PhotoDetailView';
import type { HistoryPhotoItem } from '@/app/history/page';

// Mock Orval React Query mutation hooks
const mockUpsertMutateAsync = vi.fn().mockResolvedValue({});
const mockRemoveMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/lib/api/generated/endpoints', () => ({
  useUpsertMyReaction: () => ({
    mutateAsync: mockUpsertMutateAsync,
  }),
  useRemoveMyReaction: () => ({
    mutateAsync: mockRemoveMutateAsync,
  }),
}));

describe('PhotoDetailView (iOS Parity, Vertical Snap, Reactions, Zero Border/Blur/Shadow)', () => {
  const mockPhotos: HistoryPhotoItem[] = [
    {
      id: 'photo-1',
      imageUrl: '/photos/pho.jpg',
      senderName: 'Hoàng Long',
      senderAvatarUrl: '/avatars/long.jpg',
      createdAt: new Date().toISOString(),
      amount: 65000,
      calories: 520,
      note: 'Phở bò tái lăn',
    },
    {
      id: 'photo-2',
      imageUrl: '/photos/coffee.jpg',
      senderName: 'Thu Thảo',
      senderAvatarUrl: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      amount: 35000,
      calories: 180,
      note: 'Cà phê muối',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView in jsdom
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders modal dialog with initial photo and sender information', () => {
    render(
      <PhotoDetailView
        photos={mockPhotos}
        initialPhotoId="photo-1"
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Xem chi tiết khoảnh khắc' })).toBeInTheDocument();
    expect(screen.getAllByText('Hoàng Long').length).toBeGreaterThan(0);
  });

  it('displays transaction badges: dish note, formatted price, and calories', () => {
    render(
      <PhotoDetailView
        photos={mockPhotos}
        initialPhotoId="photo-1"
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('Phở bò tái lăn')).toBeInTheDocument();
    expect(screen.getByText(/65\.000/)).toBeInTheDocument();
    expect(screen.getByText('520 kcal')).toBeInTheDocument();
  });

  it('handles dismissal via back button or close button', async () => {
    const handleDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <PhotoDetailView
        photos={mockPhotos}
        initialPhotoId="photo-1"
        onDismiss={handleDismiss}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Đóng chi tiết' });
    await user.click(closeBtn);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders all 6 reaction emojis and handles reaction click', async () => {
    const user = userEvent.setup();

    render(
      <PhotoDetailView
        photos={mockPhotos}
        initialPhotoId="photo-1"
        onDismiss={vi.fn()}
      />
    );

    // 6 emoji buttons exist (rendered per photo card in snap-scroll)
    const fireButtons = screen.getAllByRole('button', { name: 'Thả cảm xúc Lửa' });
    const heartButtons = screen.getAllByRole('button', { name: 'Thả cảm xúc Tim' });
    const hahaButtons = screen.getAllByRole('button', { name: 'Thả cảm xúc Cười' });
    const wowButtons = screen.getAllByRole('button', { name: 'Thả cảm xúc Ngạc nhiên' });
    const sadButtons = screen.getAllByRole('button', { name: 'Thả cảm xúc Buồn' });
    const clapButtons = screen.getAllByRole('button', { name: 'Thả cảm xúc Vỗ tay' });

    expect(fireButtons.length).toBe(2);
    expect(heartButtons.length).toBe(2);
    expect(hahaButtons.length).toBe(2);
    expect(wowButtons.length).toBe(2);
    expect(sadButtons.length).toBe(2);
    expect(clapButtons.length).toBe(2);

    const fireBtn = fireButtons[0];

    // Click fire reaction
    await user.click(fireBtn);
    expect(mockUpsertMutateAsync).toHaveBeenCalledWith({
      photoId: 'photo-1',
      data: { type: 'FIRE' },
    });
    expect(screen.getByText('Đã thả cảm xúc ✨')).toBeInTheDocument();

    // Click fire reaction again to remove
    await user.click(fireBtn);
    expect(mockRemoveMutateAsync).toHaveBeenCalledWith({
      photoId: 'photo-1',
    });
    expect(screen.getByText('Đã bỏ cảm xúc')).toBeInTheDocument();
  });

  it('prevents reactions on own photos and shows warning toast', async () => {
    const user = userEvent.setup();
    const ownPhotos: HistoryPhotoItem[] = [
      {
        id: 'own-1',
        imageUrl: '/photos/own.jpg',
        senderId: 'user-123',
        senderName: 'Bạn',
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <PhotoDetailView
        photos={ownPhotos}
        initialPhotoId="own-1"
        onDismiss={vi.fn()}
        currentUser={{ id: 'user-123', username: 'quockhanh' }}
      />
    );

    const fireBtn = screen.getByRole('button', { name: 'Thả cảm xúc Lửa' });
    await user.click(fireBtn);

    expect(screen.getByText('Bạn không thể thả cảm xúc vào ảnh của chính mình ✨')).toBeInTheDocument();
    expect(mockUpsertMutateAsync).not.toHaveBeenCalled();
  });

  it('allows typing and sending a message in bottom action bar', async () => {
    const user = userEvent.setup();

    render(
      <PhotoDetailView
        photos={mockPhotos}
        initialPhotoId="photo-1"
        onDismiss={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Gửi tin nhắn...');
    await user.type(input, 'Món này ngon quá!');

    const sendBtn = screen.getByRole('button', { name: 'Gửi phản hồi' });
    await user.click(sendBtn);

    expect(screen.getByText('Đã gửi phản hồi! ✨')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(
      <PhotoDetailView
        photos={mockPhotos}
        initialPhotoId="photo-1"
        onDismiss={vi.fn()}
      />
    );

    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
