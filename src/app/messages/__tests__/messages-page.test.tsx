import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessagesPage from '../page';
import * as useConversationsHook from '@/hooks/useConversations';
import * as useFriendshipsHook from '@/hooks/useFriendships';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

vi.mock('@/hooks/useConversations');
vi.mock('@/hooks/useFriendships');

describe('MessagesPage (/messages)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFriendshipsHook.useFriendships).mockReturnValue({
      receivedCount: 3,
      receivedRequests: [
        {
          id: 'req1',
          sender: { id: 's1', avatarUrl: null, displayName: 'Sender 1' },
        },
      ],
      quota: {
        currentCount: 5,
        maxLimit: 20,
        isGoldMember: false,
        remainingSlots: 15,
        isNearLimit: false,
        isAtLimit: false,
        progress: 0.25,
      },
    } as any);
  });

  it('renders skeleton view when loading and items are empty', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [],
      isLoading: true,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    expect(screen.getByTestId('friendship-list-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('messages-hub-page').className).not.toContain('p-4');
  });

  it('renders empty state when items are empty and not loading', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    expect(screen.getByText('Chưa có bạn bè nào')).toBeInTheDocument();

    const inviteBtn = screen.getByTestId('empty-invite-btn');
    fireEvent.click(inviteBtn);
    expect(mockPush).toHaveBeenCalledWith('/invite');
  });

  it('renders friends list and navigates to chat on row click', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [
        {
          friend: {
            id: 'f-1',
            displayName: 'Alice',
            username: 'alice',
            avatarUrl: null,
          },
          conversation: {
            id: 'c-1',
            unreadCount: 1,
            lastMessage: { content: 'See you!' },
          },
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

  it('navigates to user profile on avatar click', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [
        {
          friend: {
            id: 'f-1',
            displayName: 'Alice',
            username: 'alice',
            avatarUrl: null,
          },
          conversation: null,
          unreadCount: 0,
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    const avatarBtn = screen.getByRole('button', { name: /xem hồ sơ alice/i });
    fireEvent.click(avatarBtn);
    expect(mockPush).toHaveBeenCalledWith('/u/alice');
  });

  it('navigates to /invite on add friend top bar button click', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    const addFriendTopBtn = screen.getByRole('button', { name: 'Thêm bạn' });
    fireEvent.click(addFriendTopBtn);
    expect(mockPush).toHaveBeenCalledWith('/invite');
  });

  it('navigates to /friends/requests on friend requests banner click', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [
        {
          friend: {
            id: 'f-1',
            displayName: 'Alice',
            username: 'alice',
            avatarUrl: null,
          },
          conversation: null,
          unreadCount: 0,
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    const banner = screen.getByRole('button', { name: /lời mời kết bạn/i });
    fireEvent.click(banner);
    expect(mockPush).toHaveBeenCalledWith('/friends/requests');
  });

  it('renders section header "TIN NHẮN & BẠN BÈ" and CloseFriendsQuotaBar', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [
        {
          friend: {
            id: 'f-1',
            displayName: 'Alice',
            username: 'alice',
            avatarUrl: null,
          },
          conversation: null,
          unreadCount: 0,
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    expect(screen.getByText('TIN NHẮN & BẠN BÈ')).toBeInTheDocument();
    expect(screen.getByText('5/20')).toBeInTheDocument();
  });

  it('handles back button navigation', () => {
    vi.mocked(useConversationsHook.useConversations).mockReturnValue({
      items: [],
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    render(<MessagesPage />);
    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);
    expect(mockPush.mock.calls.length + mockBack.mock.calls.length).toBeGreaterThan(0);
  });
});
