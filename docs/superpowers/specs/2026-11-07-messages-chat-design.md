# Design Specification: Friends List & Realtime 1-on-1 Chat (`/messages` & `/messages/[id]`)

> **Document Path**: `docs/superpowers/specs/2026-11-07-messages-chat-design.md`  
> **Target Project**: `checked-nextjs` (Next.js 15+ App Router, Tailwind CSS v4, React 19)  
> **Source Parity**: `checked-ios` (`FriendshipListView.swift`, `ChatView.swift`, `ChatInputBar.swift`, `ChatBubble.swift`) & `checked-backend` (`ChatController.java`, `ChatWebSocketController.java`)  
> **Status**: Draft for Builder Check

---

## 1. Intent & The "Why"

In Checked (Locket-style personal social & financial app), friendship and direct messaging are closely intertwined. Users share intimate moments, split restaurant bills, and track mutual calories with their closest circle of friends (capped at 20 close friends).

The primary goal of this feature is to deliver a warm, instantaneous, and friction-free communication channel:
1. Users need a single unified hub (`/messages`) where they see all their close friends, unread message counts, pending friend requests, and last message previews at a glance.
2. Users need a snappy, tactile 1-on-1 chat room (`/messages/[id]`) with real-time delivery via STOMP WebSocket, typing indicators, quote replies, and message revocation.
3. The experience must achieve **1:1 visual and functional parity** with `checked-ios` while adhering to web responsive best practices and resilient offline/reconnect fallback.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
- **Unified Friends & Chat Hub (`/messages`)**:
  - Top bar with 44x44 circular Back button, title `"Tin nhắn"`, and 44x44 circular `"Thêm bạn"` (`person.badge.plus.fill` / Lucide `UserPlus`) button with a red badge dot if there are pending incoming friend requests.
  - Highlight banner for `"Lời mời kết bạn"` displaying the pending count, overlapping avatar previews of requesters, and one-tap navigation to `/friends/requests`.
  - Close friends quota bar (`CloseFriendsQuotaBar`) displaying current capacity (e.g., `12/20 Bạn thân`).
  - Merged list of friends and conversations (`FriendChatItem`):
    - Friend avatar (with fallback initials and status dot).
    - Display name and `@username`.
    - Last message snippet (or `"Chưa có tin nhắn nào"` / `"Bắt đầu cuộc trò chuyện"`).
    - Formatted timestamp (e.g., `"Vừa xong"`, `"14:32"`, `"Hôm qua"`, `"24 thg 10"`).
    - Unread badge capsule (`unreadCount > 0`).
    - Clicking any friend opens the 1-on-1 chat room `/messages/[id]`.
  - Empty state (`"Chưa có bạn bè nào"` with CTA to `/invite`).
  - Skeleton loading view (`FriendshipListSkeleton`).
  - Real-time unread badge synchronization across `/`, `/messages`, and `/messages/[id]`.
- **1-on-1 Realtime Chat Room (`/messages/[id]`)**:
  - Dynamic ID resolution: support either `conversationId` or `friendId` (automatically calls `POST /api/v1/conversations` to get or create if a conversation does not exist yet).
  - Top bar: Circular 44x44 Back button (returns to `/messages`), Friend avatar, Display Name, `@username` (clicking profile header navigates to `/u/[username]`), and live typing indicator subtitle (`"đang soạn tin..."`).
  - Scrollable message viewport:
    - Cursor-based reverse pagination (`before` timestamp, `limit=30`).
    - `"Tải thêm tin nhắn cũ"` button or pull-down sentinel at the top.
    - Auto-scroll to the bottom upon entering the room or when a new message arrives.
    - Message bubble (`ChatBubble`):
      - `isMine`: Right-aligned, warm surface with subtle border.
      - Partner: Left-aligned, crisp white surface.
      - Timestamps (`HH:mm`).
      - Reply quote bubble preview when `replyToMessageId` is present.
      - Photo thumbnail context preview if message references a moment photo.
      - Action menu (Reply, Revoke for everyone if `isMine`, Delete for me).
    - Partner typing indicator bubble: 3 pulsing animated dots.
  - Chat Input Bar (`ChatInputBar`):
    - Reply quote context bar with preview text and `(X)` cancel button.
    - Auto-growing text input.
    - Send button styled in Matcha Glow (`bg-primary`, active scale feedback).
    - Real-time typing notification emission debounced by 1.5s–2.0s to `/app/chat.typing`.
  - Auto mark-as-read: Triggers `/app/chat.read` or `PUT /api/v1/conversations/{id}/read` upon opening the chat or receiving a message while the chat is focused.
- **WebSocket STOMP Engine**:
  - `@stomp/stompjs` + `sockjs-client` configured for `/ws-chat` endpoint.
  - Automatic authentication using JWT Bearer token from `useAuthStore`.
  - Subscriptions:
    - `/user/queue/messages` (new/updated messages)
    - `/user/queue/read-receipts` (partner read events)
    - `/user/queue/typing` (partner typing events)
    - `/user/queue/errors` (exception events)
  - Seamless REST fallback when WebSocket is connecting, disconnected, or unsupported.

### 2.2 Non-Goals
- Group chats or multi-user channels (the backend and iOS domain models are strictly 1-on-1).
- Voice or video calling (WebRTC is only utilized for camera capture).
- End-to-End Encryption (E2EE) key exchange (backend persists to PostgreSQL / MongoDB with TLS).
- Media file upload directly inside chat input (photo sharing in Checked is done via camera moments feed; messages reference existing photo context).

### 2.3 Anti-Goals
- Do NOT separate Friends and Conversations into disconnected siloed tabs that require tedious cross-navigation.
- Do NOT crash or freeze UI when WebSocket connection drops; REST API fallback must keep messages legible and sendable.
- Do NOT allow unread badges to become desynchronized between `/` (Home Top Bar), `/messages` (List), and the backend `GET /api/v1/conversations/unread-total`.

---

## 3. Architecture & Approaches Considered

### 3.1 Approaches Evaluation
- **Approach A: Unified Locket-style Hub (`/messages`) + Realtime STOMP Chat (`/messages/[id]`) [SELECTED]**
  - Matches 100% of iOS `FriendshipListView` and `ChatView` architecture.
  - Combines friend roster with active conversations: every friend has a row. If there is a conversation, show the last message and unread count; if not, show `"Bắt đầu cuộc trò chuyện"`.
  - Smooth, tactile, and natural for mobile PWA and desktop web users.
- **Approach B: Isolated `/friends` page + Isolated `/messages` page [REJECTED]**
  - Confuses users because Checked is designed around a small circle of close friends (up to 20). Having to navigate between a separate friends list and an inbox causes unnecessary friction.

---

## 4. Detailed Component & System Design

### 4.1 Route Map & Canonical Identifier Resolution
- `/messages`: Main Friends & Conversations screen.
- `/messages/[id]`: 1-on-1 Chat room.
  - **Canonical Identifier**: The route parameter `[id]` is canonically the friend's **`friendId` (UUID)** (matching iOS `ChatView`, which is keyed by `friend.id`).
  - **Lifecycle on Room Mount**:
    1. The page calls `POST /api/v1/conversations` with `{ friendId: id }`. This endpoint is idempotent: it retrieves the existing conversation or creates a new one, and immediately returns the full `ConversationResponse` (containing both `conversation.id` and the complete `partner` profile: `displayName`, `username`, `avatarUrl`, `isOnline`).
    2. Once `conversation.id` is resolved, it fetches messages via `GET /api/v1/conversations/{conversationId}/messages` and connects to the STOMP WebSocket channel.
  - **Fallback Resolver**: If `[id]` is detected to be a 24-character MongoDB `conversationId` (e.g. from an external notification), the client performs a lookup in `GET /api/v1/conversations` to find the matching conversation and its partner profile.
- `/friends`: Server/Client redirect (`redirect('/messages')`).
- `/friends/requests`: Existing incoming/outgoing friend request manager (accessible from banner).

### 4.2 Data Models & TypeScript Types (`src/types/chat.ts`)
```typescript
export type MessageType = 'TEXT' | 'PHOTO_REACTION' | 'SYSTEM';

export interface PhotoContext {
  photoId: string;
  photoUrl: string;
  caption?: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  replyToMessageId?: string | null;
  photoContext?: PhotoContext | null;
  sentAt: string;
  readAt?: string | null;
  isRevoked?: boolean;
  deletedForUserIds?: string[];
}

export interface ConversationResponse {
  id: string;
  participantIds: string[];
  partner: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isOnline?: boolean;
    lastSeenAt?: string | null;
  };
  lastMessage?: MessageResponse | null;
  unreadCount: number;
  updatedAt: string;
}

export interface FriendChatItem {
  friend: FriendProfile;
  conversation?: ConversationResponse | null;
  lastActivityDate?: string | null;
  unreadCount: number;
}

export interface MessageCursorPage {
  messages: MessageResponse[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface TypingIndicatorEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReadReceiptEvent {
  conversationId: string;
  readerId: string;
  readAt: string;
}
```

### 4.3 API Client (`src/lib/api/chat-api.ts`)
- `getMyConversations(signal?: AbortSignal): Promise<ConversationResponse[]>`
- `getOrCreateConversation(friendId: string): Promise<ConversationResponse>`
- `getConversationMessages(conversationId: string, before?: string, limit?: number, signal?: AbortSignal): Promise<MessageCursorPage>`
- `sendChatMessage(conversationId: string, payload: SendMessagePayload): Promise<MessageResponse>`
- `markConversationAsRead(conversationId: string): Promise<{ conversationId: string; readAt: string }>`
- `getTotalUnreadCount(signal?: AbortSignal): Promise<{ unreadCount: number }>`
- `deleteChatMessage(conversationId: string, messageId: string, mode: 'FOR_ME' | 'FOR_EVERYONE'): Promise<void>`

### 4.4 Realtime WebSocket Service (`src/lib/realtime/stomp-client.ts` & `useChatWebSocket`)
- Singleton or React Context connection manager wrapping `@stomp/stompjs.Client` with `SockJS` factory (`/ws-chat`).
- Passes `Authorization: Bearer <token>` in `connectHeaders`.
- Auto reconnects with exponential backoff (`reconnectDelay: 5000`).
- Dispatches event listeners to subscribers:
  - `onMessage(message: MessageResponse)`
  - `onReadReceipt(event: ReadReceiptEvent)`
  - `onTyping(event: TypingIndicatorEvent)`
  - `onError(error: Error)`

### 4.5 UI Components Hierarchy

```
src/
├── app/
│   ├── messages/
│   │   ├── page.tsx                     # Friends & Messages Hub
│   │   ├── [id]/
│   │   │   └── page.tsx                 # 1-on-1 Chat Room
│   │   └── __tests__/
│   │       ├── messages-page.test.tsx
│   │       └── chat-room-page.test.tsx
├── components/
│   ├── chat/
│   │   ├── index.ts
│   │   ├── MessagesTopBar.tsx           # Back, title, Add friend button with badge
│   │   ├── FriendRequestsBanner.tsx     # Pending request count & avatar stack
│   │   ├── FriendChatRow.tsx            # Row item for friend & last message
│   │   ├── FriendshipListSkeleton.tsx   # Loading skeleton
│   │   ├── ChatRoomTopBar.tsx           # Chat header with friend info & typing status
│   │   ├── ChatBubble.tsx               # Message bubble (isMine, reply quote, context)
│   │   ├── PartnerTypingBubble.tsx      # 3 animated jumping dots
│   │   ├── ChatInputBar.tsx             # Input bar with reply quote banner & send
│   │   └── ChatMessagesSkeleton.tsx     # Chat messages loading skeleton
│   └── friendship/
│       └── CloseFriendsQuotaBar.tsx     # (Reused from existing components)
```

---

## 5. Design Tokens & Visual Specs

| Element | Specification |
| :--- | :--- |
| **Canvas Background** | `--color-canvas: #EDE9DF` (Warm Oat Milk) |
| **Surface Card** | `--color-surface: #FFFFFF` with `rounded-[24px]` or `rounded-[20px]` |
| **Circular Buttons** | `44x44px`, `rounded-full`, bg `#FFFFFF`, text `#141613`, active scale `0.95` |
| **Send Button** | `bg-[#D4EB70]` (Matcha Glow), `rounded-full`, hover `brightness-105`, active scale `0.95` |
| **Mine Bubble** | Right-aligned, bg `#FFFFFF` or `#E6F5A3`, text `#141613`, rounded `rounded-[20px] rounded-br-[6px]` |
| **Partner Bubble** | Left-aligned, bg `#FFFFFF`, text `#141613`, rounded `rounded-[20px] rounded-bl-[6px]` |
| **Unread Badge** | Pill `bg-[#FF6954]` (Coral Red), text white, text-xs bold |
| **Typing Dots** | 3 dots `bg-text-secondary/60`, bouncing scale animation |

---

## 6. What's Left to the Builder

- Framer motion spring curve parameters for chat bubbles entrance (`dampingFraction: 0.75, stiffness: 350`).
- Exact debounce timeout for typing notifications (recommended: 1800ms).
- Handling unread badge update in Home Top Bar via global cache invalidation or shared hook.
