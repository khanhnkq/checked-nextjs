import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Auth Store
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: { id: 'u1', username: 'testuser', displayName: 'Test User', avatarUrl: '/avatar.jpg' },
      updateUser: vi.fn(),
    }),
}));

// Mock Orval React Query Hooks
const mockRefetchFeed = vi.fn();
vi.mock('@/lib/api/generated/endpoints', () => ({
  useGetCurrentUser: () => ({ data: null, isLoading: false }),
  useGetMyFriends: () => ({ data: [], isLoading: false }),
  useGetFeedPhotos: () => ({ data: { content: [] }, isLoading: false, refetch: mockRefetchFeed }),
}));

// Mock Photo Upload Hook (Phase 5)
const mockUploadPhoto = vi.fn();
vi.mock('@/hooks/usePhotoUpload', () => ({
  usePhotoUpload: () => ({
    isUploading: false,
    uploadPhoto: mockUploadPhoto,
    error: null,
  }),
}));

// Mock WebRTC camera hook
vi.mock('@/hooks/useWebRTCCamera', () => ({
  useWebRTCCamera: () => ({
    videoRef: { current: document.createElement('video') },
    status: 'streaming',
    facingMode: 'environment',
    isFlashOn: false,
    toggleFlash: vi.fn(),
    zoomLevel: '1x',
    toggleZoom: vi.fn(),
    toggleFacingMode: vi.fn(),
    startCamera: vi.fn(),
  }),
}));

// Mock canvas-capture media utilities
vi.mock('@/lib/media/canvas-capture', () => ({
  captureVideoFrame: vi.fn().mockResolvedValue({
    blob: new Blob(['mock-bytes'], { type: 'image/jpeg' }),
    dataUrl: 'data:image/jpeg;base64,capturedmockframe',
    width: 1080,
    height: 1080,
  }),
  cropImageFileToSquare: vi.fn().mockResolvedValue({
    blob: new Blob(['album-bytes'], { type: 'image/jpeg' }),
    dataUrl: 'data:image/jpeg;base64,albummockframe',
    width: 1080,
    height: 1080,
  }),
}));

describe('HomePage Camera Capture & Flow Transition (Phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders camera viewfinder on initial load', () => {
    render(<HomePage />);

    expect(screen.getByRole('button', { name: 'Chụp ảnh khoảnh khắc' })).toBeInTheDocument();
    expect(screen.queryByTestId('image-preview-view')).not.toBeInTheDocument();
  });

  it('switches to ImagePreviewView when capture button is clicked', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const captureButton = screen.getByRole('button', { name: 'Chụp ảnh khoảnh khắc' });
    await user.click(captureButton);

    // After capture, ImagePreviewView should be rendered
    await waitFor(() => {
      expect(screen.getByTestId('image-preview-view')).toBeInTheDocument();
    });

    // Shutter flash exists in DOM and fades out after 120ms
    expect(screen.getByTestId('shutter-flash')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('shutter-flash')).toHaveClass('opacity-0');
    });
  });

  it('returns to camera viewfinder when cancel button in preview is clicked', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    // 1. Capture photo
    const captureButton = screen.getByRole('button', { name: 'Chụp ảnh khoảnh khắc' });
    await user.click(captureButton);

    await waitFor(() => {
      expect(screen.getByTestId('image-preview-view')).toBeInTheDocument();
      expect(screen.getByTestId('shutter-flash')).toHaveClass('opacity-0');
    });

    // 2. Click dismiss button
    const dismissButton = screen.getByRole('button', { name: 'Hủy và chụp lại' });
    await user.click(dismissButton);

    // 3. Should return to camera viewfinder
    await waitFor(() => {
      expect(screen.queryByTestId('image-preview-view')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Chụp ảnh khoảnh khắc' })).toBeInTheDocument();
    });
  });

  it('switches to ImagePreviewView when photo is selected from library file input', async () => {
    render(<HomePage />);

    const input = screen.getByTestId('photo-library-input');
    const fakeFile = new File(['fake-album-image'], 'photo.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('image-preview-view')).toBeInTheDocument();
      expect(screen.getByTestId('shutter-flash')).toHaveClass('opacity-0');
      expect(screen.getByAltText('Khoảnh khắc vừa chụp')).toHaveAttribute(
        'src',
        'data:image/jpeg;base64,albummockframe'
      );
    });
  });

  it('submits captured photo via uploadPhoto, dismisses preview, and refetches feed', async () => {
    const user = userEvent.setup();
    mockUploadPhoto.mockResolvedValueOnce({ id: 'p1', imageUrl: 'https://example.com/p1.jpg' });

    render(<HomePage />);

    // 1. Capture photo
    const captureButton = screen.getByRole('button', { name: 'Chụp ảnh khoảnh khắc' });
    await user.click(captureButton);

    await waitFor(() => {
      expect(screen.getByTestId('image-preview-view')).toBeInTheDocument();
    });

    // 2. Click send button in preview
    const sendButton = screen.getByRole('button', { name: 'Gửi khoảnh khắc' });
    await user.click(sendButton);

    // 3. Verify uploadPhoto was called
    await waitFor(() => {
      expect(mockUploadPhoto).toHaveBeenCalledTimes(1);
    });

    // 4. Verify preview is dismissed, feed is refetched, and camera returns
    await waitFor(() => {
      expect(screen.queryByTestId('image-preview-view')).not.toBeInTheDocument();
      expect(mockRefetchFeed).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'Chụp ảnh khoảnh khắc' })).toBeInTheDocument();
    });
  });

  it('keeps preview open when uploadPhoto fails', async () => {
    const user = userEvent.setup();
    mockUploadPhoto.mockResolvedValueOnce(null);

    render(<HomePage />);

    // 1. Capture photo
    const captureButton = screen.getByRole('button', { name: 'Chụp ảnh khoảnh khắc' });
    await user.click(captureButton);

    await waitFor(() => {
      expect(screen.getByTestId('image-preview-view')).toBeInTheDocument();
    });

    // 2. Click send button in preview
    const sendButton = screen.getByRole('button', { name: 'Gửi khoảnh khắc' });
    await user.click(sendButton);

    // 3. Verify uploadPhoto was called
    await waitFor(() => {
      expect(mockUploadPhoto).toHaveBeenCalledTimes(1);
    });

    // 4. Preview remains open and feed is NOT refetched
    expect(screen.getByTestId('image-preview-view')).toBeInTheDocument();
    expect(mockRefetchFeed).not.toHaveBeenCalled();
  });
});
