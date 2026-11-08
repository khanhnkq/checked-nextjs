import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraPermissionPrompt } from '../CameraPermissionPrompt';
import { usePermissionStore } from '@/stores/permission-store';

describe('CameraPermissionPrompt Component (Checked Soft-Prompt)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePermissionStore.getState().reset();
  });

  it('renders soft-prompt card when camera status is "idle"', () => {
    render(<CameraPermissionPrompt status="idle" />);

    expect(screen.getByText('Bật Camera để bắt đầu')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Checked cần quyền truy cập camera để bạn chụp ảnh khoảnh khắc và nhận diện dinh dưỡng món ăn.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bật Camera' })).toBeInTheDocument();
  });

  it('renders soft-prompt card when camera status is "unsupported" or permission is "prompt"', () => {
    const { rerender } = render(<CameraPermissionPrompt status="unsupported" />);
    expect(screen.getByText('Bật Camera để bắt đầu')).toBeInTheDocument();

    rerender(<CameraPermissionPrompt permissionStatus="prompt" />);
    expect(screen.getByText('Bật Camera để bắt đầu')).toBeInTheDocument();
  });

  it('calls onEnableCamera and marks hasAskedCamera as true when clicking "Bật Camera"', async () => {
    const user = userEvent.setup();
    const handleEnableCamera = vi.fn();

    expect(usePermissionStore.getState().hasAskedCamera).toBe(false);

    render(<CameraPermissionPrompt onEnableCamera={handleEnableCamera} />);

    const enableBtn = screen.getByRole('button', { name: 'Bật Camera' });
    await user.click(enableBtn);

    expect(handleEnableCamera).toHaveBeenCalledTimes(1);
    expect(usePermissionStore.getState().hasAskedCamera).toBe(true);
  });

  it('renders denied guidance UI when status is "denied"', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(<CameraPermissionPrompt status="denied" onEnableCamera={handleRetry} />);

    expect(
      screen.getByText(
        'Camera đang bị tắt quyền truy cập. Bạn có thể mở lại trong Cài đặt trình duyệt/iPhone để tiếp tục chụp ảnh.'
      )
    ).toBeInTheDocument();

    // Guidance mentions Cài đặt
    expect(screen.getByText(/Cài đặt/)).toBeInTheDocument();

    // Click retry/enable button
    const retryBtn = screen.getByRole('button', { name: 'Cấp quyền' });
    await user.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders denied guidance UI when permissionStatus is "denied"', () => {
    render(<CameraPermissionPrompt permissionStatus="denied" />);

    expect(
      screen.getByText(
        'Camera đang bị tắt quyền truy cập. Bạn có thể mở lại trong Cài đặt trình duyệt/iPhone để tiếp tục chụp ảnh.'
      )
    ).toBeInTheDocument();
  });

  it('strictly adheres to Checked design system: Zero Border, Zero Shadow, Zero Blur, #FAF8F5 card, #D9E872 button', () => {
    const { container } = render(<CameraPermissionPrompt status="idle" />);

    // Zero border, shadow, blur
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);

    // Card background #FAF8F5
    const card = container.querySelector('[data-testid="camera-permission-card"]');
    expect(card).toBeInTheDocument();
    expect(card?.className).toContain('#FAF8F5');

    // Button background #D9E872
    const button = screen.getByRole('button', { name: 'Bật Camera' });
    expect(button.className).toContain('#D9E872');
    expect(button.className).toContain('#2C2825');
  });
});
