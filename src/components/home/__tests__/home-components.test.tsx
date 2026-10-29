import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeTopBar } from '../HomeTopBar';
import { CameraBox } from '../CameraBox';
import { StackedFriendCardsView } from '../StackedFriendCardsView';
import { CaptureButton } from '../CaptureButton';
import { HomeSkeleton } from '../HomeSkeleton';

describe('Home Components (iOS Parity, Zero Border, Zero Blur, Zero Shadow)', () => {
  describe('HomeTopBar', () => {
    it('renders avatar button, dropdown pill and chat button', () => {
      const handleAvatar = vi.fn();
      const handleChat = vi.fn();

      render(
        <HomeTopBar
          currentUserAvatar="/avatar.jpg"
          onAvatarClick={handleAvatar}
          onChatClick={handleChat}
          chatBadgeCount={3}
        />
      );

      expect(screen.getByRole('button', { name: 'Hồ sơ cá nhân' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Lọc bạn bè' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tin nhắn' })).toBeInTheDocument();
    });

    it('toggles friends dropdown menu and handles selection', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      const friends = [
        { id: 'f1', name: 'Hoàng Long', avatarUrl: null },
      ];

      render(
        <HomeTopBar
          onAvatarClick={vi.fn()}
          onChatClick={vi.fn()}
          friends={friends}
          onSelectFriend={handleSelect}
        />
      );

      const pillButton = screen.getByRole('button', { name: 'Lọc bạn bè' });
      await user.click(pillButton);

      // Menu dropdown opens
      expect(screen.getByText('Hoàng Long')).toBeInTheDocument();
      expect(screen.getByText('Thêm bạn')).toBeInTheDocument();

      // Click on friend option
      await user.click(screen.getByText('Hoàng Long'));
      expect(handleSelect).toHaveBeenCalledWith('f1');
    });

    it('strictly conforms to zero border, blur, shadow rule', () => {
      const { container } = render(
        <HomeTopBar onAvatarClick={vi.fn()} onChatClick={vi.fn()} />
      );
      expect(container.innerHTML).not.toMatch(/border/);
      expect(container.innerHTML).not.toMatch(/shadow-/);
      expect(container.innerHTML).not.toMatch(/blur-/);
    });
  });

  describe('CameraBox', () => {
    it('renders simulated viewfinder and toggles zoom 1x <-> 0.5x', async () => {
      const user = userEvent.setup();
      render(<CameraBox />);

      expect(screen.getByText('Ống kính Checked')).toBeInTheDocument();

      const zoomButton = screen.getByRole('button', { name: 'Thu phóng camera' });
      expect(zoomButton).toHaveTextContent('1x');

      await user.click(zoomButton);
      expect(zoomButton).toHaveTextContent('0.5x');

      await user.click(zoomButton);
      expect(zoomButton).toHaveTextContent('1x');
    });

    it('strictly conforms to zero border, blur, shadow rule', () => {
      const { container } = render(<CameraBox />);
      expect(container.innerHTML).not.toMatch(/border/);
      expect(container.innerHTML).not.toMatch(/shadow-/);
      expect(container.innerHTML).not.toMatch(/blur-/);
    });
  });

  describe('StackedFriendCardsView', () => {
    it('renders stacked mini cards container', () => {
      render(<StackedFriendCardsView />);
      expect(
        screen.getByRole('generic', { name: 'Xem ảnh bạn bè xếp chồng' })
      ).toBeInTheDocument();
    });

    it('renders pulse skeleton state when isLoading is true', () => {
      render(<StackedFriendCardsView isLoading />);
      expect(
        screen.getByRole('generic', { name: 'Đang tải ảnh bạn bè xếp chồng' })
      ).toBeInTheDocument();
    });

    it('strictly conforms to zero border, blur, shadow rule', () => {
      const { container } = render(<StackedFriendCardsView />);
      expect(container.innerHTML).not.toMatch(/border/);
      expect(container.innerHTML).not.toMatch(/shadow-/);
      expect(container.innerHTML).not.toMatch(/blur-/);
    });
  });

  describe('HomeSkeleton', () => {
    it('renders full home skeleton layout and status role', () => {
      render(<HomeSkeleton />);
      expect(
        screen.getByRole('status', { name: 'Đang tải giao diện chính' })
      ).toBeInTheDocument();
    });

    it('strictly conforms to zero border, blur, shadow rule', () => {
      const { container } = render(<HomeSkeleton />);
      expect(container.innerHTML).not.toMatch(/border/);
      expect(container.innerHTML).not.toMatch(/shadow-/);
      expect(container.innerHTML).not.toMatch(/blur-/);
    });
  });

  describe('CaptureButton', () => {
    it('renders 3-layer tactile capture button and triggers onCapture', async () => {
      const user = userEvent.setup();
      const handleCapture = vi.fn();
      render(<CaptureButton onCapture={handleCapture} />);

      const button = screen.getByRole('button', { name: 'Chụp ảnh khoảnh khắc' });
      expect(button).toBeInTheDocument();

      await user.click(button);
      expect(handleCapture).toHaveBeenCalledTimes(1);
    });

    it('strictly conforms to zero border, blur, shadow rule', () => {
      const { container } = render(<CaptureButton onCapture={vi.fn()} />);
      expect(container.innerHTML).not.toMatch(/border/);
      expect(container.innerHTML).not.toMatch(/shadow-/);
      expect(container.innerHTML).not.toMatch(/blur-/);
    });
  });
});
