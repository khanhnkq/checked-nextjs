import SockJS from 'sockjs-client';
import { Client, type StompSubscription } from '@stomp/stompjs';
import { isTokenExpired } from '@/lib/auth/jwt';
import { useAuthStore } from '@/stores/auth-store';
import type {
  MessageResponse,
  ReadReceiptEvent,
  TypingIndicatorEvent,
  SendChatMessagePayload,
  TypingIndicatorPayload,
  MarkChatReadPayload,
  ErrorResponse,
} from '@/types/chat';

export function normalizeSockJsUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.startsWith('wss://')) {
    url = 'https://' + url.slice(6);
  } else if (url.startsWith('ws://')) {
    url = 'http://' + url.slice(5);
  }
  return url;
}

export function resolveDefaultWsUrl(): string {
  const envWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envWsUrl && envWsUrl.trim() !== '') {
    return normalizeSockJsUrl(envWsUrl);
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8080';
  const cleanBase = apiBase.replace(/\/+$/, '');
  return `${normalizeSockJsUrl(cleanBase)}/ws-chat`;
}

export function isTokenMissingOrExpired(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return true;
  }
  const parts = token.trim().split('.');
  // Evaluate JWT exp claim when provided in valid 3-part format
  if (parts.length === 3) {
    return isTokenExpired(token);
  }
  return false;
}

export interface ChatRealtimeClientOptions {
  tokenGetter?: () => string | null | undefined;
  wsUrl?: string;
  reconnectDelay?: number;
  onMessage?: (msg: MessageResponse) => void;
  onReadReceipt?: (event: ReadReceiptEvent) => void;
  onTyping?: (event: TypingIndicatorEvent) => void;
  onError?: (error: ErrorResponse) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class ChatRealtimeClient {
  private client: Client;
  private wsUrl: string;
  private tokenGetter: () => string | null | undefined;
  private reconnectDelay: number;
  private subscriptions: StompSubscription[] = [];

  private messageListeners = new Set<(msg: MessageResponse) => void>();
  private readReceiptListeners = new Set<(event: ReadReceiptEvent) => void>();
  private typingListeners = new Set<(event: TypingIndicatorEvent) => void>();
  private errorListeners = new Set<(error: ErrorResponse) => void>();
  private connectListeners = new Set<() => void>();
  private disconnectListeners = new Set<() => void>();

  constructor(options?: ChatRealtimeClientOptions) {
    this.tokenGetter =
      options?.tokenGetter ??
      (() => {
        try {
          return useAuthStore.getState().accessToken;
        } catch {
          return null;
        }
      });

    this.wsUrl = options?.wsUrl
      ? normalizeSockJsUrl(options.wsUrl)
      : resolveDefaultWsUrl();
    this.reconnectDelay = options?.reconnectDelay ?? 5000;

    if (options?.onMessage) this.messageListeners.add(options.onMessage);
    if (options?.onReadReceipt) this.readReceiptListeners.add(options.onReadReceipt);
    if (options?.onTyping) this.typingListeners.add(options.onTyping);
    if (options?.onError) this.errorListeners.add(options.onError);
    if (options?.onConnect) this.connectListeners.add(options.onConnect);
    if (options?.onDisconnect) this.disconnectListeners.add(options.onDisconnect);

    this.client = new Client({
      webSocketFactory: () => {
        if (typeof window === 'undefined') {
          throw new Error('[ChatRealtimeClient] Cannot initialize WebSocket in SSR');
        }
        return new SockJS(this.wsUrl);
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: async () => {
        const token = this.tokenGetter();
        if (isTokenMissingOrExpired(token)) {
          this.client.reconnectDelay = 0;
          await this.client.deactivate();
          return;
        }
        this.client.connectHeaders = {
          Authorization: `Bearer ${token}`,
        };
      },
      onConnect: () => {
        this.setupSubscriptions();
        this.connectListeners.forEach((listener) => {
          try {
            listener();
          } catch (err) {
            console.error('[ChatRealtimeClient] onConnect error:', err);
          }
        });
      },
      onDisconnect: () => {
        this.cleanupSubscriptions();
        this.disconnectListeners.forEach((listener) => {
          try {
            listener();
          } catch (err) {
            console.error('[ChatRealtimeClient] onDisconnect error:', err);
          }
        });
      },
      onStompError: (frame) => {
        const token = this.tokenGetter();
        if (isTokenMissingOrExpired(token)) {
          this.client.reconnectDelay = 0;
          this.client.deactivate();
        }
        const errResponse: ErrorResponse = {
          status: 500,
          message: frame?.headers?.message || 'STOMP connection error',
        };
        this.errorListeners.forEach((listener) => {
          try {
            listener(errResponse);
          } catch (err) {
            console.error('[ChatRealtimeClient] onError error:', err);
          }
        });
      },
      onWebSocketClose: () => {
        const token = this.tokenGetter();
        if (isTokenMissingOrExpired(token)) {
          this.client.reconnectDelay = 0;
          this.client.deactivate();
        }
      },
    });
  }

  get isConnected(): boolean {
    return Boolean(this.client?.connected);
  }

  connect(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const token = this.tokenGetter();
    if (isTokenMissingOrExpired(token)) {
      return;
    }
    this.client.reconnectDelay = this.reconnectDelay;
    this.client.connectHeaders = {
      Authorization: `Bearer ${token}`,
    };
    this.client.activate();
  }

  async disconnect(): Promise<void> {
    this.cleanupSubscriptions();
    if (this.client) {
      await this.client.deactivate();
    }
  }

  sendMessage(payload: SendChatMessagePayload): void {
    const body: Record<string, unknown> = {
      conversationId: payload.conversationId,
      content: payload.content,
      type: payload.type || 'TEXT',
    };
    if (payload.replyToMessageId !== undefined) {
      body.replyToMessageId = payload.replyToMessageId;
    }
    if (payload.photoContext !== undefined) {
      body.photoContext = payload.photoContext;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(body),
    });
  }

  sendTyping(payload: TypingIndicatorPayload): void {
    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({
        conversationId: payload.conversationId,
        isTyping: payload.isTyping,
      }),
    });
  }

  sendReadReceipt(payloadOrConvId: string | MarkChatReadPayload): void {
    const payload =
      typeof payloadOrConvId === 'string'
        ? { conversationId: payloadOrConvId }
        : payloadOrConvId;

    this.client.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({
        conversationId: payload.conversationId,
      }),
    });
  }

  onMessage(callback: (msg: MessageResponse) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  onReadReceipt(callback: (event: ReadReceiptEvent) => void): () => void {
    this.readReceiptListeners.add(callback);
    return () => {
      this.readReceiptListeners.delete(callback);
    };
  }

  onTyping(callback: (event: TypingIndicatorEvent) => void): () => void {
    this.typingListeners.add(callback);
    return () => {
      this.typingListeners.delete(callback);
    };
  }

  onError(callback: (error: ErrorResponse) => void): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  onConnect(callback: () => void): () => void {
    this.connectListeners.add(callback);
    return () => {
      this.connectListeners.delete(callback);
    };
  }

  onDisconnect(callback: () => void): () => void {
    this.disconnectListeners.add(callback);
    return () => {
      this.disconnectListeners.delete(callback);
    };
  }

  private setupSubscriptions(): void {
    this.cleanupSubscriptions();

    // 1. /user/queue/messages -> MessageResponse
    this.subscriptions.push(
      this.client.subscribe('/user/queue/messages', (message) => {
        let payload: MessageResponse;
        try {
          payload = JSON.parse(message.body);
        } catch (err) {
          console.error('[ChatRealtimeClient] Failed to parse message body:', err);
          return;
        }

        this.messageListeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (err) {
            console.error('[ChatRealtimeClient] Error in message listener callback:', err);
          }
        });
      })
    );

    // 2. /user/queue/read-receipts -> ReadReceiptEvent
    this.subscriptions.push(
      this.client.subscribe('/user/queue/read-receipts', (message) => {
        let payload: ReadReceiptEvent;
        try {
          payload = JSON.parse(message.body);
        } catch (err) {
          console.error('[ChatRealtimeClient] Failed to parse read receipt body:', err);
          return;
        }

        this.readReceiptListeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (err) {
            console.error('[ChatRealtimeClient] Error in read receipt listener callback:', err);
          }
        });
      })
    );

    // 3. /user/queue/typing -> TypingIndicatorEvent
    this.subscriptions.push(
      this.client.subscribe('/user/queue/typing', (message) => {
        let payload: TypingIndicatorEvent;
        try {
          payload = JSON.parse(message.body);
        } catch (err) {
          console.error('[ChatRealtimeClient] Failed to parse typing body:', err);
          return;
        }

        this.typingListeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (err) {
            console.error('[ChatRealtimeClient] Error in typing listener callback:', err);
          }
        });
      })
    );

    // 4. /user/queue/errors -> ErrorResponse
    this.subscriptions.push(
      this.client.subscribe('/user/queue/errors', (message) => {
        let payload: ErrorResponse;
        try {
          payload = JSON.parse(message.body);
        } catch (err) {
          console.error('[ChatRealtimeClient] Failed to parse error body:', err);
          return;
        }

        this.errorListeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (err) {
            console.error('[ChatRealtimeClient] Error in error listener callback:', err);
          }
        });
      })
    );
  }

  private cleanupSubscriptions(): void {
    this.subscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch {
        // Ignore unsubscribe errors on stale connections
      }
    });
    this.subscriptions = [];
  }
}

let sharedClient: ChatRealtimeClient | null = null;

export function getChatRealtimeClient(options?: ChatRealtimeClientOptions): ChatRealtimeClient {
  if (!sharedClient) {
    sharedClient = new ChatRealtimeClient(options);
  }
  return sharedClient;
}

export const chatRealtimeClient = {
  get instance(): ChatRealtimeClient {
    return getChatRealtimeClient();
  },
};
