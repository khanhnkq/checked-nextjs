import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFriendInvite } from '../useFriendInvite';
import * as friendshipApi from '@/lib/api/friendship-api';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/api/friendship-api', () => ({
  friendshipKeys: {
    all: ['/api/v1/friendships'],
    friends: () => ['/api/v1/friendships', 'friends'],
    inviteCurrent: ['/api/v1/friend-invite-links', 'current'],
    invitePreview: (token: string) => ['/api/v1/friend-invite-links', 'preview', token],
  },
  getCurrentInviteLink: vi.fn(),
  previewInviteToken: vi.fn(),
  createOrRotateInviteLink: vi.fn(),
  revokeInviteLink: vi.fn(),
  acceptInviteToken: vi.fn(),
}));

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    click: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useFriendInvite Hook', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(friendshipApi.getCurrentInviteLink).mockResolvedValue({
      id: 'inv-1',
      inviteUrl: 'https://checked.app/invite?token=mock-token',
      tokenPreview: 'mock-token',
      maxUses: 50,
      usedCount: 3,
      status: 'ACTIVE',
    });

    vi.mocked(friendshipApi.previewInviteToken).mockResolvedValue({
      inviter: { id: 'u-1', username: 'host', displayName: 'Host' },
      status: 'ACTIVE',
    });
  });

  describe('Queries', () => {
    it('currentInviteQuery lấy thông tin link mời hiện tại', async () => {
      const { result } = renderHook(() => useFriendInvite(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.currentInviteQuery.isSuccess).toBe(true));

      expect(friendshipApi.getCurrentInviteLink).toHaveBeenCalled();
      expect(result.current.currentInvite).toEqual({
        id: 'inv-1',
        inviteUrl: 'https://checked.app/invite?token=mock-token',
        tokenPreview: 'mock-token',
        maxUses: 50,
        usedCount: 3,
        status: 'ACTIVE',
      });
    });

    it('previewTokenQuery chỉ chạy khi có token truyền vào', async () => {
      const { result, rerender } = renderHook(
        ({ token }: { token?: string }) => useFriendInvite({ token }),
        {
          wrapper: createWrapper(),
          initialProps: { token: undefined } as { token?: string },
        }
      );

      expect(result.current.previewTokenQuery.fetchStatus).toBe('idle');
      expect(friendshipApi.previewInviteToken).not.toHaveBeenCalled();

      rerender({ token: 'test-token-123' });

      await waitFor(() => expect(result.current.previewTokenQuery.isSuccess).toBe(true));

      expect(friendshipApi.previewInviteToken).toHaveBeenCalled();
    });
  });

  describe('Mutations & Haptics', () => {
    it('rotateInviteLink gọi createOrRotateInviteLink, rung haptics.medium và invalidate current invite link', async () => {
      vi.mocked(friendshipApi.createOrRotateInviteLink).mockResolvedValueOnce({
        id: 'new-inv',
        inviteUrl: 'https://checked.app/invite?token=new',
        status: 'ACTIVE',
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendInvite(), { wrapper: createWrapper() });

      let rotated;
      await act(async () => {
        rotated = await result.current.rotateInviteLink(25, 14);
      });

      expect(friendshipApi.createOrRotateInviteLink).toHaveBeenCalledWith(25, 14);
      expect(haptics.medium).toHaveBeenCalled();
      expect(rotated).toEqual({
        id: 'new-inv',
        inviteUrl: 'https://checked.app/invite?token=new',
        status: 'ACTIVE',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friend-invite-links', 'current'] });
    });

    it('revokeInviteLink gọi revokeInviteLink, rung haptics.light và invalidate current invite link', async () => {
      vi.mocked(friendshipApi.revokeInviteLink).mockResolvedValueOnce(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendInvite(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.revokeInviteLink();
      });

      expect(friendshipApi.revokeInviteLink).toHaveBeenCalled();
      expect(haptics.light).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friend-invite-links', 'current'] });
    });

    it('acceptToken gọi acceptInviteToken, rung haptics.medium và invalidate friends query', async () => {
      vi.mocked(friendshipApi.acceptInviteToken).mockResolvedValueOnce({
        friendshipId: 'joined-fs',
        status: 'ACCEPTED',
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendInvite(), { wrapper: createWrapper() });

      let accepted;
      await act(async () => {
        accepted = await result.current.acceptToken('accepted-token');
      });

      expect(friendshipApi.acceptInviteToken).toHaveBeenCalledWith('accepted-token');
      expect(haptics.medium).toHaveBeenCalled();
      expect(accepted).toEqual({
        friendshipId: 'joined-fs',
        status: 'ACCEPTED',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'friends'] });
    });
  });
});
