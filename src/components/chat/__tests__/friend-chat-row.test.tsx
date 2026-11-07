import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FriendChatRow } from '../FriendChatRow';
import type { FriendChatItem } from '@/types/chat';

describe('FriendChatRow Component', () => {
  const baseItem: FriendChatItem = {
    friend: {
      id: 'friend-1',
      username: 'johndoe',
      displayName: 'John Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
      isGoldMember: false,
    },
    conversation: {
      id: 'conv-1',
      participantIds: ['me', 'friend-1'],
      partner: {
        id: 'friend-1',
        username: 'johndoe',
        displayName: 'John Doe',
        isOnline: false,
      },
      lastMessage: {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'friend-1',
        type: 'TEXT',
        content: 'Hôm nay thế nào rồi?',
        sentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      unreadCount: 0,
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    lastActivityDate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    unreadCount: 0,
  };

  it('renders friend displayName, username, and last message content', () => {
    render(<FriendChatRow item={baseItem} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
    expect(screen.getByText('Hôm nay thế nào rồi?')).toBeInTheDocument();
  });

  it('renders fallback initial when friend has no avatarUrl', () => {
    const itemWithoutAvatar: FriendChatItem = {
      ...baseItem,
      friend: {
        ...baseItem.friend,
        avatarUrl: null,
        displayName: 'Minh Hoàng',
      },
    };

    render(<FriendChatRow item={itemWithoutAvatar} />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('renders gold crown icon when friend isGoldMember is true', () => {
    const goldItem: FriendChatItem = {
      ...baseItem,
      friend: {
        ...baseItem.friend,
        isGoldMember: true,
      },
    };

    render(<FriendChatRow item={goldItem} />);
    expect(screen.getByTestId('gold-crown-icon')).toBeInTheDocument();
  });

  it('renders online indicator dot when partner is online', () => {
    const onlineItem: FriendChatItem = {
      ...baseItem,
      conversation: {
        ...baseItem.conversation!,
        partner: {
          ...baseItem.conversation!.partner,
          isOnline: true,
        },
      },
    };

    render(<FriendChatRow item={onlineItem} />);
    expect(screen.getByTestId('online-indicator')).toBeInTheDocument();
  });

  it('renders "Chưa có tin nhắn nào" when conversation has no lastMessage', () => {
    const emptyConversationItem: FriendChatItem = {
      ...baseItem,
      conversation: {
        ...baseItem.conversation!,
        lastMessage: null,
      },
    };

    render(<FriendChatRow item={emptyConversationItem} />);
    expect(screen.getByText('Chưa có tin nhắn nào')).toBeInTheDocument();
  });

  it('renders "Tin nhắn đã được thu hồi" when lastMessage is revoked', () => {
    const revokedItem: FriendChatItem = {
      ...baseItem,
      conversation: {
        ...baseItem.conversation!,
        lastMessage: {
          id: 'msg-revoked',
          conversationId: 'conv-1',
          senderId: 'friend-1',
          type: 'SYSTEM',
          content: 'Tin nhắn đã thu hồi',
          isRevoked: true,
          sentAt: new Date().toISOString(),
        },
      },
    };

    render(<FriendChatRow item={revokedItem} />);
    expect(screen.getByText('Tin nhắn đã được thu hồi')).toBeInTheDocument();
  });

  it('renders "📷 Đã phản hồi một ảnh" when lastMessage has photoContext or PHOTO_REACTION type', () => {
    const photoItem: FriendChatItem = {
      ...baseItem,
      conversation: {
        ...baseItem.conversation!,
        lastMessage: {
          id: 'msg-photo',
          conversationId: 'conv-1',
          senderId: 'friend-1',
          type: 'PHOTO_REACTION',
          content: '',
          sentAt: new Date().toISOString(),
        },
      },
    };

    render(<FriendChatRow item={photoItem} />);
    expect(screen.getByText('📷 Đã phản hồi một ảnh')).toBeInTheDocument();
  });

  it('renders unread badge capsule when unreadCount > 0', () => {
    const unreadItem: FriendChatItem = {
      ...baseItem,
      unreadCount: 4,
    };

    render(<FriendChatRow item={unreadItem} />);
    const badge = screen.getByTestId('unread-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('4');
  });

  it('does not render unread badge when unreadCount is 0', () => {
    render(<FriendChatRow item={baseItem} />);
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });

  it('triggers onClick callback when row is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<FriendChatRow item={baseItem} onClick={handleClick} />);
    const row = screen.getByTestId('friend-chat-row');
    await user.click(row);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onAvatarClick without triggering row onClick when avatar is clicked', async () => {
    const handleClick = vi.fn();
    const handleAvatarClick = vi.fn();
    const user = userEvent.setup();

    render(
      <FriendChatRow
        item={baseItem}
        onClick={handleClick}
        onAvatarClick={handleAvatarClick}
      />
    );

    const avatarBtn = screen.getByRole('button', { name: /Xem hồ sơ John Doe/i });
    await user.click(avatarBtn);

    expect(handleAvatarClick).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<FriendChatRow item={baseItem} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
