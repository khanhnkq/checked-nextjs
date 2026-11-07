import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFriendships } from '../useFriendships';
import * as friendshipApi from '@/lib/api/friendship-api';
import { haptics } from '@/lib/utils/haptics';

vi.mock('@/lib/api/friendship-api', () => ({
  friendshipKeys: {
    all: ['/api/v1/friendships'],
    friends: () => ['/api/v1/friendships', 'friends'],
    received: () => ['/api/v1/friendships', 'requests', 'received'],
    receivedCount: () => ['/api/v1/friendships', 'requests', 'count'],
    sent: () => ['/api/v1/friendships', 'requests', 'sent'],
    sentCount: () => ['/api/v1/friendships', 'requests', 'sent', 'count'],
    mutual: (id: string) => ['/api/v1/friendships', id, 'mutual'],
    inviteCurrent: ['/api/v1/friend-invite-links', 'current'],
    invitePreview: (token: string) => ['/api/v1/friend-invite-links', 'preview', token],
    userProfile: (username: string) => ['/api/v1/users', 'profile', username],
  },
  getMyFriends: vi.fn(),
  getPendingReceivedRequests: vi.fn(),
  getPendingReceivedCount: vi.fn(),
  getPendingSentRequests: vi.fn(),
  getPendingSentCount: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  cancelFriendRequest: vi.fn(),
  unfriend: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  acceptAllRequests: vi.fn(),
  declineAllRequests: vi.fn(),
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

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: {
        id: 'current-user-id',
        username: 'tester',
        displayName: 'Tester',
        isGoldMember: false,
      },
    };
    return selector ? selector(state) : state;
  }),
}));

describe('useFriendships Hook', () => {
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

    vi.mocked(friendshipApi.getMyFriends).mockResolvedValue([
      { id: 'f-1', username: 'friend1', displayName: 'Friend One' },
    ]);
    vi.mocked(friendshipApi.getPendingReceivedRequests).mockResolvedValue([
      {
        friendshipId: 'req-1',
        requester: { id: 'u-1', username: 'requester1', displayName: 'Req One' },
        createdAt: '2026-11-06T00:00:00Z',
      },
    ]);
    vi.mocked(friendshipApi.getPendingReceivedCount).mockResolvedValue({ pendingCount: 1 });
    vi.mocked(friendshipApi.getPendingSentRequests).mockResolvedValue([
      {
        friendshipId: 'sent-1',
        targetUser: { id: 'u-2', username: 'target1', displayName: 'Target One' },
        createdAt: '2026-11-06T00:00:00Z',
      },
    ]);
    vi.mocked(friendshipApi.getPendingSentCount).mockResolvedValue({ sentCount: 1 });
  });

  describe('Quota Calculation', () => {
    it('tính đúng hạn mức tài khoản Free (maxLimit=20, isNearLimit khi >=15, isAtLimit khi >=20)', async () => {
      vi.mocked(friendshipApi.getMyFriends).mockResolvedValue(
        Array(5).fill(null).map((_, i) => ({ id: `f-${i}`, username: `f${i}`, displayName: `Friend ${i}` }))
      );

      const { result } = renderHook(() => useFriendships({ isGold: false }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.friendsQuery.isSuccess).toBe(true));

      expect(result.current.quota).toEqual({
        currentCount: 5,
        maxLimit: 20,
        isGoldMember: false,
        isNearLimit: false,
        isAtLimit: false,
        progress: 0.25,
      });
    });

    it('bật cờ isNearLimit khi tài khoản Free có >= 15 bạn bè', async () => {
      vi.mocked(friendshipApi.getMyFriends).mockResolvedValue(
        Array(15).fill(null).map((_, i) => ({ id: `f-${i}`, username: `f${i}`, displayName: `Friend ${i}` }))
      );

      const { result } = renderHook(() => useFriendships({ isGold: false }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.friendsQuery.isSuccess).toBe(true));

      expect(result.current.quota.isNearLimit).toBe(true);
      expect(result.current.quota.isAtLimit).toBe(false);
      expect(result.current.quota.progress).toBe(0.75);
    });

    it('bật cờ isAtLimit khi tài khoản Free chạm 20 bạn bè', async () => {
      vi.mocked(friendshipApi.getMyFriends).mockResolvedValue(
        Array(20).fill(null).map((_, i) => ({ id: `f-${i}`, username: `f${i}`, displayName: `Friend ${i}` }))
      );

      const { result } = renderHook(() => useFriendships({ isGold: false }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.friendsQuery.isSuccess).toBe(true));

      expect(result.current.quota.isNearLimit).toBe(true);
      expect(result.current.quota.isAtLimit).toBe(true);
      expect(result.current.quota.progress).toBe(1);
    });

    it('tính đúng hạn mức tài khoản Gold Member (maxLimit=100, không bị cảnh báo nearLimit ở mức 15)', async () => {
      vi.mocked(friendshipApi.getMyFriends).mockResolvedValue(
        Array(15).fill(null).map((_, i) => ({ id: `f-${i}`, username: `f${i}`, displayName: `Friend ${i}` }))
      );

      const { result } = renderHook(() => useFriendships({ isGold: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.friendsQuery.isSuccess).toBe(true));

      expect(result.current.quota).toEqual({
        currentCount: 15,
        maxLimit: 100,
        isGoldMember: true,
        isNearLimit: false,
        isAtLimit: false,
        progress: 0.15,
      });
    });
  });

  describe('Mutations & Haptics', () => {
    it('sendRequest gọi sendFriendRequest, rung haptics.medium và invalidate sent queries', async () => {
      vi.mocked(friendshipApi.sendFriendRequest).mockResolvedValueOnce({
        friendshipId: 'new-fs',
        status: 'PENDING',
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      let mutationResult;
      await act(async () => {
        mutationResult = await result.current.sendRequest('user-target-123');
      });

      expect(friendshipApi.sendFriendRequest).toHaveBeenCalledWith('user-target-123');
      expect(haptics.medium).toHaveBeenCalled();
      expect(mutationResult).toEqual({ friendshipId: 'new-fs', status: 'PENDING' });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'sent'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'sent', 'count'] });
    });

    it('acceptRequest gọi acceptFriendRequest, rung haptics.medium và invalidate friends, received queries', async () => {
      vi.mocked(friendshipApi.acceptFriendRequest).mockResolvedValueOnce({
        friendshipId: 'req-1',
        status: 'ACCEPTED',
      });
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.acceptRequest('req-1');
      });

      expect(friendshipApi.acceptFriendRequest).toHaveBeenCalledWith('req-1');
      expect(haptics.medium).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'friends'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'received'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'count'] });
    });

    it('declineRequest gọi declineFriendRequest, rung haptics.light và invalidate received queries', async () => {
      vi.mocked(friendshipApi.declineFriendRequest).mockResolvedValueOnce(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.declineRequest('req-1');
      });

      expect(friendshipApi.declineFriendRequest).toHaveBeenCalledWith('req-1');
      expect(haptics.light).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'received'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'count'] });
    });

    it('cancelRequest gọi cancelFriendRequest, rung haptics.light và invalidate sent queries', async () => {
      vi.mocked(friendshipApi.cancelFriendRequest).mockResolvedValueOnce(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.cancelRequest('sent-1');
      });

      expect(friendshipApi.cancelFriendRequest).toHaveBeenCalledWith('sent-1');
      expect(haptics.light).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'sent'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'sent', 'count'] });
    });

    it('unfriend gọi unfriend, rung haptics.medium và invalidate friends query', async () => {
      vi.mocked(friendshipApi.unfriend).mockResolvedValueOnce(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.unfriend('f-1');
      });

      expect(friendshipApi.unfriend).toHaveBeenCalledWith('f-1');
      expect(haptics.medium).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'friends'] });
    });

    it('blockUser gọi blockUser, rung haptics.medium và invalidate friends, received, sent queries', async () => {
      vi.mocked(friendshipApi.blockUser).mockResolvedValueOnce(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.blockUser('u-bad');
      });

      expect(friendshipApi.blockUser).toHaveBeenCalledWith('u-bad');
      expect(haptics.medium).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'friends'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'received'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'sent'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships'] });
    });

    it('unblockUser gọi unblockUser, rung haptics.light và invalidate friendship queries', async () => {
      vi.mocked(friendshipApi.unblockUser).mockResolvedValueOnce(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.unblockUser('u-blocked');
      });

      expect(friendshipApi.unblockUser).toHaveBeenCalledWith('u-blocked');
      expect(haptics.light).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships'] });
    });

    it('acceptAll gọi acceptAllRequests, rung haptics.medium và invalidate friends + received', async () => {
      vi.mocked(friendshipApi.acceptAllRequests).mockResolvedValueOnce(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.acceptAll();
      });

      expect(friendshipApi.acceptAllRequests).toHaveBeenCalled();
      expect(haptics.medium).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'friends'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'received'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'count'] });
    });

    it('declineAll gọi declineAllRequests, rung haptics.light và invalidate received queries', async () => {
      vi.mocked(friendshipApi.declineAllRequests).mockResolvedValueOnce(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.declineAll();
      });

      expect(friendshipApi.declineAllRequests).toHaveBeenCalled();
      expect(haptics.light).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'received'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/friendships', 'requests', 'count'] });
    });

    it('refetchAll thực thi refetch toàn bộ các queries đồng thời', async () => {
      const { result } = renderHook(() => useFriendships(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.refetchAll();
      });

      expect(friendshipApi.getMyFriends).toHaveBeenCalled();
      expect(friendshipApi.getPendingReceivedRequests).toHaveBeenCalled();
      expect(friendshipApi.getPendingReceivedCount).toHaveBeenCalled();
      expect(friendshipApi.getPendingSentRequests).toHaveBeenCalled();
      expect(friendshipApi.getPendingSentCount).toHaveBeenCalled();
    });
  });
});
