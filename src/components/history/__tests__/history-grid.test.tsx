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

    it('renders back button, dropdown pill with default "Tất cả", and calendar button', () => {
      const handleBack = vi.fn();
      const handleCalendar = vi.fn();

      render(
        <HistoryTopBar
          friends={mockFriends}
          selectedFilterId={null}
          onSelectFilter={vi.fn()}
          onBackClick={handleBack}
          onCalendarClick={handleCalendar}
        />
      );

      expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Lọc người gửi khoảnh khắc' })).toHaveTextContent('Tất cả');
      expect(screen.getByRole('button', { name: 'Xem theo lịch' })).toBeInTheDocument();
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
});
