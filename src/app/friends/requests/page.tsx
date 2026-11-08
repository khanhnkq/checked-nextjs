'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle, XCircle, Inbox, Send, Crown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useFriendships } from '@/hooks/useFriendships';
import { haptics } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';
import {
  CloseFriendsQuotaBar,
  FriendRequestCard,
  FriendRequestsSkeleton,
  MutualFriendsSheet,
} from '@/components/friendship';
import type { FriendRequestItem, SentFriendRequestItem } from '@/types/friendship';

/**
 * Màn hình Trung tâm Lời mời kết bạn (/friends/requests)
 * Chuẩn 1:1 Parity với FriendRequestsView.swift trên iOS
 * - Header Bar Flat với nút tròn Back 44px
 * - Custom Segmented Control Tab Đã nhận / Đã gửi
 * - Thanh hạn mức bạn thân CloseFriendsQuotaBar
 * - Thanh thao tác hàng loạt Batch Action Bar (Chấp nhận tất cả / Từ chối hết)
 * - Thẻ lời mời kết bạn FriendRequestCard
 * - Modal danh sách bạn chung MutualFriendsSheet
 * - Nguyên tắc thiết kế: Zero Border, Zero Shadow
 */
export default function FriendRequestsPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  const [selectedTab, setSelectedTab] = useState<'received' | 'sent'>('received');
  const [actionInProgressIds, setActionInProgressIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [showGoldModal, setShowGoldModal] = useState<boolean>(false);
  const [selectedMutualTarget, setSelectedMutualTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  // Hook điều phối quan hệ bạn bè
  const {
    receivedRequests,
    sentRequests,
    receivedCount,
    sentCount,
    quota,
    isLoading,
    acceptRequest,
    declineRequest,
    cancelRequest,
    acceptAll,
    declineAll,
  } = useFriendships({ enabled: Boolean(isAuthenticated) });

  // Route Guard: Nếu đã hydrate xong mà chưa đăng nhập -> chuyển hướng sang /login
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login?redirect=/friends/requests');
    }
  }, [isHydrated, isAuthenticated, router]);

  // Xử lý quay lại: nếu có history -> back, nếu không -> về profile
  const handleBack = useCallback(() => {
    haptics.light();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile');
    }
  }, [router]);

  // Chuyển đổi tab kèm phản hồi rung
  const handleTabChange = useCallback(
    (tab: 'received' | 'sent') => {
      if (tab !== selectedTab) {
        haptics.light();
        setSelectedTab(tab);
      }
    },
    [selectedTab]
  );

  // Thao tác đơn lẻ
  const handleAccept = useCallback(
    async (friendshipId: string) => {
      setActionInProgressIds((prev) => new Set(prev).add(friendshipId));
      try {
        await acceptRequest(friendshipId);
      } finally {
        setActionInProgressIds((prev) => {
          const next = new Set(prev);
          next.delete(friendshipId);
          return next;
        });
      }
    },
    [acceptRequest]
  );

  const handleDecline = useCallback(
    async (friendshipId: string) => {
      setActionInProgressIds((prev) => new Set(prev).add(friendshipId));
      try {
        await declineRequest(friendshipId);
      } finally {
        setActionInProgressIds((prev) => {
          const next = new Set(prev);
          next.delete(friendshipId);
          return next;
        });
      }
    },
    [declineRequest]
  );

  const handleCancelSent = useCallback(
    async (friendshipId: string) => {
      setActionInProgressIds((prev) => new Set(prev).add(friendshipId));
      try {
        await cancelRequest(friendshipId);
      } finally {
        setActionInProgressIds((prev) => {
          const next = new Set(prev);
          next.delete(friendshipId);
          return next;
        });
      }
    },
    [cancelRequest]
  );

  // Thao tác hàng loạt
  const handleAcceptAll = useCallback(async () => {
    setIsBatchProcessing(true);
    try {
      await acceptAll();
    } finally {
      setIsBatchProcessing(false);
    }
  }, [acceptAll]);

  const handleDeclineAll = useCallback(async () => {
    setIsBatchProcessing(true);
    try {
      await declineAll();
    } finally {
      setIsBatchProcessing(false);
    }
  }, [declineAll]);

  // Danh sách hiện tại phụ thuộc vào tab
  const currentList = useMemo<(FriendRequestItem | SentFriendRequestItem)[]>(() => {
    return selectedTab === 'received' ? receivedRequests : sentRequests;
  }, [selectedTab, receivedRequests, sentRequests]);

  // Trạng thái chờ Hydration từ LocalStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#EDE9DF] flex flex-col items-center">
        <div
          data-testid="requests-loading-skeleton"
          className="w-full max-w-md mx-auto flex flex-col min-h-screen relative p-4"
        >
          <FriendRequestsSkeleton />
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập (đang chờ router.replace)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#EDE9DF] text-text-primary select-none flex flex-col items-center">
      <main
        data-testid="friend-requests-page"
        className="w-full max-w-md mx-auto flex flex-col min-h-screen relative pt-safe"
      >
        {/* 1. Header Bar Flat */}
      <header className="flex items-center gap-3 px-4 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={handleBack}
          data-testid="requests-back-btn"
          aria-label="Quay lại"
          className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="text-text-primary" />
        </button>

        <h1 className="text-[22px] font-bold font-display text-text-primary">
          Lời mời kết bạn
        </h1>
      </header>

      {/* 2. Custom Segmented Control */}
      <section className="px-4 pt-1 pb-3 shrink-0">
        <div className="bg-[#DFDACD]/60 p-1 rounded-[16px] flex items-center gap-1.5">
          {/* Tab Đã nhận */}
          <button
            type="button"
            onClick={() => handleTabChange('received')}
            data-testid="tab-received"
            aria-selected={selectedTab === 'received'}
            className={cn(
              'flex-1 h-[38px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]',
              selectedTab === 'received'
                ? 'bg-surface text-text-primary font-bold'
                : 'text-text-secondary font-semibold hover:text-text-primary'
            )}
          >
            <span className="text-[14px]">Đã nhận</span>
            {receivedCount > 0 && (
              <span
                data-testid="received-badge"
                className={cn(
                  'text-[11px] font-black px-1.5 py-0.5 rounded-full leading-none',
                  selectedTab === 'received'
                    ? 'bg-error text-white'
                    : 'bg-[#DFDACD] text-text-primary'
                )}
              >
                {receivedCount}
              </span>
            )}
          </button>

          {/* Tab Đã gửi */}
          <button
            type="button"
            onClick={() => handleTabChange('sent')}
            data-testid="tab-sent"
            aria-selected={selectedTab === 'sent'}
            className={cn(
              'flex-1 h-[38px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]',
              selectedTab === 'sent'
                ? 'bg-surface text-text-primary font-bold'
                : 'text-text-secondary font-semibold hover:text-text-primary'
            )}
          >
            <span className="text-[14px]">Đã gửi</span>
            {sentCount > 0 && (
              <span
                data-testid="sent-badge"
                className="text-[11px] font-black px-1.5 py-0.5 rounded-full leading-none bg-[#DFDACD] text-text-primary"
              >
                {sentCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* 3. Nội dung cuộn chính */}
      <div className="flex-1 px-4 space-y-3.5 pb-8 overflow-y-auto">
        {/* Close Friends Quota Bar */}
        <CloseFriendsQuotaBar
          quota={quota}
          onUpgradeTap={() => {
            haptics.light();
            setShowGoldModal(true);
          }}
        />

        {/* Batch Action Bar (Chỉ hiển thị ở Tab Đã nhận khi có từ 2 lời mời trở lên) */}
        {selectedTab === 'received' && receivedRequests.length >= 2 && (
          <div data-testid="batch-action-bar" className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleAcceptAll}
              disabled={isBatchProcessing}
              data-testid="accept-all-btn"
              className="flex-1 h-[38px] bg-primary text-black rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
            >
              <CheckCircle size={15} strokeWidth={2.4} />
              <span>Chấp nhận tất cả</span>
            </button>

            <button
              type="button"
              onClick={handleDeclineAll}
              disabled={isBatchProcessing}
              data-testid="decline-all-btn"
              className="flex-1 h-[38px] bg-surface text-text-secondary rounded-[12px] text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
            >
              <XCircle size={15} strokeWidth={2.2} />
              <span>Từ chối hết</span>
            </button>
          </div>
        )}

        {/* Content List */}
        {isLoading && currentList.length === 0 ? (
          <FriendRequestsSkeleton cardsCount={3} />
        ) : currentList.length === 0 ? (
          /* Empty State */
          selectedTab === 'received' ? (
            <div
              data-testid="empty-received-state"
              className="py-14 flex flex-col items-center justify-center text-center gap-2"
            >
              <Inbox size={42} strokeWidth={1.5} className="text-text-secondary/40 mb-1" />
              <h3 className="text-[17px] font-bold text-text-primary">
                Không có lời mời nào
              </h3>
              <p className="text-[14px] text-text-secondary max-w-xs leading-relaxed px-4">
                Khi người khác gửi lời mời kết bạn, bạn sẽ thấy ở đây
              </p>
            </div>
          ) : (
            <div
              data-testid="empty-sent-state"
              className="py-14 flex flex-col items-center justify-center text-center gap-2"
            >
              <Send size={42} strokeWidth={1.5} className="text-text-secondary/40 mb-1" />
              <h3 className="text-[17px] font-bold text-text-primary">
                Chưa gửi lời mời nào
              </h3>
              <p className="text-[14px] text-text-secondary max-w-xs leading-relaxed px-4">
                Bạn có thể chia sẻ liên kết hoặc quét mã QR để kết bạn mới
              </p>
              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  router.push('/invite');
                }}
                data-testid="invite-friends-btn"
                className="mt-3 px-5 py-2.5 rounded-full bg-primary text-black font-bold text-[14px] active:scale-95 transition-transform"
              >
                Mời bạn bè
              </button>
            </div>
          )
        ) : (
          /* Danh sách thẻ lời mời */
          <div data-testid="requests-list" className="space-y-2.5">
            {currentList.map((item) => {
              const targetUser = 'requester' in item ? item.requester : item.targetUser;
              return (
                <FriendRequestCard
                  key={item.friendshipId}
                  item={item}
                  tab={selectedTab}
                  isLoadingAction={actionInProgressIds.has(item.friendshipId)}
                  onAccept={() => handleAccept(item.friendshipId)}
                  onDecline={() => handleDecline(item.friendshipId)}
                  onCancelSent={() => handleCancelSent(item.friendshipId)}
                  onTapAvatar={() => {
                    haptics.light();
                    router.push(`/u/${targetUser.username}`);
                  }}
                  onTapMutualFriends={
                    'mutualFriendsCount' in item &&
                    item.mutualFriendsCount !== undefined &&
                    item.mutualFriendsCount > 0
                      ? () => {
                          haptics.light();
                          setSelectedMutualTarget({
                            userId: targetUser.id,
                            name: targetUser.displayName || targetUser.username,
                          });
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Mutual Friends Sheet */}
      {selectedMutualTarget && (
        <MutualFriendsSheet
          isOpen={Boolean(selectedMutualTarget)}
          onClose={() => setSelectedMutualTarget(null)}
          targetUserId={selectedMutualTarget.userId}
          targetName={selectedMutualTarget.name}
          onSelectFriend={(friend) => {
            setSelectedMutualTarget(null);
            router.push(`/u/${friend.username}`);
          }}
        />
      )}

      {/* 5. Gold Member Info Dialog Modal */}
      {showGoldModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        >
          <div className="bg-surface rounded-[24px] p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 text-[#FFD700] mx-auto flex items-center justify-center">
              <Crown size={24} className="fill-[#FFD700]" />
            </div>
            <h3 className="text-[18px] font-bold text-text-primary">Checked GOLD</h3>
            <p className="text-[14px] text-text-secondary leading-relaxed">
              Tính năng Checked GOLD cho phép bạn kết bạn lên tới 100 người, gắn huy hiệu Vương miện độc quyền và nhiều tiện ích cao cấp khác.
            </p>
            <button
              type="button"
              onClick={() => setShowGoldModal(false)}
              className="w-full h-11 rounded-[14px] bg-primary text-black font-bold text-[15px] active:scale-95 transition-transform"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </main>
  </div>
);
}
