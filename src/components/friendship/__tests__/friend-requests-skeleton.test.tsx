import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FriendRequestsSkeleton } from '../FriendRequestsSkeleton';

describe('FriendRequestsSkeleton Component', () => {
  it('renders default skeleton with quota bar and 4 cards', () => {
    render(<FriendRequestsSkeleton />);

    const root = screen.getByTestId('friend-requests-skeleton');
    expect(root).toBeInTheDocument();

    const bones = screen.getAllByRole('status', { name: 'Đang tải dữ liệu' });
    // 3 bones for quota (2 header + 1 track) + 4 cards * 4 bones each (1 avatar + 2 text + 2 buttons = 5 each)
    expect(bones.length).toBe(3 + 4 * 5);
  });

  it('customizes card count', () => {
    render(<FriendRequestsSkeleton cardsCount={2} />);
    const bones = screen.getAllByRole('status', { name: 'Đang tải dữ liệu' });
    expect(bones.length).toBe(3 + 2 * 5);
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<FriendRequestsSkeleton />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
