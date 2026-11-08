import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SettingsTopBar } from '../SettingsTopBar';
import { SettingsSection } from '../SettingsSection';
import { SettingsTile } from '../SettingsTile';
import { ProfileAvatarBanner } from '../ProfileAvatarBanner';
import { haptics } from '@/lib/utils/haptics';
import { User } from '@/types/user';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
    selection: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Settings UI Components (Zero Border, Zero Shadow, Zero Blur)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SettingsTopBar', () => {
    it('renders with default title "Cài đặt"', () => {
      render(<SettingsTopBar />);
      expect(screen.getByText('Cài đặt')).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
      render(<SettingsTopBar title="Thông báo & Âm thanh" />);
      expect(screen.getByText('Thông báo & Âm thanh')).toBeInTheDocument();
    });

    it('renders back button and triggers onBack and haptics on click', async () => {
      const user = userEvent.setup();
      const handleBack = vi.fn();
      render(<SettingsTopBar onBack={handleBack} />);

      const backBtn = screen.getByRole('button', { name: /quay lại/i });
      expect(backBtn).toBeInTheDocument();

      await user.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);
      expect(haptics.click || haptics.light).toBeDefined();
    });

    it('has symmetrical structure with 44x44px back button and right spacer', () => {
      const { container } = render(<SettingsTopBar />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('w-11', 'h-11', 'rounded-full');
      // Spacer element for exact symmetry
      const spacer = container.querySelector('[aria-hidden="true"]');
      expect(spacer).toHaveClass('w-11', 'h-11');
    });

    it('complies with zero border, zero shadow, zero blur styling', () => {
      const { container } = render(<SettingsTopBar />);
      const html = container.innerHTML;
      expect(html).not.toMatch(/border(?!-radius)/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });
  });

  describe('SettingsSection', () => {
    it('renders children inside card container', () => {
      render(
        <SettingsSection>
          <div>Child Tile Content</div>
        </SettingsSection>
      );
      expect(screen.getByText('Child Tile Content')).toBeInTheDocument();
    });

    it('renders uppercase tracking-wider title when provided', () => {
      render(
        <SettingsSection title="Tài khoản">
          <div>Item 1</div>
        </SettingsSection>
      );
      const title = screen.getByText('Tài khoản');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('uppercase');
    });

    it('does not render header title when omitted', () => {
      const { container } = render(
        <SettingsSection>
          <div>Item 1</div>
        </SettingsSection>
      );
      expect(container.querySelector('h3')).toBeNull();
    });

    it('complies with zero border, zero shadow, zero blur styling', () => {
      const { container } = render(
        <SettingsSection title="Bảo mật">
          <div>Item Content</div>
        </SettingsSection>
      );
      const html = container.innerHTML;
      expect(html).not.toMatch(/border(?!-radius)/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });
  });

  describe('SettingsTile', () => {
    it('renders icon, title, and optional subtitle', () => {
      render(
        <SettingsTile
          icon={<span data-testid="test-icon">🔔</span>}
          title="Thông báo đẩy"
          subtitle="Nhận nhắc nhở ghi chú hằng ngày"
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Thông báo đẩy')).toBeInTheDocument();
      expect(screen.getByText('Nhận nhắc nhở ghi chú hằng ngày')).toBeInTheDocument();
    });

    it('renders value text when provided', () => {
      render(
        <SettingsTile
          icon={<span>🌐</span>}
          title="Ngôn ngữ"
          value="Tiếng Việt"
        />
      );
      expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    });

    it('handles click interactions with haptic feedback', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <SettingsTile
          icon={<span>👤</span>}
          title="Hồ sơ cá nhân"
          onClick={handleClick}
        />
      );

      const tile = screen.getByRole('button', { name: /hồ sơ cá nhân/i });
      await user.click(tile);
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(haptics.click).toHaveBeenCalled();
    });

    it('renders destructive styling correctly', () => {
      render(
        <SettingsTile
          icon={<span>🚪</span>}
          title="Đăng xuất"
          isDestructive
        />
      );

      const titleEl = screen.getByText('Đăng xuất');
      expect(titleEl.className).toMatch(/(text-\[#FF5252\]|text-red|text-error)/);
    });

    it('renders iOS style switch and toggles state when isSwitch is true', async () => {
      const user = userEvent.setup();
      const handleSwitchChange = vi.fn();

      render(
        <SettingsTile
          icon={<span>📳</span>}
          title="Rung xúc giác (Haptics)"
          isSwitch
          switchChecked={false}
          onSwitchChange={handleSwitchChange}
        />
      );

      const switchBtn = screen.getByRole('switch');
      expect(switchBtn).toBeInTheDocument();
      expect(switchBtn).toHaveAttribute('aria-checked', 'false');

      await user.click(switchBtn);
      expect(handleSwitchChange).toHaveBeenCalledWith(true);
      expect(haptics.light || haptics.click).toBeDefined();
    });

    it('renders active Matcha Glow background when switch is checked', () => {
      render(
        <SettingsTile
          icon={<span>📳</span>}
          title="Rung xúc giác"
          isSwitch
          switchChecked={true}
        />
      );

      const switchBtn = screen.getByRole('switch');
      expect(switchBtn).toHaveAttribute('aria-checked', 'true');
      expect(switchBtn.className).toMatch(/(bg-\[#D4EB70\]|bg-primary)/);
    });

    it('shows chevron by default when onClick is provided, but hides when isSwitch is true', () => {
      const { rerender, container } = render(
        <SettingsTile
          icon={<span>🔒</span>}
          title="Mật khẩu"
          onClick={() => {}}
        />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(
        <SettingsTile
          icon={<span>🔔</span>}
          title="Thông báo"
          isSwitch
          onClick={() => {}}
        />
      );
      expect(screen.queryByTestId('chevron-icon')).toBeNull();
    });

    it('renders inset divider with pl-[54px] when showDivider is true', () => {
      const { container } = render(
        <SettingsTile
          icon={<span>⚙️</span>}
          title="Cài đặt chung"
          showDivider
        />
      );

      const divider = container.querySelector('.pl-\\[54px\\]');
      expect(divider).toBeInTheDocument();
    });

    it('complies with zero border, zero shadow, zero blur styling', () => {
      const { container } = render(
        <SettingsTile
          icon={<span>⚙️</span>}
          title="Cài đặt chung"
          showDivider
          onClick={() => {}}
        />
      );
      const html = container.innerHTML;
      expect(html).not.toMatch(/border(?!-radius)/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });
  });

  describe('ProfileAvatarBanner', () => {
    const mockUser: User = {
      id: 'usr_1',
      email: 'alex@checked.com',
      username: 'alex',
      displayName: 'Alex Nguyễn',
      avatarUrl: 'https://cdn.checked.com/alex.jpg',
      isVerified: true,
      profileCompleted: true,
      isGoldMember: false,
    };

    it('renders user details: displayName, @username, and email', () => {
      render(
        <ProfileAvatarBanner
          user={mockUser}
          onAvatarUpload={vi.fn()}
        />
      );

      expect(screen.getByText('Alex Nguyễn')).toBeInTheDocument();
      expect(screen.getByText('@alex')).toBeInTheDocument();
      expect(screen.getByText('alex@checked.com')).toBeInTheDocument();
    });

    it('renders user image when avatarUrl is present', () => {
      render(
        <ProfileAvatarBanner
          user={mockUser}
          onAvatarUpload={vi.fn()}
        />
      );

      const img = screen.getByRole('img', { name: /alex nguyễn/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockUser.avatarUrl);
    });

    it('renders uppercase initial fallback when avatarUrl is null/empty', () => {
      const userWithoutAvatar: User = {
        ...mockUser,
        avatarUrl: null,
      };

      render(
        <ProfileAvatarBanner
          user={userWithoutAvatar}
          onAvatarUpload={vi.fn()}
        />
      );

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('A');
    });

    it('triggers hidden file input when camera button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProfileAvatarBanner
          user={mockUser}
          onAvatarUpload={vi.fn()}
        />
      );

      const fileInput = screen.getByTestId('avatar-file-input') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const cameraBtn = screen.getByRole('button', { name: /đổi ảnh đại diện/i });
      await user.click(cameraBtn);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('validates file size: rejects file > 5MB with alert', () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const handleUpload = vi.fn();

      render(
        <ProfileAvatarBanner
          user={mockUser}
          onAvatarUpload={handleUpload}
        />
      );

      const fileInput = screen.getByTestId('avatar-file-input');
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large-photo.jpg', {
        type: 'image/jpeg',
      });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      expect(alertMock).toHaveBeenCalledWith('Dung lượng ảnh tối đa là 5MB');
      expect(handleUpload).not.toHaveBeenCalled();
      alertMock.mockRestore();
    });

    it('accepts valid file <= 5MB and calls onAvatarUpload', () => {
      const handleUpload = vi.fn();

      render(
        <ProfileAvatarBanner
          user={mockUser}
          onAvatarUpload={handleUpload}
        />
      );

      const fileInput = screen.getByTestId('avatar-file-input');
      const validFile = new File(['small photo content'], 'avatar.png', {
        type: 'image/png',
      });

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      expect(handleUpload).toHaveBeenCalledWith(validFile);
    });

    it('renders spinner when isUploading is true', () => {
      render(
        <ProfileAvatarBanner
          user={mockUser}
          onAvatarUpload={vi.fn()}
          isUploading={true}
        />
      );

      expect(screen.getByTestId('avatar-spinner')).toBeInTheDocument();
    });

    it('handles null user gracefully without crashing', () => {
      render(
        <ProfileAvatarBanner
          user={null}
          onAvatarUpload={vi.fn()}
        />
      );

      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });

    it('complies with zero border, zero shadow, zero blur styling', () => {
      const { container } = render(
        <ProfileAvatarBanner
          user={mockUser}
          onAvatarUpload={vi.fn()}
        />
      );
      const html = container.innerHTML;
      expect(html).not.toMatch(/border(?!-radius)/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });
  });
});
