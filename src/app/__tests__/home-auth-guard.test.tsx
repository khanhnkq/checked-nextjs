import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { useAuthStore } from '@/stores/auth-store';

// 1. Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// 2. Mock Orval React Query Hooks
vi.mock('@/lib/api/generated/endpoints', () => ({
  useGetCurrentUser: () => ({ data: null, isLoading: false }),
  useGetMyFriends: () => ({ data: [], isLoading: false }),
  useGetFeedPhotos: () => ({ data: { content: [] }, isLoading: false, refetch: vi.fn() }),
}));

// 3. Mock Photo Upload Hook
vi.mock('@/hooks/usePhotoUpload', () => ({
  usePhotoUpload: () => ({
    isUploading: false,
    uploadPhoto: vi.fn(),
    error: null,
  }),
}));

// 4. Mock Conversations Hook
vi.mock('@/hooks/useConversations', () => ({
  useConversations: () => ({
    unreadTotal: 0,
    items: [],
    conversations: [],
    isLoading: false,
    isError: false,
    friends: [],
    refetch: vi.fn(),
  }),
}));

// 5. Mock Camera context & WebRTC camera
const mockStartCamera = vi.fn();
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
    stopCamera: vi.fn(),
    toggleFacingMode: vi.fn(),
    toggleFlash: vi.fn(),
    toggleZoom: vi.fn(),
    setZoom: vi.fn(),
    attachVideo: vi.fn(),
  }),
}));

vi.mock('@/hooks/useWebRTCCamera', () => ({
  useWebRTCCamera: () => ({
    videoRef: { current: null },
    status: 'idle',
    facingMode: 'environment',
    isFlashOn: false,
    toggleFlash: vi.fn(),
    zoomLevel: '1x',
    toggleZoom: vi.fn(),
    toggleFacingMode: vi.fn(),
    startCamera: mockStartCamera,
  }),
}));

describe('HomePage Client Route Guard (Defense in Depth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login, displays HomeSkeleton, and never starts camera when hydrated and unauthenticated', () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: true,
      isLoading: false,
    });

    render(<HomePage />);

    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(mockStartCamera).not.toHaveBeenCalled();
    expect(screen.getByRole('status', { name: 'Đang tải giao diện chính' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tin nhắn' })).toBeNull();
  });

  it('displays HomeSkeleton and does not call startCamera or redirect when not yet hydrated', () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,
      isLoading: true,
    });

    render(<HomePage />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockStartCamera).not.toHaveBeenCalled();
    expect(screen.getByRole('status', { name: 'Đang tải giao diện chính' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tin nhắn' })).toBeNull();
  });

  it('renders normal camera viewfinder and starts camera when hydrated and authenticated', () => {
    useAuthStore.setState({
      user: {
        id: 'u-123',
        username: 'vietuser',
        displayName: 'Người Dùng Việt',
        avatarUrl: '/avatar.jpg',
      } as any,
      accessToken: 'valid-token',
      isAuthenticated: true,
      isHydrated: true,
      isLoading: false,
    });

    render(<HomePage />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Tin nhắn' })).toBeInTheDocument();
    expect(mockStartCamera).toHaveBeenCalled();
  });
});
