# Friends List & Realtime 1-on-1 Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Friends & Messages Hub (`/messages`) and 1-on-1 Realtime Chat Room (`/messages/[id]`) with 100% visual/functional parity with `checked-ios`, backed by STOMP over SockJS (`/ws-chat`) and REST fallback APIs.

**Architecture:** A unified messaging hub pairs active friendship profiles with their most recent conversation data and unread counts. The chat room utilizes dynamic parameter resolution (resolving friend UUIDs to conversations via `POST /api/v1/conversations`) alongside cursor-based reverse message pagination and a bi-directional STOMP WebSocket client (`@stomp/stompjs`) for real-time messages, read receipts, and typing indicators.

**Tech Stack:** Next.js 15+ (App Router, React 19), Tailwind CSS v4, `@stomp/stompjs`, `sockjs-client`, `@tanstack/react-query`, Framer Motion, Lucide React, Vitest & React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-07-messages-chat-design.md`

## Global Constraints

- Design Tokens: Canvas `#EDE9DF`, Surface `#FFFFFF`, Primary `#D4EB70` (Matcha Glow), Text `#141613`, Error `#FF6954`.
- Circular interactive buttons must adhere to 44x44px with active scale transition `active:scale-95`.
- Canonical route for 1-on-1 chat room is `/messages/[friendId]` where `friendId` is a 36-character UUID, with fallback resolver for 24-character MongoDB `conversationId`.
- WebSocket connection must be SSR-safe (`typeof window !== 'undefined'`) and gracefully degrade to REST queries upon disconnection.
- Unread badge counts must remain synchronized between `/` (Home Top Bar), `/messages` (List), and individual chat rooms.

## Review Focus

1. **Unauthenticated or Expired Token on STOMP Connect**: When JWT expires, STOMP client reconnect must not cause an infinite crash loop; it should cleanly disconnect and await fresh token.
2. **Empty Message & Whitespace Submission**: Pressing Enter or clicking Send with only spaces or empty string must be blocked.
3. **Cursor Pagination Boundary**: Loading older messages when `hasMore === false` or `nextCursor === null` must terminate without duplicate fetch calls or UI jitter.
4. **Partner Typing Indicator Timeout**: If partner stops typing without sending a message, typing bubble must automatically disappear after 2.5s.
5. **Simultaneous WebSocket and REST Message Race**: Deduplication of messages by unique `id` so a message received via STOMP and subsequent query refetch never duplicate in the list.

---

### Task 1: Chat Types & REST API Client

**Files:**
- Create: `src/types/chat.ts`
- Modify: `src/types/index.ts`
- Create: `src/lib/api/chat-api.ts`
- Test: `src/lib/api/__tests__/chat-api.test.ts`

**Interfaces:**
- Consumes: `customFetcher` from `src/lib/api/custom-fetcher.ts`, `FriendProfile` from `src/types/friendship.ts`
- Produces: `MessageType`, `MessageResponse`, `ConversationResponse`, `FriendChatItem`, `MessageCursorPage`, `TypingIndicatorEvent`, `ReadReceiptEvent` types and API methods: `getMyConversations`, `getOrCreateConversation`, `getConversationMessages`, `sendChatMessage`, `markConversationAsRead`, `getTotalUnreadCount`, `deleteChatMessage`.

- [ ] **Step 1: Write the failing tests for `chat-api.ts`**

```typescript
// src/lib/api/__tests__/chat-api.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../checked-nextjs && npx vitest run src/lib/api/__tests__/chat-api.test.ts`  
Expected: FAIL with module not found or functions undefined.

- [ ] **Step 3: Implement `src/types/chat.ts` and `src/lib/api/chat-api.ts`**

Define types in `src/types/chat.ts` matching spec section 4.2. Export in `src/types/index.ts`. Implement methods in `src/lib/api/chat-api.ts` using `customFetcher`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ../checked-nextjs && npx vitest run src/lib/api/__tests__/chat-api.test.ts`  
Expected: PASS (7 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/types/chat.ts src/types/index.ts src/lib/api/chat-api.ts src/lib/api/__tests__/chat-api.test.ts
git commit -m "feat(chat): define chat types and REST API client"
```

---

### Task 2: STOMP WebSocket Client Service

**Files:**
- Create: `src/lib/realtime/stomp-client.ts`
- Create: `src/lib/realtime/index.ts`
- Test: `src/lib/realtime/__tests__/stomp-client.test.ts`

**Interfaces:**
- Consumes: `@stomp/stompjs`, `sockjs-client`, `env` from `src/lib/config/env.ts`, `useAuthStore` from `src/stores/auth-store.ts`
- Produces: `ChatRealtimeClient` class / singleton with `connect()`, `disconnect()`, `sendMessage()`, `sendReadReceipt()`, `sendTyping()`, and event subscription callbacks.

- [ ] **Step 1: Write the failing tests for `stomp-client.test.ts`**

```typescript
// src/lib/realtime/__tests__/stomp-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatRealtimeClient } from '../stomp-client';

const mockPublish = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
const mockActivate = vi.fn();
const mockDeactivate = vi.fn().mockResolvedValue(undefined);

vi.mock('@stomp/stompjs', () => {
  return {
    Client: vi.fn().mockImplementation((config) => {
      return {
        activate: mockActivate,
        deactivate: mockDeactivate,
        publish: mockPublish,
        subscribe: mockSubscribe,
        connected: false,
        ...config,
      };
    }),
  };
});

describe('ChatRealtimeClient', () => {
  let client: ChatRealtimeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ChatRealtimeClient({ tokenGetter: () => 'test-jwt-token' });
  });

  it('initializes STOMP client with token headers and connects', () => {
    client.connect();
    expect(mockActivate).toHaveBeenCalled();
  });

  it('publishes chat message payload to /app/chat.send', () => {
    client.sendMessage({ conversationId: 'c1', content: 'Hi', type: 'TEXT' });
    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      destination: '/app/chat.send',
      body: JSON.stringify({ conversationId: 'c1', content: 'Hi', type: 'TEXT' }),
    }));
  });

  it('publishes typing indicator payload to /app/chat.typing', () => {
    client.sendTyping({ conversationId: 'c1', isTyping: true });
    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId: 'c1', isTyping: true }),
    }));
  });

  it('publishes read payload to /app/chat.read', () => {
    client.sendReadReceipt('c1');
    expect(mockPublish).toHaveBeenCalledWith(expect.objectContaining({
      destination: '/app/chat.read',
      body: JSON.stringify({ conversationId: 'c1' }),
    }));
  });

  it('gracefully handles disconnect', async () => {
    await client.disconnect();
    expect(mockDeactivate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../checked-nextjs && npx vitest run src/lib/realtime/__tests__/stomp-client.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/realtime/stomp-client.ts`**

Wrap `@stomp/stompjs.Client` with SockJS factory targeting `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/ws-chat`. Include `connectHeaders: { Authorization: 'Bearer ' + token }`. Setup listener callbacks for `/user/queue/messages`, `/user/queue/read-receipts`, `/user/queue/typing`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ../checked-nextjs && npx vitest run src/lib/realtime/__tests__/stomp-client.test.ts`  
Expected: PASS (5 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/lib/realtime/stomp-client.ts src/lib/realtime/index.ts src/lib/realtime/__tests__/stomp-client.test.ts
git commit -m "feat(realtime): implement STOMP WebSocket client service"
```

---

### Task 3: TanStack Query Hook for Conversations & Unread Total

**Files:**
- Create: `src/hooks/useConversations.ts`
- Test: `src/hooks/__tests__/useConversations.test.tsx`

**Interfaces:**
- Consumes: `useFriendships` from `src/hooks/useFriendships.ts`, `getMyConversations`, `getTotalUnreadCount` from `src/lib/api/chat-api.ts`
- Produces: `useConversations` hook returning: `items: FriendChatItem[]`, `conversations: ConversationResponse[]`, `unreadTotal: number`, `isLoading: boolean`, `refetch: () => Promise<void>`.

- [ ] **Step 1: Write the failing tests for `useConversations.test.tsx`**

```typescript
// src/hooks/__tests__/useConversations.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useConversations } from '../useConversations';
import * as chatApi from '@/lib/api/chat-api';
import * as friendshipApi from '@/lib/api/friendship-api';

vi.mock('@/lib/api/chat-api');
vi.mock('@/lib/api/friendship-api');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges friends with active conversations into FriendChatItem list sorted by last activity', async () => {
    const mockFriends = [
      { id: 'f1', username: 'alice', displayName: 'Alice' },
      { id: 'f2', username: 'bob', displayName: 'Bob' },
    ];
    const mockConversations = [
      {
        id: 'c1',
        participantIds: ['u-me', 'f1'],
        partner: { id: 'f1', username: 'alice', displayName: 'Alice' },
        lastMessage: { id: 'm1', content: 'Hey!', sentAt: '2026-11-07T12:00:00Z' },
        unreadCount: 2,
        updatedAt: '2026-11-07T12:00:00Z',
      },
    ];

    vi.mocked(friendshipApi.getMyFriends).mockResolvedValueOnce(mockFriends as any);
    vi.mocked(chatApi.getMyConversations).mockResolvedValueOnce(mockConversations as any);
    vi.mocked(chatApi.getTotalUnreadCount).mockResolvedValueOnce({ unreadCount: 2 });

    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    // f1 with conversation should be first due to recent message
    expect(result.current.items[0].friend.id).toBe('f1');
    expect(result.current.items[0].unreadCount).toBe(2);
    expect(result.current.items[0].conversation?.id).toBe('c1');

    // f2 without conversation should be second
    expect(result.current.items[1].friend.id).toBe('f2');
    expect(result.current.items[1].unreadCount).toBe(0);
    expect(result.current.unreadTotal).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../checked-nextjs && npx vitest run src/hooks/__tests__/useConversations.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement `src/hooks/useConversations.ts`**

Implement queries for `friendshipKeys.friends()`, `chatKeys.conversations()`, and `chatKeys.unreadTotal()`. Merge arrays into `FriendChatItem[]` mapping `friend.id` to `conversation.partner.id`, sorting conversations with latest message timestamps to the top.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ../checked-nextjs && npx vitest run src/hooks/__tests__/useConversations.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useConversations.ts src/hooks/__tests__/useConversations.test.tsx
git commit -m "feat(chat): implement useConversations hook with friend & conversation merging"
```

---

### Task 4: TanStack Query Hook & Realtime Handler for 1-1 Chat (`useChat`)

**Files:**
- Create: `src/hooks/useChat.ts`
- Test: `src/hooks/__tests__/useChat.test.tsx`

**Interfaces:**
- Consumes: `chat-api.ts`, `stomp-client.ts`, `useAuthStore`
- Produces: `useChat` hook returning: `conversation`, `messages`, `isLoadingInitial`, `isLoadingMore`, `hasMore`, `loadMoreMessages`, `sendMessage`, `deleteMessage`, `replyingToMessage`, `setReplyingToMessage`, `isPartnerTyping`, `sendTyping`.

- [ ] **Step 1: Write the failing tests for `useChat.test.tsx`**

```typescript
// src/hooks/__tests__/useChat.test.tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useChat } from '../useChat';
import * as chatApi from '@/lib/api/chat-api';

vi.mock('@/lib/api/chat-api');
vi.mock('@/lib/realtime/stomp-client', () => ({
  ChatRealtimeClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendMessage: vi.fn(),
    sendReadReceipt: vi.fn(),
    sendTyping: vi.fn(),
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useChat', () => {
  const mockFriendId = 'f-123';
  const mockConversation = {
    id: 'conv-999',
    partner: { id: mockFriendId, displayName: 'Alice', username: 'alice' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chatApi.getOrCreateConversation).mockResolvedValue(mockConversation as any);
    vi.mocked(chatApi.getConversationMessages).mockResolvedValue({
      messages: [{ id: 'm1', content: 'Hi there', sentAt: '2026-11-07T12:00:00Z', type: 'TEXT', senderId: 'u-other', conversationId: 'conv-999' }],
      nextCursor: null,
      hasMore: false,
    });
    vi.mocked(chatApi.markConversationAsRead).mockResolvedValue({ conversationId: 'conv-999', readAt: '2026-11-07T12:01:00Z' });
  });

  it('resolves conversation via friendId and marks as read', async () => {
    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    expect(chatApi.getOrCreateConversation).toHaveBeenCalledWith(mockFriendId);
    expect(result.current.conversation?.id).toBe('conv-999');
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hi there');
    expect(chatApi.markConversationAsRead).toHaveBeenCalledWith('conv-999');
  });

  it('sends message via REST fallback when triggered', async () => {
    const sentMsg = { id: 'm2', content: 'New message', sentAt: '2026-11-07T12:02:00Z', type: 'TEXT', senderId: 'u-me', conversationId: 'conv-999' };
    vi.mocked(chatApi.sendChatMessage).mockResolvedValueOnce(sentMsg as any);

    const { result } = renderHook(() => useChat({ targetId: mockFriendId }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    await act(async () => {
      await result.current.sendMessage('New message');
    });

    expect(chatApi.sendChatMessage).toHaveBeenCalledWith('conv-999', expect.objectContaining({ content: 'New message' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../checked-nextjs && npx vitest run src/hooks/__tests__/useChat.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement `src/hooks/useChat.ts`**

Support `targetId` resolution (checking if it's a friendId UUID vs conversationId ObjectId). Auto call `markConversationAsRead` on load. Maintain message list state with deduplication by ID, support cursor loading, reply quote state, and typing state timeout (2500ms auto-clear).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ../checked-nextjs && npx vitest run src/hooks/__tests__/useChat.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useChat.ts src/hooks/__tests__/useChat.test.tsx
git commit -m "feat(chat): implement useChat hook with dynamic resolution and cursor pagination"
```

---

### Task 5: Messages Hub UI Components

**Files:**
- Create: `src/components/chat/MessagesTopBar.tsx`
- Create: `src/components/chat/FriendRequestsBanner.tsx`
- Create: `src/components/chat/FriendChatRow.tsx`
- Create: `src/components/chat/FriendshipListSkeleton.tsx`
- Create: `src/components/chat/index.ts`
- Tests: `src/components/chat/__tests__/messages-top-bar.test.tsx`, `src/components/chat/__tests__/friend-requests-banner.test.tsx`, `src/components/chat/__tests__/friend-chat-row.test.tsx`

**Interfaces:**
- Consumes: Design tokens, Lucide icons (`ChevronLeft`, `UserPlus`, `ChevronRight`), `FriendChatItem` type, `haptics`
- Produces: Exported chat components in `src/components/chat/index.ts`.

- [ ] **Step 1: Write failing component tests**

Test `MessagesTopBar` renders Back button, title "Tin nhắn", and "Thêm bạn" button with badge when `pendingRequestsCount > 0`.  
Test `FriendRequestsBanner` renders title, count badge, requester avatar stack, and triggers `onClick`.  
Test `FriendChatRow` renders friend avatar, display name, username, last message text, unread badge capsule, and calls `onClick`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ../checked-nextjs && npx vitest run src/components/chat/__tests__/messages-top-bar.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement components**

Implement `MessagesTopBar.tsx`, `FriendRequestsBanner.tsx`, `FriendChatRow.tsx`, and `FriendshipListSkeleton.tsx` following exact 1:1 styling from `FriendshipListView.swift`. Export from `src/components/chat/index.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ../checked-nextjs && npx vitest run src/components/chat/__tests__/`  
Expected: All component tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/
git commit -m "feat(chat): implement messages hub UI components and unit tests"
```

---

### Task 6: Chat Room UI Components

**Files:**
- Create: `src/components/chat/ChatRoomTopBar.tsx`
- Create: `src/components/chat/ChatBubble.tsx`
- Create: `src/components/chat/PartnerTypingBubble.tsx`
- Create: `src/components/chat/ChatInputBar.tsx`
- Create: `src/components/chat/ChatMessagesSkeleton.tsx`
- Tests: `src/components/chat/__tests__/chat-bubble.test.tsx`, `src/components/chat/__tests__/chat-input-bar.test.tsx`, `src/components/chat/__tests__/chat-room-top-bar.test.tsx`

**Interfaces:**
- Consumes: `MessageResponse`, `PartnerTypingBubble`, Lucide icons (`Send`, `X`, `ChevronLeft`, `MoreVertical`, `CornerUpLeft`, `Trash2`, `RotateCcw`), Framer Motion
- Produces: Complete chat room UI primitives.

- [ ] **Step 1: Write failing component tests**

Test `ChatRoomTopBar` displays back button, partner avatar, display name, and typing status when `isTyping === true`.  
Test `ChatBubble` applies right alignment for `isMine={true}` and left alignment for `isMine={false}`, renders reply quote when present, and supports reply action.  
Test `ChatInputBar` handles text typing, trims input on send, displays reply preview box with cancel button, and triggers `onSend`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ../checked-nextjs && npx vitest run src/components/chat/__tests__/chat-bubble.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement components**

Implement `ChatRoomTopBar.tsx`, `ChatBubble.tsx`, `PartnerTypingBubble.tsx`, `ChatInputBar.tsx`, and `ChatMessagesSkeleton.tsx` mirroring `ChatView.swift` and `ChatInputBar.swift`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ../checked-nextjs && npx vitest run src/components/chat/__tests__/`  
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/
git commit -m "feat(chat): implement 1-on-1 chat room UI components and unit tests"
```

---

### Task 7: Messages Hub Page Integration (`/messages`)

**Files:**
- Create: `src/app/messages/page.tsx`
- Modify: `src/app/friends/page.tsx` (redirect to `/messages`)
- Test: `src/app/messages/__tests__/messages-page.test.tsx`

**Interfaces:**
- Consumes: `useConversations`, `useFriendships`, `MessagesTopBar`, `FriendRequestsBanner`, `CloseFriendsQuotaBar`, `FriendChatRow`, `FriendshipListSkeleton`
- Produces: Working `/messages` page with pull-to-refresh and direct navigation to `/messages/[friendId]`.

- [ ] **Step 1: Write the failing tests for `messages-page.test.tsx`**

```typescript
// src/app/messages/__tests__/messages-page.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessagesPage from '../page';
import * as useConversationsHook from '@/hooks/useConversations';
import * as useFriendshipsHook from '@/hooks/useFriendships';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}));

vi.mock('@/hooks/useConversations');
vi.mock('@/hooks/useFriendships');

describe('MessagesPage (/messages)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFriendshipsHook.useFriendships).mockReturnValue({
      receivedCount: 3,
      receivedRequests: [{ id: 'req1', sender: { id: 's1', avatarUrl: null, displayName: 'Sender 1' } }],
      quota: { currentCount: 5, maxLimit: 20, isGoldMember: false, remainingSlots: 15 },
    } as any);
  });

  it('renders skeleton view when loading', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [],
      isLoading: true,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    expect(screen.getByTestId('friendship-list-skeleton')).toBeInTheDocument();
  });

  it('renders friends list and navigates to chat on row click', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [
        {
          friend: { id: 'f-1', displayName: 'Alice', username: 'alice', avatarUrl: null },
          conversation: { id: 'c-1', unreadCount: 1, lastMessage: { content: 'See you!' } },
          unreadCount: 1,
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('See you!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Alice'));
    expect(mockPush).toHaveBeenCalledWith('/messages/f-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../checked-nextjs && npx vitest run src/app/messages/__tests__/messages-page.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement `src/app/messages/page.tsx` and update `src/app/friends/page.tsx`**

Integrate top bar, banner, quota bar, and friend chat rows with empty state ("Chưa có bạn bè nào" with button to `/invite`). Update `src/app/friends/page.tsx` to redirect to `/messages`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ../checked-nextjs && npx vitest run src/app/messages/__tests__/messages-page.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/messages/page.tsx src/app/friends/page.tsx src/app/messages/__tests__/messages-page.test.tsx
git commit -m "feat(messages): integrate messages & friends hub page with routing"
```

---

### Task 8: 1-on-1 Chat Room Page Integration (`/messages/[id]`)

**Files:**
- Create: `src/app/messages/[id]/page.tsx`
- Test: `src/app/messages/[id]/__tests__/chat-room-page.test.tsx`

**Interfaces:**
- Consumes: `useChat`, `ChatRoomTopBar`, `ChatBubble`, `PartnerTypingBubble`, `ChatInputBar`, `ChatMessagesSkeleton`
- Produces: Fully interactive 1-on-1 chat room with auto-scroll and reverse cursor pagination.

- [ ] **Step 1: Write the failing tests for `chat-room-page.test.tsx`**

```typescript
// src/app/messages/[id]/__tests__/chat-room-page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatRoomPage from '../page';
import * as useChatHook from '@/hooks/useChat';

const mockBack = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useParams: () => ({ id: 'f-bob' }),
}));

vi.mock('@/hooks/useChat');

describe('ChatRoomPage (/messages/[id])', () => {
  const mockSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat skeleton while loading initial messages', () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: null,
      messages: [],
      isLoadingInitial: true,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: vi.fn(),
      deleteMessage: vi.fn(),
      replyingToMessage: null,
      setReplyingToMessage: vi.fn(),
      sendTyping: vi.fn(),
    } as any);

    render(<ChatRoomPage />);
    expect(screen.getByTestId('chat-messages-skeleton')).toBeInTheDocument();
  });

  it('renders conversation messages and handles message send', async () => {
    vi.mocked(useChatHook.useChat).mockReturnValue({
      conversation: { id: 'c1', partner: { id: 'f-bob', displayName: 'Bob', username: 'bob' } },
      messages: [
        { id: 'm1', content: 'Hey Bob!', senderId: 'u-me', sentAt: '2026-11-07T12:00:00Z', type: 'TEXT' },
      ],
      isLoadingInitial: false,
      isLoadingMore: false,
      hasMore: false,
      isPartnerTyping: false,
      sendMessage: mockSendMessage,
      loadMoreMessages: vi.fn(),
      deleteMessage: vi.fn(),
      replyingToMessage: null,
      setReplyingToMessage: vi.fn(),
      sendTyping: vi.fn(),
    } as any);

    render(<ChatRoomPage />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Hey Bob!')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    fireEvent.change(input, { target: { value: 'How are you?' } });
    fireEvent.click(screen.getByTestId('send-message-button'));

    expect(mockSendMessage).toHaveBeenCalledWith('How are you?');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../checked-nextjs && npx vitest run src/app/messages/[id]/__tests__/chat-room-page.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement `src/app/messages/[id]/page.tsx`**

Integrate `useChat({ targetId: id })`, `ChatRoomTopBar`, message viewport with `overflow-y-auto`, `ChatBubble` iteration, `PartnerTypingBubble`, and `ChatInputBar`. Auto scroll to bottom anchor on load and on message count change.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ../checked-nextjs && npx vitest run src/app/messages/[id]/__tests__/chat-room-page.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/messages/[id]/
git commit -m "feat(chat): implement 1-on-1 chat room page and integration tests"
```

---

### Task 9: Home Top Bar Realtime Badge Sync & Full Suite Verification

**Files:**
- Modify: `src/app/page.tsx`
- Test: `src/app/__tests__/home-chat-badge.test.tsx`

**Interfaces:**
- Consumes: `useConversations` unread total
- Produces: Live badge count in `HomeTopBar` (`chatBadgeCount={unreadTotal}`).

- [ ] **Step 1: Write test for Home chat badge integration**

Verify `HomeTopBar` receives dynamic unread badge count from `useConversations`.

- [ ] **Step 2: Update `src/app/page.tsx`**

Import `useConversations` and pass `unreadTotal` to `HomeTopBar chatBadgeCount={unreadTotal}`.

- [ ] **Step 3: Run the full test suite**

Run: `cd ../checked-nextjs && npm test`  
Expected: All test suites (existing 85 + new test suites) pass cleanly.

- [ ] **Step 4: Run production build check**

Run: `cd ../checked-nextjs && npm run build`  
Expected: Build succeeds without TypeScript or ESLint errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/__tests__/home-chat-badge.test.tsx
git commit -m "feat(home): synchronize realtime chat badge count on home top bar"
```
