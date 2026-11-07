'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useFriendships } from '@/hooks/useFriendships';
import {
  MessagesTopBar,
  FriendRequestsBanner,
  FriendChatRow,
  FriendshipListSkeleton,
} from '@/components/chat';
import { CloseFriendsQuotaBar } from '@/components/friendship';
import { haptics } from '@/lib/utils/haptics';

/**
 * Màn hình Trung tâm Tin nhắn & Bạn bè (/messages)
 * Chuẩn 1:1 Parity với FriendshipListView.swift trên iOS
 * - Header Bar Flat với nút Back 44px và nút Thêm bạn kèm chấm đỏ
 * - Banner Lời mời kết bạn nổi bật FriendRequestsBanner
 * - Thanh hạn mức bạn bè CloseFriendsQuotaBar
 * - Phân cách tiêu đề TIN NHẮN & BẠN BÈ
 * - Danh sách hàng bạn bè FriendChatRow
 * - Trạng thái trống (Empty State) và Skeleton Shimmer
 * - Nguyên tắc thiết kế: Zero Border, Zero Shadow
 */
export default function MessagesPage() {
  const router = useRouter();

  const { items, isLoading } = useConversations();
  const { receivedCount, receivedRequests, quota } = useFriendships();

  // Xử lý quay lại: nếu có history -> back, nếu không -> về trang chủ '/'
  const handleBack = useCallback(() => {
    haptics.click();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  // Điều hướng sang trang Mời bạn bè
  const handleAddFriend = useCallback(() => {
    haptics.click();
    router.push('/invite');
  }, [router]);

  // Điều hướng sang Trung tâm Lời mời kết bạn
  const handleOpenRequests = useCallback(() => {
    haptics.click();
    router.push('/friends/requests');
  }, [router]);

  // Điều hướng vào phòng chat 1-on-1
  const handleRowClick = useCallback(
    (friendId: string) => {
      router.push(`/messages/${friendId}`);
    },
    [router]
  );

  // Điều hướng xem trang cá nhân bạn bè
  const handleAvatarClick = useCallback(
    (username: string) => {
      router.push(`/u/${username}`);
    },
    [router]
  );

  // Trạng thái đang tải dữ liệu ban đầu
  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-[#EDE9DF] text-text-primary select-none flex flex-col items-center">
        <main
          data-testid="messages-hub-page"
          className="w-full max-w-md mx-auto flex flex-col min-h-screen relative"
        >
          <FriendshipListSkeleton />
        </main>
      </div>
    );
  }

  // Đảm bảo dữ liệu quota an toàn
  const safeQuota = quota
    ? {
        ...quota,
        progress:
          quota.progress ??
          (quota.maxLimit > 0
            ? Math.min(1, quota.currentCount / quota.maxLimit)
            : 0),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-[#EDE9DF] text-text-primary select-none flex flex-col items-center">
      <main
        data-testid="messages-hub-page"
        className="w-full max-w-md mx-auto flex flex-col min-h-screen relative"
      >
        {/* 1. Header Bar Flat */}
        <MessagesTopBar
          onBack={handleBack}
          onAddFriend={handleAddFriend}
          pendingRequestsCount={receivedCount}
        />

        {/* 2. Nội dung cuộn chính */}
        <div className="flex-1 px-4 space-y-3.5 pb-8 overflow-y-auto">
          {/* Banner Lời mời kết bạn nổi bật */}
          <FriendRequestsBanner
            pendingRequestsCount={receivedCount}
            pendingRequesters={receivedRequests}
            onClick={handleOpenRequests}
          />

          {/* Thanh hạn mức bạn bè thân thiết */}
          {safeQuota && (
            <CloseFriendsQuotaBar
              quota={safeQuota}
              isCompact={true}
              onUpgradeTap={handleOpenRequests}
            />
          )}

          {/* 3. Danh sách hoặc Empty State */}
          {items.length === 0 ? (
            <div
              data-testid="empty-friends-state"
              className="bg-surface rounded-[24px] p-8 flex flex-col items-center justify-center text-center gap-3 mt-4"
            >
              <div className="w-16 h-16 rounded-full bg-[#DFDACD]/50 flex items-center justify-center text-text-primary mb-1">
                <Users size={32} strokeWidth={1.8} />
              </div>
              <h3 className="font-display font-bold text-[18px] text-text-primary">
                Chưa có bạn bè nào
              </h3>
              <p className="text-[13px] text-text-secondary max-w-xs leading-relaxed">
                Hãy kết nối với bạn bè để bắt đầu trò chuyện và chia sẻ khoảnh khắc cùng nhau!
              </p>
              <button
                type="button"
                onClick={handleAddFriend}
                data-testid="empty-invite-btn"
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-black font-display font-bold text-[14px] active:scale-95 transition-transform"
              >
                <UserPlus size={16} strokeWidth={2.2} />
                <span>Thêm bạn ngay</span>
              </button>
            </div>
          ) : (
            <>
              {/* Phân cách tiêu đề */}
              <div className="flex items-center pt-1.5 px-1">
                <span className="text-[11px] font-bold text-text-secondary tracking-wider">
                  TIN NHẮN & BẠN BÈ
                </span>
              </div>

              {/* Danh sách bạn bè & tin nhắn */}
              <div data-testid="friend-chat-list" className="space-y-2.5">
                {items.map((item) => (
                  <FriendChatRow
                    key={item.friend.id}
                    item={item}
                    onClick={() => handleRowClick(item.friend.id)}
                    onAvatarClick={() => handleAvatarClick(item.friend.username)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
