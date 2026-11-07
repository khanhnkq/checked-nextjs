import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as chatApi from '../chat-api';
import { customFetcher } from '../custom-fetcher';

vi.mock('../custom-fetcher', () => ({
  customFetcher: vi.fn(),
}));

describe('chat-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyConversations calls GET /api/v1/conversations', async () => {
    const mockData = [{ id: 'c1', participantIds: ['u1', 'u2'], partner: { id: 'u2', displayName: 'Partner' } }];
    vi.mocked(customFetcher).mockResolvedValueOnce(mockData);

    const result = await chatApi.getMyConversations();
    expect(customFetcher).toHaveBeenCalledWith('/api/v1/conversations', expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(mockData);
  });

  it('getOrCreateConversation calls POST /api/v1/conversations with friendId', async () => {
    const mockConv = { id: 'c1', partner: { id: 'f-123', displayName: 'Alice' } };
    vi.mocked(customFetcher).mockResolvedValueOnce(mockConv);

    const result = await chatApi.getOrCreateConversation('f-123');
    expect(customFetcher).toHaveBeenCalledWith('/api/v1/conversations', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ friendId: 'f-123' }),
    }));
    expect(result).toEqual(mockConv);
  });

  it('getConversationMessages builds cursor query parameters', async () => {
    const mockPage = { messages: [], nextCursor: null, hasMore: false };
    vi.mocked(customFetcher).mockResolvedValueOnce(mockPage);

    await chatApi.getConversationMessages('c1', '2026-11-07T10:00:00Z', 20);
    expect(customFetcher).toHaveBeenCalledWith(
      '/api/v1/conversations/c1/messages?before=2026-11-07T10%3A00%3A00Z&limit=20',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('sendChatMessage calls POST /api/v1/conversations/{id}/messages', async () => {
    const mockMsg = { id: 'm1', content: 'Hello' };
    vi.mocked(customFetcher).mockResolvedValueOnce(mockMsg);

    const result = await chatApi.sendChatMessage('c1', { content: 'Hello', type: 'TEXT' });
    expect(customFetcher).toHaveBeenCalledWith('/api/v1/conversations/c1/messages', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ content: 'Hello', type: 'TEXT' }),
    }));
    expect(result).toEqual(mockMsg);
  });

  it('markConversationAsRead calls PUT /api/v1/conversations/{id}/read', async () => {
    vi.mocked(customFetcher).mockResolvedValueOnce({ conversationId: 'c1', readAt: '2026-11-07T12:00:00Z' });
    const result = await chatApi.markConversationAsRead('c1');
    expect(customFetcher).toHaveBeenCalledWith('/api/v1/conversations/c1/read', expect.objectContaining({ method: 'PUT' }));
    expect(result.conversationId).toBe('c1');
  });

  it('getTotalUnreadCount calls GET /api/v1/conversations/unread-total', async () => {
    vi.mocked(customFetcher).mockResolvedValueOnce({ unreadCount: 5 });
    const result = await chatApi.getTotalUnreadCount();
    expect(customFetcher).toHaveBeenCalledWith('/api/v1/conversations/unread-total', expect.objectContaining({ method: 'GET' }));
    expect(result.unreadCount).toBe(5);
  });

  it('deleteChatMessage calls DELETE /api/v1/conversations/{id}/messages/{msgId}', async () => {
    vi.mocked(customFetcher).mockResolvedValueOnce(undefined);
    await chatApi.deleteChatMessage('c1', 'm1', 'FOR_EVERYONE');
    expect(customFetcher).toHaveBeenCalledWith('/api/v1/conversations/c1/messages/m1?mode=FOR_EVERYONE', expect.objectContaining({ method: 'DELETE' }));
  });
});
