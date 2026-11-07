import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartnerTypingBubble } from '../PartnerTypingBubble';

describe('PartnerTypingBubble Component', () => {
  it('renders left-aligned bubble with 3 animated bouncing dots', () => {
    render(<PartnerTypingBubble />);

    const container = screen.getByTestId('partner-typing-bubble');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('justify-start');

    const dots = screen.getAllByTestId('typing-dot');
    expect(dots).toHaveLength(3);
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<PartnerTypingBubble />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
