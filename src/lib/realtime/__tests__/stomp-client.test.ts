import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatRealtimeClient } from '../stomp-client';
import type {
  MessageResponse,
  ReadReceiptEvent,
  TypingIndicatorEvent,
  ErrorResponse,
} from '@/types/chat';

const mockPublish = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
const mockActivate = vi.fn();
const mockDeactivate = vi.fn().mockResolvedValue(undefined);
let capturedClientConfig: any = null;

vi.mock('@stomp/stompjs', () => {
  return {
    Client: vi.fn().mockImplementation((config) => {
      capturedClientConfig = config;
      return {
        activate: mockActivate,
        deactivate: mockDeactivate,
        publish: mockPublish,
        subscribe: mockSubscribe,
        connected: false,
        reconnectDelay: config.reconnectDelay ?? 5000,
        ...config,
      };
    }),
  };
});

describe('ChatRealtimeClient', () => {
  let client: ChatRealtimeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedClientConfig = null;
    client = new ChatRealtimeClient({ tokenGetter: () => 'test-jwt-token' });
  });

  it('initializes STOMP client with token headers and connects', () => {
    client.connect();
    expect(mockActivate).toHaveBeenCalled();
  });

  it('publishes chat message payload to /app/chat.send', () => {
    client.sendMessage({ conversationId: 'c1', content: 'Hi', type: 'TEXT' });
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/chat.send',
        body: JSON.stringify({ conversationId: 'c1', content: 'Hi', type: 'TEXT' }),
      })
    );
  });

  it('publishes typing indicator payload to /app/chat.typing', () => {
    client.sendTyping({ conversationId: 'c1', isTyping: true });
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/chat.typing',
        body: JSON.stringify({ conversationId: 'c1', isTyping: true }),
      })
    );
  });

  it('publishes read payload to /app/chat.read', () => {
    client.sendReadReceipt('c1');
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/chat.read',
        body: JSON.stringify({ conversationId: 'c1' }),
      })
    );
  });

  it('gracefully handles disconnect', async () => {
    await client.disconnect();
    expect(mockDeactivate).toHaveBeenCalled();
  });

  it('does not connect when token is empty or null (prevents reconnect loop)', async () => {
    const unauthedClient = new ChatRealtimeClient({ tokenGetter: () => null });
    unauthedClient.connect();
    expect(mockActivate).not.toHaveBeenCalled();

    // Verify beforeConnect also halts reconnection
    if (capturedClientConfig?.beforeConnect) {
      await capturedClientConfig.beforeConnect();
      expect(mockDeactivate).toHaveBeenCalled();
    }
  });

  it('does not connect when token is expired (prevents reconnect loop)', () => {
    // Expired JWT payload with exp in the past (exp: 1000)
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMSIsImV4cCI6MTAwMH0.signature
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMSIsImV4cCI6MTAwMH0.signature';
    const expiredClient = new ChatRealtimeClient({ tokenGetter: () => expiredToken });
    expiredClient.connect();
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('subscribes to queues upon connect and dispatches messages to listeners', () => {
    const subscriptionMap = new Map<string, (msg: any) => void>();
    mockSubscribe.mockImplementation((dest: string, callback: any) => {
      subscriptionMap.set(dest, callback);
      return { unsubscribe: vi.fn() };
    });

    const messageListener = vi.fn();
    const readListener = vi.fn();
    const typingListener = vi.fn();
    const errorListener = vi.fn();

    client.onMessage(messageListener);
    client.onReadReceipt(readListener);
    client.onTyping(typingListener);
    client.onError(errorListener);

    client.connect();

    // Trigger onConnect callback
    expect(capturedClientConfig?.onConnect).toBeDefined();
    capturedClientConfig.onConnect();

    expect(mockSubscribe).toHaveBeenCalledWith(
      '/user/queue/messages',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      '/user/queue/read-receipts',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      '/user/queue/typing',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      '/user/queue/errors',
      expect.any(Function)
    );

    // Simulate incoming message
    const sampleMsg: MessageResponse = {
      id: 'm-1',
      conversationId: 'c1',
      senderId: 'u-1',
      type: 'TEXT',
      content: 'Hello world',
      sentAt: '2026-11-07T12:00:00Z',
    };
    subscriptionMap.get('/user/queue/messages')?.({ body: JSON.stringify(sampleMsg) });
    expect(messageListener).toHaveBeenCalledWith(sampleMsg);

    // Simulate incoming read receipt
    const sampleRead: ReadReceiptEvent = {
      conversationId: 'c1',
      readerId: 'u-2',
      readAt: '2026-11-07T12:01:00Z',
    };
    subscriptionMap.get('/user/queue/read-receipts')?.({ body: JSON.stringify(sampleRead) });
    expect(readListener).toHaveBeenCalledWith(sampleRead);

    // Simulate incoming typing
    const sampleTyping: TypingIndicatorEvent = {
      conversationId: 'c1',
      userId: 'u-2',
      isTyping: true,
    };
    subscriptionMap.get('/user/queue/typing')?.({ body: JSON.stringify(sampleTyping) });
    expect(typingListener).toHaveBeenCalledWith(sampleTyping);

    // Simulate incoming error
    const sampleError: ErrorResponse = {
      status: 400,
      message: 'Bad Request',
    };
    subscriptionMap.get('/user/queue/errors')?.({ body: JSON.stringify(sampleError) });
    expect(errorListener).toHaveBeenCalledWith(sampleError);
  });

  it('allows unsubscribing listener callbacks', () => {
    const subscriptionMap = new Map<string, (msg: any) => void>();
    mockSubscribe.mockImplementation((dest: string, callback: any) => {
      subscriptionMap.set(dest, callback);
      return { unsubscribe: vi.fn() };
    });

    const messageListener = vi.fn();
    const unsubscribe = client.onMessage(messageListener);

    client.connect();
    capturedClientConfig.onConnect();

    // Unsubscribe listener
    unsubscribe();

    const sampleMsg: MessageResponse = {
      id: 'm-2',
      conversationId: 'c1',
      senderId: 'u-1',
      type: 'TEXT',
      content: 'Should not receive',
      sentAt: '2026-11-07T12:00:00Z',
    };
    subscriptionMap.get('/user/queue/messages')?.({ body: JSON.stringify(sampleMsg) });
    expect(messageListener).not.toHaveBeenCalled();
  });

  it('publishes message with reply context and photo context', () => {
    client.sendMessage({
      conversationId: 'c1',
      content: 'Loving this photo!',
      type: 'PHOTO_REACTION',
      replyToMessageId: 'm-original',
      photoContext: {
        photoId: 'photo-1',
        photoUrl: 'https://images.example.com/p1.jpg',
        caption: 'Sunset in Da Nang',
      },
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/chat.send',
        body: JSON.stringify({
          conversationId: 'c1',
          content: 'Loving this photo!',
          type: 'PHOTO_REACTION',
          replyToMessageId: 'm-original',
          photoContext: {
            photoId: 'photo-1',
            photoUrl: 'https://images.example.com/p1.jpg',
            caption: 'Sunset in Da Nang',
          },
        }),
      })
    );
  });

  it('publishes read receipt when given an object payload', () => {
    client.sendReadReceipt({ conversationId: 'c-obj' });
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/chat.read',
        body: JSON.stringify({ conversationId: 'c-obj' }),
      })
    );
  });

  it('dispatches connect, disconnect, and stomp error events to listeners', () => {
    const onConnectCb = vi.fn();
    const onDisconnectCb = vi.fn();
    const onErrorCb = vi.fn();

    client.onConnect(onConnectCb);
    client.onDisconnect(onDisconnectCb);
    client.onError(onErrorCb);

    capturedClientConfig.onConnect();
    expect(onConnectCb).toHaveBeenCalledTimes(1);

    capturedClientConfig.onDisconnect();
    expect(onDisconnectCb).toHaveBeenCalledTimes(1);

    capturedClientConfig.onStompError({
      headers: { message: 'Broker unavailable' },
    });
    expect(onErrorCb).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        message: 'Broker unavailable',
      })
    );
  });

  it('handles corrupted JSON body gracefully without throwing', () => {
    const subscriptionMap = new Map<string, (msg: any) => void>();
    mockSubscribe.mockImplementation((dest: string, callback: any) => {
      subscriptionMap.set(dest, callback);
      return { unsubscribe: vi.fn() };
    });

    const messageListener = vi.fn();
    client.onMessage(messageListener);

    client.connect();
    capturedClientConfig.onConnect();

    // Send malformed JSON
    subscriptionMap.get('/user/queue/messages')?.({ body: 'invalid-json' });
    expect(messageListener).not.toHaveBeenCalled();
  });

  it('is SSR-safe and does not activate when window is undefined', () => {
    const originalWindow = globalThis.window;
    try {
      // @ts-ignore
      delete globalThis.window;
      const ssrClient = new ChatRealtimeClient({ tokenGetter: () => 'test-jwt-token' });
      ssrClient.connect();
      expect(mockActivate).not.toHaveBeenCalled();
    } finally {
      globalThis.window = originalWindow;
    }
  });

  describe('normalizeSockJsUrl', () => {
    it('converts wss:// to https:// and ws:// to http://', async () => {
      const { normalizeSockJsUrl } = await import('../stomp-client');
      expect(normalizeSockJsUrl('wss://backend.herokuapp.com/ws-chat')).toBe(
        'https://backend.herokuapp.com/ws-chat'
      );
      expect(normalizeSockJsUrl('ws://localhost:8080/ws-chat')).toBe(
        'http://localhost:8080/ws-chat'
      );
      expect(normalizeSockJsUrl('https://example.com/ws-chat')).toBe(
        'https://example.com/ws-chat'
      );
    });
  });

  describe('isTokenMissingOrExpired', () => {
    it('returns true for null, empty, or whitespace tokens', async () => {
      const { isTokenMissingOrExpired } = await import('../stomp-client');
      expect(isTokenMissingOrExpired(null)).toBe(true);
      expect(isTokenMissingOrExpired(undefined)).toBe(true);
      expect(isTokenMissingOrExpired('')).toBe(true);
      expect(isTokenMissingOrExpired('   ')).toBe(true);
    });
  });
});
