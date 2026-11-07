'use client';

import React, { use, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Crown,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useFriendInvite } from '@/hooks/useFriendInvite';
import { haptics } from '@/lib/utils/haptics';
import type { AcceptInviteResponse } from '@/types/friendship';

interface FriendInviteAcceptContentProps {
  token: string;
}

function FriendInviteAcceptContent({ token }: FriendInviteAcceptContentProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  const [isAcceptedSuccess, setIsAcceptedSuccess] = useState<boolean>(false);
  const [acceptResult, setAcceptResult] = useState<AcceptInviteResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { preview, previewTokenQuery, acceptToken, acceptTokenMutation } =
    useFriendInvite({ token });

  // Xử lý nút Back
  const handleBack = useCallback(() => {
    haptics.light();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  // Xử lý chấp nhận lời mời
  const handleAcceptInvite = useCallback(async () => {
    haptics.medium();
    setActionError(null);
    try {
      const res = await acceptToken(token);
      setAcceptResult(res);
      setIsAcceptedSuccess(true);
      haptics.success();
    } catch (err) {
      haptics.error();
      setActionError(
        err instanceof Error
          ? err.message
          : 'Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại sau.'
      );
    }
  }, [acceptToken, token]);

  const inviter = preview?.inviter;
  const status = preview?.status ?? 'ACTIVE';
  const displayName = inviter?.displayName || inviter?.username || 'Người dùng Checked';
  const username = inviter?.username || '';
  const isGold = inviter?.isGoldMember ?? false;
  const fallbackInitial = (displayName || '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-canvas text-text-primary select-none flex flex-col items-center">
      <main className="w-full max-w-md mx-auto flex flex-col min-h-screen relative">
        {/* 1. Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={handleBack}
          data-testid="invite-accept-back-btn"
          aria-label="Quay lại"
          className="w-11 h-11 rounded-full bg-surface-subtle flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="text-text-primary" />
        </button>

        <h1 className="text-[17px] font-bold text-text-primary font-display">
          Lời Mời Kết Bạn
        </h1>

        {/* Placeholder cân bằng header */}
        <div className="w-11 h-11" aria-hidden="true" />
      </header>

      {/* 2. Scrollable Body */}
      <div className="flex-1 px-5 py-6 flex flex-col justify-center overflow-y-auto">
        {/* Loading State */}
        {previewTokenQuery.isLoading || !isHydrated ? (
          <div
            data-testid="invite-accept-loading"
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
          >
            <Loader2 size={36} className="animate-spin text-text-primary" />
            <p className="text-[15px] font-medium text-text-secondary">
              Đang kiểm tra lời mời...
            </p>
          </div>
        ) : previewTokenQuery.isError || !preview ? (
          /* Error State */
          <div
            data-testid="invite-accept-error"
            className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-surface rounded-[24px] p-6"
          >
            <AlertCircle size={48} className="text-error" />
            <h2 className="text-[20px] font-bold text-text-primary">
              Không thể mở lời mời
            </h2>
            <p className="text-[14px] text-text-secondary max-w-xs leading-relaxed">
              {previewTokenQuery.error?.message ||
                'Liên kết mời không tồn tại hoặc đã hết hạn.'}
            </p>

            <div className="flex items-center gap-3 mt-4 w-full">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 h-11 rounded-full bg-surface-subtle text-text-secondary font-semibold text-[15px] active:scale-95 transition-transform"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => previewTokenQuery.refetch()}
                className="flex-1 h-11 rounded-full bg-primary text-black font-bold text-[15px] active:scale-95 transition-transform"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : isAcceptedSuccess ? (
          /* Success State */
          <div
            data-testid="invite-accept-success"
            className="bg-surface rounded-[24px] p-6 text-center space-y-4 animate-in fade-in duration-200"
          >
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto text-success">
              <CheckCircle2 size={48} />
            </div>

            <h2 className="text-[22px] font-bold text-text-primary">
              Đã trở thành bạn bè!
            </h2>

            <p className="text-[15px] text-text-secondary leading-relaxed px-2">
              Bạn và{' '}
              <span className="font-semibold text-text-primary">
                {acceptResult?.friend?.displayName || displayName}
              </span>{' '}
              hiện đã có thể xem các khoảnh khắc và chia sẻ nhật ký cùng nhau.
            </p>

            <div className="space-y-2.5 pt-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                data-testid="home-btn"
                className="w-full h-[52px] rounded-full bg-primary text-black font-bold text-[16px] active:scale-95 transition-transform"
              >
                Vào trang chủ Checked
              </button>

              {username && (
                <button
                  type="button"
                  onClick={() => router.push(`/u/${username}`)}
                  data-testid="view-profile-btn"
                  className="w-full h-11 rounded-full bg-surface-subtle text-text-primary font-semibold text-[15px] active:scale-95 transition-transform"
                >
                  Xem trang cá nhân
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Preview Card */
          <div
            data-testid="invite-preview-card"
            className="bg-surface rounded-[24px] p-6 text-center space-y-5 animate-in fade-in duration-200"
          >
            {/* Avatar & Crown */}
            <div className="relative inline-block mx-auto">
              {inviter?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inviter.avatarUrl}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-[3px] border-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/30 flex items-center justify-center text-text-primary text-[28px] font-bold border-[3px] border-white">
                  {fallbackInitial}
                </div>
              )}

              {isGold && (
                <div
                  data-testid="gold-crown-icon"
                  className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 text-[#E5A93B]"
                >
                  <Crown size={14} className="fill-[#E5A93B]" />
                </div>
              )}
            </div>

            {/* Inviter Name & Username */}
            <div className="space-y-0.5">
              <h2 className="text-[20px] font-bold text-text-primary font-display">
                {displayName}
              </h2>
              {username && (
                <p className="text-[14px] font-semibold text-text-secondary">
                  @{username}
                </p>
              )}
            </div>

            <div className="h-[1px] bg-surface-subtle w-full" />

            {/* Error banner nếu accept thất bại */}
            {actionError && (
              <div className="p-3 bg-error/15 text-error rounded-[12px] text-[13px] font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Status-driven body & actions */}
            {status === 'ACTIVE' && (
              <div className="space-y-4">
                <p className="text-[15px] text-text-secondary leading-relaxed px-2">
                  Đã mời bạn trở thành bạn thân trên Checked. Chấp nhận để chia sẻ những
                  khoảnh khắc và nhật ký cùng nhau!
                </p>

                <div className="space-y-2.5 pt-2">
                  {!isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/login?redirect=/invite/${token}`)}
                      data-testid="login-to-accept-btn"
                      className="w-full h-[52px] rounded-full bg-primary text-black font-bold text-[16px] active:scale-95 transition-transform"
                    >
                      Đăng nhập để kết bạn
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAcceptInvite}
                      disabled={acceptTokenMutation.isPending}
                      data-testid="accept-invite-btn"
                      className="w-full h-[52px] rounded-full bg-primary text-black font-bold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {acceptTokenMutation.isPending ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-black" />
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} strokeWidth={2.4} />
                          <span>Chấp nhận kết bạn</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleBack}
                    data-testid="decline-invite-btn"
                    className="w-full h-11 text-text-secondary text-[15px] font-medium hover:text-text-primary active:scale-95 transition-transform"
                  >
                    Để sau
                  </button>
                </div>
              </div>
            )}

            {status === 'ALREADY_FRIENDS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-success font-semibold text-[15px]">
                  <CheckCircle2 size={18} />
                  <span>Hai bạn đã là bạn bè của nhau rồi!</span>
                </div>

                {username ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/u/${username}`)}
                    className="w-full h-[50px] rounded-full bg-primary text-black font-bold text-[15px] active:scale-95 transition-transform"
                  >
                    Xem trang cá nhân
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="w-full h-11 rounded-full bg-surface-subtle text-text-primary font-semibold text-[15px] active:scale-95 transition-transform"
                  >
                    Đóng
                  </button>
                )}
              </div>
            )}

            {status === 'SELF' && (
              <div className="space-y-4">
                <p className="text-[15px] text-text-secondary leading-relaxed">
                  Đây là liên kết mời kết bạn của chính bạn.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full h-11 rounded-full bg-surface-subtle text-text-primary font-semibold text-[15px] active:scale-95 transition-transform"
                >
                  Đóng
                </button>
              </div>
            )}

            {status === 'MAX_USES_REACHED' && (
              <div className="space-y-4">
                <p className="text-[14px] text-error leading-relaxed">
                  Liên kết mời kết bạn này đã đạt giới hạn sử dụng (50/50 lượt). Hãy nhờ bạn bè tạo một liên kết mới.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full h-11 rounded-full bg-surface-subtle text-text-primary font-semibold text-[15px] active:scale-95 transition-transform"
                >
                  Đóng
                </button>
              </div>
            )}

            {status === 'EXPIRED' && (
              <div className="space-y-4">
                <p className="text-[14px] text-error leading-relaxed">
                  Liên kết mời kết bạn này đã hết hạn. Hãy nhờ bạn bè tạo một liên kết mới.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full h-11 rounded-full bg-surface-subtle text-text-primary font-semibold text-[15px] active:scale-95 transition-transform"
                >
                  Đóng
                </button>
              </div>
            )}

            {status === 'REVOKED' && (
              <div className="space-y-4">
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  Liên kết mời này đã bị hủy bỏ bởi người tạo.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full h-11 rounded-full bg-surface-subtle text-text-primary font-semibold text-[15px] active:scale-95 transition-transform"
                >
                  Đóng
                </button>
              </div>
            )}

            {!['ACTIVE', 'ALREADY_FRIENDS', 'SELF', 'MAX_USES_REACHED', 'EXPIRED', 'REVOKED'].includes(
              status
            ) && (
              <div className="space-y-4">
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  Trạng thái liên kết: {status}
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full h-11 rounded-full bg-surface-subtle text-text-primary font-semibold text-[15px] active:scale-95 transition-transform"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  </div>
  );
}

function TokenUnwrapper({ paramsPromise }: { paramsPromise: Promise<{ token: string }> }) {
  const { token } = use(paramsPromise);
  return <FriendInviteAcceptContent token={token} />;
}

export default function FriendInviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas text-text-primary select-none flex flex-col items-center">
          <main className="w-full max-w-md mx-auto flex flex-col min-h-screen relative">
            <header className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
              <div className="w-11 h-11 rounded-full bg-surface-subtle animate-pulse" />
              <h1 className="text-[17px] font-bold text-text-primary font-display">
                Lời Mời Kết Bạn
              </h1>
              <div className="w-11 h-11" aria-hidden="true" />
            </header>
            <div
              data-testid="invite-accept-loading"
              className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-center"
            >
              <Loader2 size={36} className="animate-spin text-text-primary" />
              <p className="text-[15px] font-medium text-text-secondary">
                Đang kiểm tra lời mời...
              </p>
            </div>
          </main>
        </div>
      }
    >
      <TokenUnwrapper paramsPromise={params} />
    </Suspense>
  );
}
