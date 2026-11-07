import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  friendshipKeys,
  getMyFriends,
  sendFriendRequest,
  getPendingReceivedRequests,
  getPendingReceivedCount,
  getPendingSentRequests,
  getPendingSentCount,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
  blockUser,
  unblockUser,
  getBlockedUsers,
  acceptAllRequests,
  declineAllRequests,
  getMutualFriends,
  getCurrentInviteLink,
  createOrRotateInviteLink,
  revokeInviteLink,
  previewInviteToken,
  acceptInviteToken,
  getUserProfileByUsername,
} from '../friendship-api';
import { customFetcher } from '../custom-fetcher';

vi.mock('../custom-fetcher', () => ({
  customFetcher: vi.fn(),
}));

describe('Friendship API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('friendshipKeys', () => {
    it('sinh đúng cấu trúc query keys chuẩn cho React Query', () => {
      expect(friendshipKeys.all).toEqual(['/api/v1/friendships']);
      expect(friendshipKeys.friends()).toEqual(['/api/v1/friendships', 'friends']);
      expect(friendshipKeys.received()).toEqual(['/api/v1/friendships', 'requests', 'received']);
      expect(friendshipKeys.receivedCount()).toEqual(['/api/v1/friendships', 'requests', 'count']);
      expect(friendshipKeys.sent()).toEqual(['/api/v1/friendships', 'requests', 'sent']);
      expect(friendshipKeys.sentCount()).toEqual(['/api/v1/friendships', 'requests', 'sent', 'count']);
      expect(friendshipKeys.mutual('user-123')).toEqual(['/api/v1/friendships', 'user-123', 'mutual']);
      expect(friendshipKeys.inviteCurrent).toEqual(['/api/v1/friend-invite-links', 'current']);
      expect(friendshipKeys.invitePreview('token-xyz')).toEqual(['/api/v1/friend-invite-links', 'preview', 'token-xyz']);
      expect(friendshipKeys.userProfile('alex_checked')).toEqual(['/api/v1/users', 'profile', 'alex_checked']);
    });
  });

  describe('getMyFriends', () => {
    it('gọi GET /api/v1/friendships thành công', async () => {
      const mockFriends = [
        {
          id: 'user-1',
          username: 'johndoe',
          displayName: 'John Doe',
          avatarUrl: 'https://cdn.checked.app/avatar1.jpg',
          isGoldMember: false,
        },
      ];
      vi.mocked(customFetcher).mockResolvedValueOnce(mockFriends);

      const controller = new AbortController();
      const result = await getMyFriends(controller.signal);

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships',
        method: 'GET',
        signal: controller.signal,
      });
      expect(result).toEqual(mockFriends);
    });
  });

  describe('sendFriendRequest', () => {
    it('gọi POST /api/v1/friendships/requests kèm targetUserId', async () => {
      const mockResponse = {
        friendshipId: 'fs-123',
        status: 'PENDING',
        relationshipStatus: 'PENDING_SENT',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockResponse);

      const result = await sendFriendRequest('target-user-456');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { targetUserId: 'target-user-456' },
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPendingReceivedRequests', () => {
    it('gọi GET /api/v1/friendships/requests/received thành công', async () => {
      const mockRequests = [
        {
          friendshipId: 'fs-1',
          requester: {
            id: 'u-2',
            username: 'alice',
            displayName: 'Alice Smith',
          },
          createdAt: '2026-11-06T10:00:00Z',
        },
      ];
      vi.mocked(customFetcher).mockResolvedValueOnce(mockRequests);

      const result = await getPendingReceivedRequests();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/received',
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockRequests);
    });
  });

  describe('getPendingReceivedCount', () => {
    it('gọi GET /api/v1/friendships/requests/count thành công', async () => {
      const mockCount = { pendingCount: 3 };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockCount);

      const result = await getPendingReceivedCount();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/count',
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockCount);
    });
  });

  describe('getPendingSentRequests', () => {
    it('gọi GET /api/v1/friendships/requests/sent thành công', async () => {
      const mockSent = [
        {
          friendshipId: 'fs-2',
          targetUser: {
            id: 'u-3',
            username: 'bob',
            displayName: 'Bob Wilson',
          },
          createdAt: '2026-11-05T15:00:00Z',
        },
      ];
      vi.mocked(customFetcher).mockResolvedValueOnce(mockSent);

      const result = await getPendingSentRequests();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/sent',
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockSent);
    });
  });

  describe('getPendingSentCount', () => {
    it('gọi GET /api/v1/friendships/requests/sent/count thành công', async () => {
      const mockCount = { sentCount: 2 };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockCount);

      const result = await getPendingSentCount();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/sent/count',
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockCount);
    });
  });

  describe('acceptFriendRequest', () => {
    it('gọi PUT /api/v1/friendships/requests/{friendshipId}/accept thành công', async () => {
      const mockAccept = {
        friendshipId: 'fs-123',
        status: 'ACCEPTED',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockAccept);

      const result = await acceptFriendRequest('fs-123');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/fs-123/accept',
        method: 'PUT',
        signal: undefined,
      });
      expect(result).toEqual(mockAccept);
    });
  });

  describe('declineFriendRequest', () => {
    it('gọi PUT /api/v1/friendships/requests/{friendshipId}/decline thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await declineFriendRequest('fs-123');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/fs-123/decline',
        method: 'PUT',
        signal: undefined,
      });
    });
  });

  describe('cancelFriendRequest', () => {
    it('gọi DELETE /api/v1/friendships/requests/{friendshipId}/cancel thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await cancelFriendRequest('fs-123');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/fs-123/cancel',
        method: 'DELETE',
        signal: undefined,
      });
    });
  });

  describe('unfriend', () => {
    it('gọi DELETE /api/v1/friendships/{friendId} thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await unfriend('friend-456');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/friend-456',
        method: 'DELETE',
        signal: undefined,
      });
    });
  });

  describe('blockUser and unblockUser', () => {
    it('gọi POST /api/v1/friendships/{userId}/block thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await blockUser('user-999');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/user-999/block',
        method: 'POST',
        signal: undefined,
      });
    });

    it('gọi DELETE /api/v1/friendships/{userId}/block thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await unblockUser('user-999');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/user-999/block',
        method: 'DELETE',
        signal: undefined,
      });
    });
  });

  describe('getBlockedUsers', () => {
    it('gọi GET /api/v1/friendships/blocked thành công', async () => {
      const mockBlocked = [
        {
          id: 'blocked-1',
          username: 'spammer',
          displayName: 'Spam Bot',
        },
      ];
      vi.mocked(customFetcher).mockResolvedValueOnce(mockBlocked);

      const result = await getBlockedUsers();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/blocked',
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockBlocked);
    });
  });

  describe('acceptAllRequests and declineAllRequests', () => {
    it('gọi PUT /api/v1/friendships/requests/accept-all thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await acceptAllRequests();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/accept-all',
        method: 'PUT',
        signal: undefined,
      });
    });

    it('gọi PUT /api/v1/friendships/requests/decline-all thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await declineAllRequests();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/requests/decline-all',
        method: 'PUT',
        signal: undefined,
      });
    });
  });

  describe('getMutualFriends', () => {
    it('gọi GET /api/v1/friendships/{targetUserId}/mutual thành công', async () => {
      const mockMutual = [
        {
          id: 'user-mutual',
          username: 'mutual_friend',
          displayName: 'Mutual Friend',
        },
      ];
      vi.mocked(customFetcher).mockResolvedValueOnce(mockMutual);

      const result = await getMutualFriends('target-user-789');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friendships/target-user-789/mutual',
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockMutual);
    });
  });

  describe('getCurrentInviteLink', () => {
    it('gọi GET /api/v1/friend-invite-links/current thành công', async () => {
      const mockLink = {
        id: 'link-1',
        inviteUrl: 'https://checked.app/invite?token=abc123xyz',
        tokenPreview: 'abc123xyz',
        maxUses: 50,
        usedCount: 5,
        status: 'ACTIVE',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockLink);

      const result = await getCurrentInviteLink();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friend-invite-links/current',
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockLink);
    });
  });

  describe('createOrRotateInviteLink', () => {
    it('gọi POST /api/v1/friend-invite-links với maxUses và validDays (chuyển thành ttlMinutes)', async () => {
      const mockCreated = {
        id: 'link-2',
        inviteUrl: 'https://checked.app/invite?token=newtoken',
        status: 'ACTIVE',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockCreated);

      const result = await createOrRotateInviteLink(20, 7);

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friend-invite-links',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          maxUses: 20,
          ttlMinutes: 10080,
        },
        signal: undefined,
      });
      expect(result).toEqual(mockCreated);
    });

    it('gọi POST /api/v1/friend-invite-links không truyền tham số', async () => {
      const mockCreated = {
        id: 'link-default',
        inviteUrl: 'https://checked.app/invite?token=deftoken',
        status: 'ACTIVE',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockCreated);

      const result = await createOrRotateInviteLink();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friend-invite-links',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: undefined,
        signal: undefined,
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('revokeInviteLink', () => {
    it('gọi DELETE /api/v1/friend-invite-links/current thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await revokeInviteLink();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friend-invite-links/current',
        method: 'DELETE',
        signal: undefined,
      });
    });
  });

  describe('previewInviteToken', () => {
    it('gọi GET /api/v1/friend-invite-links/preview có query param token', async () => {
      const mockPreview = {
        inviter: {
          id: 'inviter-1',
          username: 'charlie',
          displayName: 'Charlie Brown',
        },
        status: 'ACTIVE',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockPreview);

      const result = await previewInviteToken('token-12345');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friend-invite-links/preview',
        method: 'GET',
        params: { token: 'token-12345' },
        signal: undefined,
      });
      expect(result).toEqual(mockPreview);
    });
  });

  describe('acceptInviteToken', () => {
    it('gọi POST /api/v1/friend-invite-links/accept kèm body token', async () => {
      const mockAccept = {
        friendshipId: 'fs-joined',
        status: 'ACCEPTED',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockAccept);

      const result = await acceptInviteToken('token-12345');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/friend-invite-links/accept',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { token: 'token-12345' },
        signal: undefined,
      });
      expect(result).toEqual(mockAccept);
    });
  });

  describe('getUserProfileByUsername', () => {
    it('gọi GET /api/v1/users/profile/{username} thành công', async () => {
      const mockProfile = {
        id: 'user-pro',
        username: 'pro_user',
        displayName: 'Pro User',
        relationshipStatus: 'NONE',
        mutualFriendsCount: 3,
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockProfile);

      const result = await getUserProfileByUsername('pro_user');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/users/profile/pro_user',
        method: 'GET',
        signal: undefined,
      });
      expect(result).toEqual(mockProfile);
    });
  });
});
