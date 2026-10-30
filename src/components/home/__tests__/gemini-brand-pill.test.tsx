import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GeminiBrandPill } from '../GeminiBrandPill';

describe('GeminiBrandPill Component', () => {
  it('renders Gemini brand label and default static sparkles icon', () => {
    render(<GeminiBrandPill isAnalyzing={false} />);

    expect(screen.getByTestId('gemini-brand-pill')).toBeInTheDocument();
    expect(screen.getByText('Gemini')).toBeInTheDocument();
    expect(screen.queryByTestId('analyzing-indicator')).not.toBeInTheDocument();

    const sparkles = screen.getByTestId('gemini-sparkles-icon');
    expect(sparkles).toHaveClass('text-[#141613]');
    expect(sparkles).not.toHaveClass('animate-pulse');
  });

  it('renders analyzing pulse animation and indicator when isAnalyzing is true', () => {
    render(<GeminiBrandPill isAnalyzing={true} />);

    expect(screen.getByTestId('gemini-brand-pill')).toHaveAttribute(
      'aria-label',
      'Gemini AI đang phân tích'
    );
    expect(screen.getByTestId('analyzing-indicator')).toBeInTheDocument();

    const sparkles = screen.getByTestId('gemini-sparkles-icon');
    expect(sparkles).toHaveClass('animate-pulse');
    expect(sparkles).toHaveClass('scale-110');
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(<GeminiBrandPill isAnalyzing={true} />);
    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
