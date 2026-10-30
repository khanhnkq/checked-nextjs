import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShutterFlash } from '../ShutterFlash';

describe('ShutterFlash Component', () => {
  it('renders with opacity-0 when isFlashing is false', () => {
    render(<ShutterFlash isFlashing={false} />);
    const flash = screen.getByTestId('shutter-flash');
    expect(flash).toBeInTheDocument();
    expect(flash).toHaveClass('opacity-0');
    expect(flash).not.toHaveClass('opacity-80');
    expect(flash).toHaveClass('pointer-events-none');
  });

  it('renders with opacity-80 when isFlashing is true', () => {
    render(<ShutterFlash isFlashing={true} />);
    const flash = screen.getByTestId('shutter-flash');
    expect(flash).toBeInTheDocument();
    expect(flash).toHaveClass('opacity-80');
    expect(flash).not.toHaveClass('opacity-0');
  });

  it('triggers onAnimationEnd when transition finishes', () => {
    const handleAnimationEnd = vi.fn();
    render(<ShutterFlash isFlashing={true} onAnimationEnd={handleAnimationEnd} />);
    const flash = screen.getByTestId('shutter-flash');

    fireEvent.transitionEnd(flash);
    expect(handleAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(<ShutterFlash isFlashing={true} />);
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
