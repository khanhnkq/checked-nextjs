import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessagesSkeleton } from '../ChatMessagesSkeleton';

describe('ChatMessagesSkeleton Component', () => {
  it('renders alternating skeleton bubbles with default count of 6', () => {
    render(<ChatMessagesSkeleton />);

    const skeleton = screen.getByTestId('chat-messages-skeleton');
    expect(skeleton).toBeInTheDocument();

    const bubbles = screen.getAllByTestId('chat-skeleton-row');
    expect(bubbles).toHaveLength(6);
  });

  it('renders custom number of skeleton bubbles', () => {
    render(<ChatMessagesSkeleton count={4} />);

    const bubbles = screen.getAllByTestId('chat-skeleton-row');
    expect(bubbles).toHaveLength(4);
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<ChatMessagesSkeleton />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
