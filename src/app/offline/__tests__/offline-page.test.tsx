import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OfflinePage from '../page';

describe('OfflinePage Component', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders offline message, AppLogo, and retry button', () => {
    render(<OfflinePage />);

    expect(screen.getByTestId('offline-page')).toBeInTheDocument();
    expect(screen.getByTestId('app-logo')).toBeInTheDocument();
    expect(screen.getByText('Ngoại tuyến')).toBeInTheDocument();
    expect(
      screen.getByText(/Không có kết nối mạng/i)
    ).toBeInTheDocument();

    const retryBtn = screen.getByTestId('offline-retry-btn');
    expect(retryBtn).toBeInTheDocument();
  });

  it('triggers reload when retry button is clicked', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadMock,
      },
    });

    render(<OfflinePage />);
    const retryBtn = screen.getByTestId('offline-retry-btn');
    fireEvent.click(retryBtn);

    expect(reloadMock).toHaveBeenCalled();
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(<OfflinePage />);
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
