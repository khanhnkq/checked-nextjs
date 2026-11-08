import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PwaUpdateManager } from '../PwaUpdateManager';

describe('PwaUpdateManager', () => {
  const originalLocation = window.location;
  let reloadMock: ReturnType<typeof vi.fn>;
  let mockRegistration: {
    update: ReturnType<typeof vi.fn>;
    waiting: any;
    installing: any;
    active: any;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };
  let swEventListeners: Record<string, Function[]> = {};
  let regEventListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    sessionStorage.clear();
    swEventListeners = {};
    regEventListeners = {};

    reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        reload: reloadMock,
        search: '',
      },
    });

    mockRegistration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      installing: null,
      active: null,
      addEventListener: vi.fn((event: string, callback: Function) => {
        regEventListeners[event] = regEventListeners[event] || [];
        regEventListeners[event].push(callback);
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      writable: true,
      value: {
        register: vi.fn().mockResolvedValue(mockRegistration),
        addEventListener: vi.fn((event: string, callback: Function) => {
          swEventListeners[event] = swEventListeners[event] || [];
          swEventListeners[event].push(callback);
        }),
        removeEventListener: vi.fn(),
        controller: {},
      },
    });

    // Mock global.fetch for /version.json
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes('/version.json')) {
        return {
          ok: true,
          json: async () => ({
            version: 'build-v1',
            builtAt: '2026-11-08T00:00:00Z',
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

  it('registers /sw.js on mount', async () => {
    render(<PwaUpdateManager />);

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  it('calls registration.update() when document visibility changes to visible', async () => {
    render(<PwaUpdateManager />);

    // Wait for registration promise to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Mock visibilityState as visible
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      writable: true,
      value: 'visible',
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('does not call registration.update() when document visibility changes to hidden', async () => {
    render(<PwaUpdateManager />);

    await act(async () => {
      await Promise.resolve();
    });

    mockRegistration.update.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      writable: true,
      value: 'hidden',
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockRegistration.update).not.toHaveBeenCalled();
  });

  it('displays update pill when registration.waiting exists', async () => {
    mockRegistration.waiting = {
      postMessage: vi.fn(),
    };

    render(<PwaUpdateManager />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Đã có phiên bản mới/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cập nhật/i })).toBeInTheDocument();
  });

  it('displays update pill when updatefound event occurs with an installed worker', async () => {
    render(<PwaUpdateManager />);

    await act(async () => {
      await Promise.resolve();
    });

    // Simulate updatefound
    let stateChangeCallback: Function | null = null;
    const mockWorker = {
      state: 'installing',
      addEventListener: vi.fn((event: string, cb: Function) => {
        if (event === 'statechange') {
          stateChangeCallback = cb;
        }
      }),
    };

    mockRegistration.installing = mockWorker;

    act(() => {
      regEventListeners['updatefound']?.forEach((cb) => cb());
    });

    // Change state to installed
    act(() => {
      mockWorker.state = 'installed';
      stateChangeCallback?.();
    });

    expect(screen.getByText(/Đã có phiên bản mới/i)).toBeInTheDocument();
  });

  it('displays update pill when version.json detects a new version', async () => {
    let callCount = 0;
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes('/version.json')) {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            version: callCount === 1 ? 'build-v1' : 'build-v2',
            builtAt: '2026-11-08T00:00:00Z',
          }),
        } as Response;
      }
      return { ok: false } as Response;
    });

    render(<PwaUpdateManager />);

    await act(async () => {
      await Promise.resolve();
    });

    // App resumed, visibility changes to visible
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      writable: true,
      value: 'visible',
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    expect(await screen.findByText(/Đã có phiên bản mới/i)).toBeInTheDocument();
  });

  it('reloads page when "Cập nhật" button is clicked', async () => {
    const user = userEvent.setup();
    mockRegistration.waiting = {
      postMessage: vi.fn(),
    };

    render(<PwaUpdateManager />);

    await act(async () => {
      await Promise.resolve();
    });

    const updateButton = screen.getByRole('button', { name: /Cập nhật/i });
    await user.click(updateButton);

    expect(reloadMock).toHaveBeenCalled();
  });

  it('hides pill when dismiss "✕" button is clicked', async () => {
    const user = userEvent.setup();
    mockRegistration.waiting = {
      postMessage: vi.fn(),
    };

    render(<PwaUpdateManager />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Đã có phiên bản mới/i)).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: /Đóng|✕/i });
    await user.click(dismissButton);

    expect(screen.queryByText(/Đã có phiên bản mới/i)).not.toBeInTheDocument();
  });

  it('reloads page when ChunkLoadError is detected via window error event', async () => {
    render(<PwaUpdateManager />);

    act(() => {
      const errorEvent = new ErrorEvent('error', {
        message: 'ChunkLoadError: Loading chunk 254 failed.',
        error: new Error('ChunkLoadError: Loading chunk 254 failed.'),
      });
      window.dispatchEvent(errorEvent);
    });

    expect(reloadMock).toHaveBeenCalled();
  });

  it('reloads page when "Loading chunk" error is detected via window error event', async () => {
    render(<PwaUpdateManager />);

    act(() => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Loading chunk app/page failed.',
      });
      window.dispatchEvent(errorEvent);
    });

    expect(reloadMock).toHaveBeenCalled();
  });
});
