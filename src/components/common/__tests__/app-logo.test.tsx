import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLogo } from '../AppLogo';

describe('AppLogo Component', () => {
  it('renders official red cat logo with default dimensions', () => {
    render(<AppLogo />);

    const logoContainer = screen.getByTestId('app-logo');
    expect(logoContainer).toBeInTheDocument();
    expect(logoContainer).toHaveStyle({ width: '80px', height: '80px' });

    const img = screen.getByRole('img', { name: 'Checked Logo' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('icon-192x192.png'));
  });

  it('supports custom size and alt attribute', () => {
    render(<AppLogo size={120} alt="Custom Logo" />);

    const logoContainer = screen.getByTestId('app-logo');
    expect(logoContainer).toHaveStyle({ width: '120px', height: '120px' });

    const img = screen.getByRole('img', { name: 'Custom Logo' });
    expect(img).toBeInTheDocument();
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(<AppLogo />);
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
