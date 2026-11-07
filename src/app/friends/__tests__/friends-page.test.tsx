import { describe, it, expect, vi } from 'vitest';
import FriendsRedirectPage from '../page';
import * as navigation from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('FriendsRedirectPage (/friends)', () => {
  it('redirects to /messages', () => {
    FriendsRedirectPage();
    expect(navigation.redirect).toHaveBeenCalledWith('/messages');
  });
});
