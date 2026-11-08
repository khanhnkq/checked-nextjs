import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '../page';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';

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

describe('SettingsPage - App Version & Update Check (TDD)', () => {
  let queryClient: QueryClient;
  const originalLocation = window.location;
  let reloadMock: ReturnType<typeof vi.fn>;
  let mockRegistration: {
    update: ReturnType<typeof vi.fn>;
    waiting: { postMessage: ReturnType<typeof vi.fn> } | null;
  };

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    username: 'testuser',
    displayName: 'Test User',
    firstName: 'User',
    lastName: 'Test',
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

    reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        reload: reloadMock,
      },
    });

    mockRegistration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      writable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    // Default fetch mock returning current version
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes('/version.json')) {
        return {
          ok: true,
          json: async () => ({
            version: 'v1.0.0',
            builtAt: '2026-11-08T00:00:00.000Z',
            gitCommit: 'abc1234',
          }),
        } as Response;
      }
      return { ok: false } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    );

  it('renders app version and update section with check button', async () => {
    renderComponent();

    expect(screen.getByText(/Phiên bản & Cập nhật/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kiểm tra cập nhật/i })).toBeInTheDocument();
    expect(screen.getByText(/Phiên bản hiện tại/i)).toBeInTheDocument();
  });

  it('checks for updates and displays "Bạn đang dùng phiên bản mới nhất" when already up to date', async () => {
    const user = userEvent.setup();
    renderComponent();

    const checkButton = screen.getByRole('button', { name: /Kiểm tra cập nhật/i });
    await user.click(checkButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Bạn đang dùng phiên bản mới nhất|Phiên bản mới nhất/i)
      ).toBeInTheDocument();
    });

    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('checks for updates and displays "Đã có bản cập nhật mới" when a newer version exists', async () => {
    const user = userEvent.setup();

    // First fetch for initial version
    let callCount = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes('/version.json')) {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => ({
              version: 'v1.0.0',
              builtAt: '2026-11-08T00:00:00.000Z',
              gitCommit: 'abc1234',
            }),
          } as Response;
        }
        // Newer version returned on subsequent check
        return {
          ok: true,
          json: async () => ({
            version: 'v1.0.1',
            builtAt: '2026-11-08T12:00:00.000Z',
            gitCommit: 'def5678',
          }),
        } as Response;
      }
      return { ok: false } as Response;
    });

    renderComponent();

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByText(/Phiên bản & Cập nhật/i)).toBeInTheDocument();
    });

    const checkButton = screen.getByRole('button', { name: /Kiểm tra cập nhật/i });
    await user.click(checkButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Đã có bản cập nhật mới|Đã có bản mới/i)
      ).toBeInTheDocument();
    });

    // Clicking "Bấm để cập nhật" reloads the app
    const updateNowButton = screen.getByRole('button', { name: 'Bấm để cập nhật' });
    await user.click(updateNowButton);

    expect(reloadMock).toHaveBeenCalled();
  });

  it('detects update when service worker has a waiting worker', async () => {
    const postMessageMock = vi.fn();
    mockRegistration.waiting = { postMessage: postMessageMock };

    const user = userEvent.setup();
    renderComponent();

    const checkButton = screen.getByRole('button', { name: /Kiểm tra cập nhật/i });
    await user.click(checkButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Đã có bản cập nhật mới|Đã có bản mới/i)
      ).toBeInTheDocument();
    });

    const updateNowButton = screen.getByRole('button', { name: 'Bấm để cập nhật' });
    await user.click(updateNowButton);

    expect(postMessageMock).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reloadMock).toHaveBeenCalled();
  });
});
