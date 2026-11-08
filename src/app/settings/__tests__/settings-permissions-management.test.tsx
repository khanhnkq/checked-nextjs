import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '../page';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { usePermissionStore } from '@/stores/permission-store';

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
vi.mock('@/hooks/useSettingsActions', () => ({
  useSettingsActions: () => ({
    isUpdating: false,
    isUploadingAvatar: false,
    isLoggingOut: false,
    updateName: vi.fn(),
    updateDob: vi.fn(),
    uploadAvatarFile: vi.fn(),
    logoutAccount: vi.fn(),
  }),
  SETTINGS_QUERY_KEY: ['/api/v1/users/me/settings/personal-info'],
  MAX_AVATAR_SIZE_BYTES: 5 * 1024 * 1024,
}));

// 4. Mock useCameraContext
const mockStartCamera = vi.fn().mockResolvedValue(undefined);
const mockStopCamera = vi.fn();
const mockToggleFacingMode = vi.fn().mockResolvedValue(undefined);
const mockToggleFlash = vi.fn().mockResolvedValue(false);
const mockToggleZoom = vi.fn().mockReturnValue('1x');
const mockSetZoom = vi.fn();
const mockAttachVideo = vi.fn();

vi.mock('@/contexts/CameraContext', () => ({
  useCameraContext: () => ({
    videoRef: { current: null },
    stream: null,
    status: 'idle',
    error: null,
    facingMode: 'environment',
    isFlashOn: false,
    isFlashSupported: false,
    zoomLevel: '1x',
    isZoomSupported: false,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    toggleFacingMode: mockToggleFacingMode,
    toggleFlash: mockToggleFlash,
    toggleZoom: mockToggleZoom,
    setZoom: mockSetZoom,
    attachVideo: mockAttachVideo,
  }),
}));

describe('SettingsPage - Permissions Management & iOS Guide (TDD)', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: 'user-789',
    email: 'permission@checked.test',
    username: 'tester',
    displayName: 'Permission Tester',
    firstName: 'Tester',
    lastName: 'Permission',
    avatarUrl: null,
    dob: '2000-01-01',
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

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
      isHydrated: true,
    });

    usePreferencesStore.setState({
      hapticsEnabled: true,
      soundEnabled: true,
      autoSavePhotos: false,
    });

    // Reset permission store to default prompt
    usePermissionStore.setState({
      permissions: {
        camera: 'prompt',
        location: 'prompt',
      },
      hasAsked: {
        camera: false,
        location: false,
      },
      hasAskedCamera: false,
      hasAskedLocation: false,
      cachedLocation: null,
    });

    // Mock geolocation API
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 10.7769,
            longitude: 106.7009,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      writable: true,
      value: mockGeolocation,
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    );

  describe('Section 1: Renders Permissions Section', () => {
    it('renders the "Quyền ứng dụng & Thiết bị" section title', () => {
      renderComponent();
      expect(screen.getByText('Quyền ứng dụng & Thiết bị')).toBeInTheDocument();
    });

    it('renders labels for Camera and Location permissions', () => {
      renderComponent();
      expect(screen.getByText(/Quyền Camera/i)).toBeInTheDocument();
      expect(screen.getByText(/Quyền Vị trí/i)).toBeInTheDocument();
    });
  });

  describe('Section 2: Camera Status & Interactions', () => {
    it('displays "Đã cho phép ✓" in emerald badge when camera is granted', () => {
      usePermissionStore.setState({
        permissions: {
          camera: 'granted',
          location: 'prompt',
        },
      });

      renderComponent();

      const cameraItem = screen.getByTestId('permission-camera-item');
      expect(cameraItem).toBeInTheDocument();
      expect(cameraItem).toHaveTextContent('Đã cho phép ✓');
      const badge = cameraItem.querySelector('[data-testid="permission-status-badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge?.className).toMatch(/text-emerald/);
      expect(cameraItem).not.toHaveTextContent('Chưa cấp quyền');
    });

    it('displays "Chưa cấp quyền" with action button when camera is not granted', () => {
      usePermissionStore.setState({
        permissions: {
          camera: 'prompt',
          location: 'prompt',
        },
      });

      renderComponent();

      const cameraItem = screen.getByTestId('permission-camera-item');
      expect(cameraItem).toBeInTheDocument();
      expect(cameraItem).toHaveTextContent('Chưa cấp quyền');
      const actionBtn = screen.getByRole('button', { name: /Cấp quyền Camera|Bật Camera/i });
      expect(actionBtn).toBeInTheDocument();
    });

    it('triggers startCamera when action button is clicked', async () => {
      const user = userEvent.setup();
      usePermissionStore.setState({
        permissions: {
          camera: 'prompt',
          location: 'prompt',
        },
      });

      renderComponent();

      const actionBtn = screen.getByRole('button', { name: /Cấp quyền Camera|Bật Camera/i });
      await user.click(actionBtn);

      expect(mockStartCamera).toHaveBeenCalledTimes(1);
    });
  });

  describe('Section 3: Location Status & Interactions', () => {
    it('displays "Đã cho phép ✓" in emerald badge when location is granted', () => {
      usePermissionStore.setState({
        permissions: {
          camera: 'prompt',
          location: 'granted',
        },
      });

      renderComponent();

      const locationItem = screen.getByTestId('permission-location-item');
      expect(locationItem).toBeInTheDocument();
      expect(locationItem).toHaveTextContent('Đã cho phép ✓');
      const badge = locationItem.querySelector('[data-testid="permission-status-badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge?.className).toMatch(/text-emerald/);
      expect(locationItem).not.toHaveTextContent('Chưa cấp quyền');
    });

    it('displays "Chưa cấp quyền" with action button when location is not granted', () => {
      usePermissionStore.setState({
        permissions: {
          camera: 'prompt',
          location: 'prompt',
        },
      });

      renderComponent();

      const locationItem = screen.getByTestId('permission-location-item');
      expect(locationItem).toBeInTheDocument();
      expect(locationItem).toHaveTextContent('Chưa cấp quyền');
      const actionBtn = screen.getByRole('button', { name: /Cấp quyền Vị trí|Bật Vị trí/i });
      expect(actionBtn).toBeInTheDocument();
    });

    it('triggers geolocation request and updates permission store when action button is clicked', async () => {
      const user = userEvent.setup();
      usePermissionStore.setState({
        permissions: {
          camera: 'prompt',
          location: 'prompt',
        },
      });

      renderComponent();

      const actionBtn = screen.getByRole('button', { name: /Cấp quyền Vị trí|Bật Vị trí/i });
      await user.click(actionBtn);

      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      await waitFor(() => {
        expect(usePermissionStore.getState().permissions.location).toBe('granted');
      });
    });
  });

  describe('Section 4: iOS Safari Permanent Permission Guide', () => {
    it('renders the iOS Safari permanent permission guide card', () => {
      renderComponent();

      const guideCard = screen.getByTestId('ios-permission-guide');
      expect(guideCard).toBeInTheDocument();
      expect(guideCard).toHaveTextContent(/Safari/i);
      expect(guideCard).toHaveTextContent(/aA/i);
      expect(guideCard).toHaveTextContent(/Cài đặt trang web/i);
      expect(guideCard).toHaveTextContent(/Camera: Cho phép/i);
    });
  });

  describe('Section 5: Strict Checked Design System Compliance', () => {
    it('complies strictly with zero border, zero shadow, zero blur design guidelines', () => {
      const { container } = renderComponent();
      const html = container.innerHTML;

      expect(html).not.toMatch(/border(?!-radius)/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });

    it('uses #FAF8F5 background for cards in permissions section', () => {
      renderComponent();
      const guideCard = screen.getByTestId('ios-permission-guide');
      expect(guideCard.className).toContain('bg-[#FAF8F5]');
    });
  });
});
