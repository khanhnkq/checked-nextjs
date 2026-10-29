import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryGridSkeleton } from '../HistoryGridSkeleton';
import { HistoryEmptyState } from '../HistoryEmptyState';
import { HistoryTopBar } from '../HistoryTopBar';

describe('History Grid Components (iOS Parity, Zero Border, Zero Blur, Zero Shadow)', () => {
  describe('HistoryGridSkeleton', () => {
    it('renders correct number of skeleton tiles and status role', () => {
      const { container } = render(<HistoryGridSkeleton count={9} />);
      expect(screen.getByRole('status', { name: 'Đang tải lịch sử khoảnh khắc' })).toBeInTheDocument();
      const tiles = container.querySelectorAll('.aspect-square');
      expect(tiles.length).toBe(9);
    });

    it('strictly conforms to zero border, blur, shadow rule', () => {
      const { container } = render(<HistoryGridSkeleton />);
      expect(container.innerHTML).not.toMatch(/border/);
      expect(container.innerHTML).not.toMatch(/shadow-/);
      expect(container.innerHTML).not.toMatch(/blur-/);
    });
  });

  describe('HistoryEmptyState', () => {
    it('renders empty message and handles capture click', async () => {
      const handleCapture = vi.fn();
      const user = userEvent.setup();

      render(<HistoryEmptyState onCaptureClick={handleCapture} />);

      expect(screen.getByText('Chưa có khoảnh khắc')).toBeInTheDocument();
      const captureBtn = screen.getByRole('button', { name: 'Chụp ảnh ngay' });
      await user.click(captureBtn);

      expect(handleCapture).toHaveBeenCalled();
    });

    it('strictly conforms to zero border, blur, shadow rule', () => {
      const { container } = render(<HistoryEmptyState onCaptureClick={vi.fn()} />);
      expect(container.innerHTML).not.toMatch(/border/);
      expect(container.innerHTML).not.toMatch(/shadow-/);
      expect(container.innerHTML).not.toMatch(/blur-/);
    });
  });

  describe('HistoryTopBar', () => {
    const mockFriends = [
      { id: 'f1', name: 'Minh Tuấn', avatarUrl: '/avatars/tuan.jpg' },
      { id: 'f2', name: 'Thu Thảo', avatarUrl: null },
    ];

    it('renders back button, dropdown pill with default "Tất cả", and chat button', async () => {
      const handleBack = vi.fn();
      const handleChat = vi.fn();
      const user = userEvent.setup();

      render(
        <HistoryTopBar
          friends={mockFriends}
          selectedFilterId={null}
          onSelectFilter={vi.fn()}
          onBackClick={handleBack}
          onChatClick={handleChat}
          chatBadgeCount={3}
        />
      );

      expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Lọc người gửi khoảnh khắc' })).toHaveTextContent('Tất cả');
      const chatBtn = screen.getByRole('button', { name: 'Tin nhắn' });
      expect(chatBtn).toBeInTheDocument();

      await user.click(chatBtn);
      expect(handleChat).toHaveBeenCalledTimes(1);
    });

    it('displays "Bạn" when selectedFilterId is "me"', () => {
      render(
        <HistoryTopBar
          friends={mockFriends}
          selectedFilterId="me"
          onSelectFilter={vi.fn()}
          onBackClick={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Lọc người gửi khoảnh khắc' })).toHaveTextContent('Bạn');
    });

    it('displays friend name when friend id is selected', () => {
      render(
        <HistoryTopBar
          friends={mockFriends}
          selectedFilterId="f1"
          onSelectFilter={vi.fn()}
          onBackClick={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Lọc người gửi khoảnh khắc' })).toHaveTextContent('Minh Tuấn');
    });

    it('opens dropdown and allows selecting a friend filter', async () => {
      const handleSelect = vi.fn();
      const user = userEvent.setup();

      render(
        <HistoryTopBar
          friends={mockFriends}
          selectedFilterId={null}
          onSelectFilter={handleSelect}
          onBackClick={vi.fn()}
        />
      );

      const pillBtn = screen.getByRole('button', { name: 'Lọc người gửi khoảnh khắc' });
      await user.click(pillBtn);

      // Menu dropdown opens
      expect(screen.getByRole('button', { name: 'Minh Tuấn' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Thu Thảo' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Thu Thảo' }));
      expect(handleSelect).toHaveBeenCalledWith('f2');
    });

    it('strictly conforms to zero border, blur, shadow rule', () => {
      const { container } = render(
        <HistoryTopBar onSelectFilter={vi.fn()} onBackClick={vi.fn()} />
      );
      expect(container.innerHTML).not.toMatch(/border/);
      expect(container.innerHTML).not.toMatch(/shadow-/);
      expect(container.innerHTML).not.toMatch(/blur-/);
    });
  });

  describe('History Photos Merge & Filter Logic (iOS Parity)', () => {
    const mockFeedPhotos = [
      { id: 'p1', senderId: 'f1', senderDisplayName: 'Minh Tuấn', createdAt: '2026-10-29T10:00:00Z', imageUrl: '/1.jpg' },
      { id: 'p2', senderId: 'f2', senderDisplayName: 'Thu Thảo', createdAt: '2026-10-29T09:00:00Z', imageUrl: '/2.jpg' },
    ];

    const mockMyPhotos = [
      { id: 'p3', senderId: 'user-me', senderDisplayName: 'Bạn', createdAt: '2026-10-29T11:00:00Z', imageUrl: '/3.jpg' },
      // Duplicate p1 from feed if user had cached it
      { id: 'p1', senderId: 'f1', senderDisplayName: 'Minh Tuấn', createdAt: '2026-10-29T10:00:00Z', imageUrl: '/1.jpg' },
    ];

    function mergePhotos(feed: any[], my: any[]) {
      const map = new Map<string, any>();
      feed.forEach((p) => map.set(p.id, p));
      my.forEach((p) => map.set(p.id, p));
      return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    it('merges feed and my photos deduplicated on "Tất cả"', () => {
      const merged = mergePhotos(mockFeedPhotos, mockMyPhotos);
      expect(merged.length).toBe(3); // p1, p2, p3
      expect(merged[0].id).toBe('p3'); // newest
      expect(merged[1].id).toBe('p1');
      expect(merged[2].id).toBe('p2');
    });

    it('filters only my photos when filter is "me"', () => {
      const merged = mergePhotos(mockFeedPhotos, mockMyPhotos);
      const myOnly = merged.filter((p) => p.senderId === 'user-me' || p.senderDisplayName === 'Bạn');
      expect(myOnly.length).toBe(1);
      expect(myOnly[0].id).toBe('p3');
    });

    it('filters only friend photos when friend ID is selected', () => {
      const merged = mergePhotos(mockFeedPhotos, mockMyPhotos);
      const friend1Only = merged.filter((p) => p.senderId === 'f1');
      expect(friend1Only.length).toBe(1);
      expect(friend1Only[0].id).toBe('p1');
    });
  });
});
