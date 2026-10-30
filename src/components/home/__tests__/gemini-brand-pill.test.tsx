import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GeminiBrandPill } from '../GeminiBrandPill';

describe('GeminiBrandPill Component', () => {
  it('renders Gemini brand label and default static Gemini logo without pulse dot', () => {
    render(<GeminiBrandPill isAnalyzing={false} />);

    expect(screen.getByTestId('gemini-brand-pill')).toBeInTheDocument();
    expect(screen.getByText('Gemini')).toBeInTheDocument();
    expect(screen.queryByTestId('analyzing-indicator')).not.toBeInTheDocument();

    const logo = screen.getByTestId('gemini-brand-logo');
    expect(logo).toBeInTheDocument();
    expect(logo).not.toHaveClass('animate-pulse');
  });

  it('renders analyzing pulse animation on the logo and no pulse dot when isAnalyzing is true', () => {
    render(<GeminiBrandPill isAnalyzing={true} />);

    expect(screen.getByTestId('gemini-brand-pill')).toHaveAttribute(
      'aria-label',
      'Gemini AI đang phân tích'
    );
    // Explicitly verify pulse dot was removed
    expect(screen.queryByTestId('analyzing-indicator')).not.toBeInTheDocument();

    const logo = screen.getByTestId('gemini-brand-logo');
    expect(logo).toHaveClass('animate-pulse');
    expect(logo).toHaveClass('scale-110');
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(<GeminiBrandPill isAnalyzing={true} />);
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
