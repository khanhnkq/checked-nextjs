import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FriendshipListSkeleton } from '../FriendshipListSkeleton';

describe('FriendshipListSkeleton Component', () => {
  it('renders with testid "friendship-list-skeleton"', () => {
    render(<FriendshipListSkeleton />);
    expect(screen.getByTestId('friendship-list-skeleton')).toBeInTheDocument();
  });

  it('renders default 6 chat row skeletons', () => {
    render(<FriendshipListSkeleton />);
    const rows = screen.getAllByTestId('friend-chat-row-skeleton');
    expect(rows).toHaveLength(6);
  });

  it('renders custom row count when rowCount prop is passed', () => {
    render(<FriendshipListSkeleton rowCount={3} />);
    const rows = screen.getAllByTestId('friend-chat-row-skeleton');
    expect(rows).toHaveLength(3);
  });

  it('renders top bar and banner skeletons by default', () => {
    render(<FriendshipListSkeleton />);
    expect(screen.getByTestId('messages-top-bar-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('friend-requests-banner-skeleton')).toBeInTheDocument();
  });

  it('can hide top bar or banner skeletons via props', () => {
    render(<FriendshipListSkeleton showTopBar={false} showBanner={false} />);
    expect(screen.queryByTestId('messages-top-bar-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('friend-requests-banner-skeleton')).not.toBeInTheDocument();
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<FriendshipListSkeleton />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
