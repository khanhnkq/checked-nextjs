import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '../page';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import * as settingsActionsHook from '@/hooks/useSettingsActions';

// 1. Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

// 2. Mock Haptics
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

// 3. Mock useSettingsActions
const mockUpdateName = vi.fn().mockResolvedValue(undefined);
const mockUpdateDob = vi.fn().mockResolvedValue(undefined);
const mockUploadAvatarFile = vi.fn().mockResolvedValue(undefined);
const mockLogoutAccount = vi.fn().mockResolvedValue(undefined);

let mockSettingsActionsReturn: settingsActionsHook.UseSettingsActionsReturn = {
  isUpdating: false,
  isUploadingAvatar: false,
  isLoggingOut: false,
  updateName: mockUpdateName,
  updateDob: mockUpdateDob,
  uploadAvatarFile: mockUploadAvatarFile,
  logoutAccount: mockLogoutAccount,
};

vi.mock('@/hooks/useSettingsActions', () => ({
  useSettingsActions: () => mockSettingsActionsReturn,
  SETTINGS_QUERY_KEY: ['/api/v1/users/me/settings/personal-info'],
  MAX_AVATAR_SIZE_BYTES: 5 * 1024 * 1024,
}));

describe('SettingsPage (/settings)', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: 'user-456',
    email: 'khanh@vku.udn.vn',
    username: 'khanhnkq',
    displayName: 'Nguyễn Quốc Khánh',
    firstName: 'Khánh',
    lastName: 'Nguyễn Quốc',
    avatarUrl: 'https://example.com/avatar.jpg',
    dob: '2000-08-15',
    isVerified: true,
    profileCompleted: true,
    isGoldMember: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Reset default mock actions
    mockSettingsActionsReturn = {
      isUpdating: false,
      isUploadingAvatar: false,
      isLoggingOut: false,
      updateName: mockUpdateName,
      updateDob: mockUpdateDob,
      uploadAvatarFile: mockUploadAvatarFile,
      logoutAccount: mockLogoutAccount,
    };

    // Reset preferences store
    usePreferencesStore.setState({
      hapticsEnabled: true,
      soundEnabled: true,
      autoSavePhotos: false,
    });

    // Reset auth store
    useAuthStore.setState({
      user: mockUser,
      accessToken: 'valid-token',
      isAuthenticated: true,
      isLoading: false,
      isHydrated: true,
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    );

  describe('Route Guard & Navigation', () => {
    it('redirects to /login?redirect=/settings when isHydrated is true and isAuthenticated is false', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });

      renderComponent();

      expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/settings');
    });

    it('does not redirect if isHydrated is false', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isHydrated: false,
      });

      renderComponent();

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('navigates back via router.back() when history length > 1, or fallback to /profile', async () => {
      const user = userEvent.setup();
      renderComponent();

      const backBtn = screen.getByRole('button', { name: /quay lại/i });
      expect(backBtn).toBeInTheDocument();

      await user.click(backBtn);
      // In jsdom environment, window.history.length can be >= 1
      expect(mockBack.mock.calls.length + mockPush.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('ProfileAvatarBanner', () => {
    it('renders user details and avatar banner', () => {
      renderComponent();

      expect(screen.getAllByText('Nguyễn Quốc Khánh').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('@khanhnkq')).toBeInTheDocument();
    });

    it('allows uploading avatar and delegates to uploadAvatarFile', async () => {
      const user = userEvent.setup();
      renderComponent();

      const cameraBtn = screen.getByRole('button', { name: /đổi ảnh đại diện/i });
      expect(cameraBtn).toBeInTheDocument();

      const file = new File(['avatar content'], 'avatar.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      await user.upload(fileInput, file);
      expect(mockUploadAvatarFile).toHaveBeenCalledWith(file);
    });

    it('reflects isUploadingAvatar state with spinner', () => {
      mockSettingsActionsReturn = {
        ...mockSettingsActionsReturn,
        isUploadingAvatar: true,
      };

      renderComponent();
      expect(screen.getByTestId('avatar-spinner')).toBeInTheDocument();
    });
  });

  describe('Section 1: TÀI KHOẢN', () => {
    it('displays user name and opens NameInputBottomSheet on click', async () => {
      const user = userEvent.setup();
      renderComponent();

      expect(screen.getByText('Sửa tên')).toBeInTheDocument();
      const editNameTile = screen.getByRole('button', { name: /sửa tên/i });
      await user.click(editNameTile);

      expect(screen.getByText('Chỉnh sửa họ & tên')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Khánh')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Nguyễn Quốc')).toBeInTheDocument();
    });

    it('submits updated name via updateName', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('button', { name: /sửa tên/i }));

      const firstNameInput = screen.getByDisplayValue('Khánh');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Minh');

      const saveBtn = screen.getByRole('button', { name: /lưu thay đổi/i });
      await user.click(saveBtn);

      expect(mockUpdateName).toHaveBeenCalledWith('Minh', 'Nguyễn Quốc');
    });

    it('displays formatted DOB preview and opens DobInputBottomSheet on click', async () => {
      const user = userEvent.setup();
      renderComponent();

      expect(screen.getByText('Sửa ngày sinh')).toBeInTheDocument();
      expect(screen.getByText('15 tháng 08, 2000')).toBeInTheDocument();

      const editDobTile = screen.getByRole('button', { name: /sửa ngày sinh/i });
      await user.click(editDobTile);

      expect(screen.getByText('Ngày sinh')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2000-08-15')).toBeInTheDocument();
    });

    it('displays "Chưa thiết lập" when user has no DOB', () => {
      useAuthStore.setState({
        user: { ...mockUser, dob: null },
      });

      renderComponent();
      expect(screen.getByText('Chưa thiết lập')).toBeInTheDocument();
    });

    it('submits updated DOB via updateDob', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('button', { name: /sửa ngày sinh/i }));

      const dobInput = screen.getByDisplayValue('2000-08-15');
      await user.clear(dobInput);
      await user.type(dobInput, '1999-12-31');

      const saveBtn = screen.getByRole('button', { name: /lưu ngày sinh/i });
      await user.click(saveBtn);

      expect(mockUpdateDob).toHaveBeenCalledWith('1999-12-31');
    });

    it('displays email as non-clickable tile with Lock icon', () => {
      renderComponent();

      expect(screen.getByText('Địa chỉ email')).toBeInTheDocument();
      expect(screen.getAllByText('khanh@vku.udn.vn').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();

      // Ensure it is not wrapped in a clickable button
      expect(screen.queryByRole('button', { name: /địa chỉ email/i })).toBeNull();
    });

    it('navigates to /invite when clicking "Mời bạn bè"', async () => {
      const user = userEvent.setup();
      renderComponent();

      const inviteBtn = screen.getByRole('button', { name: /mời bạn bè/i });
      await user.click(inviteBtn);

      expect(mockPush).toHaveBeenCalledWith('/invite');
    });

    it('navigates to /messages when clicking "Danh sách bạn bè"', async () => {
      const user = userEvent.setup();
      renderComponent();

      const friendsBtn = screen.getByRole('button', { name: /danh sách bạn bè/i });
      await user.click(friendsBtn);

      expect(mockPush).toHaveBeenCalledWith('/messages');
    });
  });

  describe('Section 2: RIÊNG TƯ & BẢO MẬT', () => {
    it('navigates to /settings/blocked when clicking "Tài khoản đã bị chặn"', async () => {
      const user = userEvent.setup();
      renderComponent();

      const blockedBtn = screen.getByRole('button', { name: /tài khoản đã bị chặn/i });
      await user.click(blockedBtn);

      expect(mockPush).toHaveBeenCalledWith('/settings/blocked');
    });
  });

  describe('Section 3: TÙY CHỌN ỨNG DỤNG', () => {
    it('toggles haptics preference switch', async () => {
      const user = userEvent.setup();
      renderComponent();

      const hapticsSwitch = screen.getByRole('switch', { name: /rung xúc giác/i });
      expect(hapticsSwitch).toHaveAttribute('aria-checked', 'true');

      await user.click(hapticsSwitch);
      expect(usePreferencesStore.getState().hapticsEnabled).toBe(false);
    });

    it('toggles sound preference switch', async () => {
      const user = userEvent.setup();
      renderComponent();

      const soundSwitch = screen.getByRole('switch', { name: /âm thanh hiệu ứng/i });
      expect(soundSwitch).toHaveAttribute('aria-checked', 'true');

      await user.click(soundSwitch);
      expect(usePreferencesStore.getState().soundEnabled).toBe(false);
    });

    it('toggles auto save photos preference switch', async () => {
      const user = userEvent.setup();
      renderComponent();

      const autoSaveSwitch = screen.getByRole('switch', { name: /tự động lưu ảnh chụp/i });
      expect(autoSaveSwitch).toHaveAttribute('aria-checked', 'false');

      await user.click(autoSaveSwitch);
      expect(usePreferencesStore.getState().autoSavePhotos).toBe(true);
    });
  });

  describe('Section 4: Hệ thống & Đăng xuất', () => {
    it('renders system version text "Phiên bản 1.0.0 (Web)"', () => {
      renderComponent();

      expect(screen.getByText('Phiên bản 1.0.0 (Web)')).toBeInTheDocument();
    });

    it('opens LogoutConfirmDialog when clicking "Đăng xuất" button', async () => {
      const user = userEvent.setup();
      renderComponent();

      const logoutBtn = screen.getByRole('button', { name: 'Đăng xuất' });
      expect(logoutBtn).toBeInTheDocument();
      expect(logoutBtn.className).toMatch(/(text-\[#FF5252\]|text-red)/);

      await user.click(logoutBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Đăng xuất tài khoản?')).toBeInTheDocument();
      expect(screen.getByText(/Bạn có chắc chắn muốn đăng xuất/i)).toBeInTheDocument();
    });

    it('dismisses logout dialog when clicking Hủy', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /hủy/i });
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
      expect(mockLogoutAccount).not.toHaveBeenCalled();
    });

    it('calls logoutAccount when confirming logout dialog', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));

      // Confirm button in dialog is also "Đăng xuất" (inside the dialog)
      const confirmLogoutBtn = screen.getAllByRole('button', { name: 'Đăng xuất' }).pop();
      expect(confirmLogoutBtn).toBeDefined();

      if (confirmLogoutBtn) {
        await user.click(confirmLogoutBtn);
        expect(mockLogoutAccount).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Zero Border, Zero Shadow, Zero Blur compliance', () => {
    it('complies strictly with zero border, zero shadow, zero blur design guidelines', () => {
      const { container } = renderComponent();
      const html = container.innerHTML;

      expect(html).not.toMatch(/border(?!-radius)/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });

    it('uses max-w-md mx-auto container layout', () => {
      const { container } = renderComponent();
      const outerContainer = container.querySelector('.max-w-md');
      expect(outerContainer).toBeInTheDocument();
      expect(outerContainer).toHaveClass('mx-auto', 'min-h-screen', 'flex', 'flex-col');
    });
  });
});
