'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  QrCode,
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  RotateCw,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useFriendInvite } from '@/hooks/useFriendInvite';
import { useFriendships } from '@/hooks/useFriendships';
import { ProfileQrModal } from '@/components/friendship/ProfileQrModal';
import { haptics } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * Hàm phân tích và trích xuất token từ chuỗi người dùng nhập:
 * Hỗ trợ:
 * - Token thuần: "xyz123"
 * - URL có tham số query: "https://checked.app/invite?token=xyz123"
 * - Đường dẫn URL: "https://checked.app/invite/xyz123"
 */
function extractToken(raw: string): string {
  const trimmed = raw.trim();
  try {
    if (trimmed.includes('token=')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://checked.app/${trimmed}`);
      const token = url.searchParams.get('token');
      if (token) return token;
    }
    if (trimmed.includes('/invite/')) {
      const parts = trimmed.split('/invite/');
      const candidate = parts[1]?.split(/[?#]/)[0];
      if (candidate) return candidate;
    }
  } catch {
    // Fallback sang chuỗi đã trim
  }
  return trimmed;
}

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isHydrated, isAuthenticated, user } = useAuthStore();
  const tokenParam = searchParams?.get('token');

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [inputTokenOrUrl, setInputTokenOrUrl] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAcceptingToken, setIsAcceptingToken] = useState<boolean>(false);

  // Hook Lời mời kết bạn
  const {
    currentInvite,
    currentInviteQuery,
    rotateInviteLink,
    revokeInviteLink,
    acceptToken,
    rotateInviteMutation,
  } = useFriendInvite({ enabled: Boolean(isAuthenticated) });

  // Hook Bạn bè (lấy số lượng lời mời đang chờ)
  const { receivedCount } = useFriendships({ enabled: Boolean(isAuthenticated) });

  // 1. Chuyển hướng nếu URL chứa param token
  useEffect(() => {
    if (tokenParam) {
      router.replace(`/invite/${tokenParam}`);
    }
  }, [tokenParam, router]);

  // 2. Route Guard: Chuyển hướng sang /login nếu chưa đăng nhập
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login?redirect=/invite');
    }
  }, [isHydrated, isAuthenticated, router]);

  // URL mời hiệu dụng
  const effectiveLinkUrl = useMemo(() => {
    if (currentInvite?.inviteUrl) {
      return currentInvite.inviteUrl;
    }
    const username = user?.username || '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/u/${username}`;
    }
    return `https://checked.app/u/${username}`;
  }, [currentInvite?.inviteUrl, user?.username]);

  // Xử lý nút Back
  const handleBack = useCallback(() => {
    haptics.light();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile');
    }
  }, [router]);

  // Xử lý sao chép link
  const handleCopyLink = useCallback(async () => {
    haptics.medium();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(effectiveLinkUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  }, [effectiveLinkUrl]);

  // Xử lý chia sẻ link
  const handleShareLink = useCallback(async () => {
    haptics.medium();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Kết bạn với tôi trên Checked',
          text: `Kết bạn với @${user?.username || ''} trên Checked!`,
          url: effectiveLinkUrl,
        });
        return;
      } catch {
        // User cancelled share
        return;
      }
    }
    // Fallback sang clipboard copy
    handleCopyLink();
  }, [effectiveLinkUrl, handleCopyLink, user?.username]);

  // Xử lý đổi link
  const handleRotateLink = useCallback(async () => {
    haptics.medium();
    setErrorMessage(null);
    try {
      await rotateInviteLink();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tạo liên kết mời mới.'
      );
    }
  }, [rotateInviteLink]);

  // Xử lý hủy link
  const handleRevokeLink = useCallback(async () => {
    haptics.light();
    setErrorMessage(null);
    try {
      await revokeInviteLink();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể hủy liên kết mời.'
      );
    }
  }, [revokeInviteLink]);

  // Xử lý kết bạn bằng mã / URL
  const handleAcceptByInput = useCallback(async () => {
    const token = extractToken(inputTokenOrUrl);
    if (!token) return;

    haptics.medium();
    setIsAcceptingToken(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await acceptToken(token);
      const friendName =
        res.friend?.displayName || res.friend?.username || 'người bạn mới';
      setSuccessMessage(`Đã kết bạn với ${friendName}!`);
      setInputTokenOrUrl('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Không thể chấp nhận lời mời. Vui lòng kiểm tra lại liên kết.'
      );
    } finally {
      setIsAcceptingToken(false);
    }
  }, [acceptToken, inputTokenOrUrl]);

  // Trạng thái chờ Hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center">
        <div
          data-testid="invite-loading-skeleton"
          className="w-full max-w-md mx-auto flex flex-col min-h-screen relative p-4 space-y-4"
        >
          <div className="h-11 w-11 rounded-full bg-surface-subtle animate-pulse" />
          <div className="h-20 rounded-[18px] bg-surface-subtle animate-pulse" />
          <div className="h-20 rounded-[18px] bg-surface-subtle animate-pulse" />
          <div className="h-44 rounded-[18px] bg-surface-subtle animate-pulse" />
        </div>
      </div>
    );
  }

  // Chưa đăng nhập (đang chờ redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas text-text-primary select-none flex flex-col items-center">
      <main
        data-testid="invite-page"
        className="w-full max-w-md mx-auto flex flex-col min-h-screen relative pt-safe"
      >
        {/* 1. Header Bar Flat */}
        <header className="flex items-center gap-3 px-4 pt-3 pb-2 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            data-testid="invite-back-btn"
            aria-label="Quay lại"
            className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <ChevronLeft size={20} strokeWidth={2.5} className="text-text-primary" />
          </button>

          <h1 className="text-[22px] font-bold font-display text-text-primary">
            Mời bạn bè
          </h1>
        </header>

        {/* 2. Scrollable Content Container */}
        <div className="flex-1 w-full px-4 space-y-4 pt-2 pb-16 overflow-y-auto no-scrollbar">
        {/* Shortcut 1: Trung tâm lời mời kết bạn */}
        <button
          type="button"
          onClick={() => {
            haptics.light();
            router.push('/friends/requests');
          }}
          data-testid="friend-requests-shortcut"
          className="w-full bg-surface rounded-[18px] p-3.5 flex items-center gap-3.5 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Mail size={20} strokeWidth={2.4} className="text-black" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-bold text-text-primary">
              Trung tâm lời mời kết bạn
            </h2>
            <p className="text-[13px] text-text-secondary truncate">
              Xem danh sách lời mời đã nhận & đã gửi
            </p>
          </div>

          {receivedCount > 0 && (
            <span
              data-testid="received-count-badge"
              className="text-[11px] font-black px-2 py-0.5 rounded-full leading-none bg-error text-white shrink-0"
            >
              {receivedCount}
            </span>
          )}

          <ChevronRight size={16} strokeWidth={2.4} className="text-text-secondary/60 shrink-0" />
        </button>

        {/* Shortcut 2: Mã QR của tôi */}
        <button
          type="button"
          onClick={() => {
            haptics.light();
            setIsQrModalOpen(true);
          }}
          data-testid="qr-action-shortcut"
          className="w-full bg-surface rounded-[18px] p-3.5 flex items-center gap-3.5 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
            <QrCode size={20} strokeWidth={2.4} className="text-black" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-bold font-display text-text-primary">
              Mã QR của tôi
            </h2>
            <p className="text-[13px] text-text-secondary truncate">
              Xem mã QR cá nhân & quét mã bạn bè
            </p>
          </div>

          <ChevronRight size={16} strokeWidth={2.4} className="text-text-secondary/60 shrink-0" />
        </button>

        {/* Section: LINK CỦA BẠN */}
        <section className="space-y-2">
          <h3 className="text-[12px] font-bold text-text-secondary pl-0.5 tracking-wider uppercase">
            LINK CỦA BẠN
          </h3>

          <div className="bg-surface rounded-[18px] p-4 space-y-3">
            {currentInviteQuery.isLoading && !currentInvite ? (
              <div data-testid="invite-link-skeleton" className="space-y-3">
                <div className="h-11 rounded-[12px] bg-surface-subtle animate-pulse" />
                <div className="flex gap-2.5">
                  <div className="h-11 flex-1 rounded-[12px] bg-surface-subtle animate-pulse" />
                  <div className="h-11 flex-1 rounded-[12px] bg-surface-subtle animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                {/* Khung hiển thị URL */}
                <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[#DFDACD] rounded-[12px]">
                  <LinkIcon size={20} className="text-text-primary shrink-0" />
                  <span
                    data-testid="invite-link-url"
                    className="text-[14px] font-medium font-mono text-text-primary truncate select-all flex-1"
                  >
                    {effectiveLinkUrl}
                  </span>
                </div>

                {/* Hàng nút Sao chép & Chia sẻ */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    data-testid="copy-link-btn"
                    className="flex-1 h-11 bg-primary text-black font-bold text-[14px] rounded-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    {isCopied ? (
                      <>
                        <Check size={16} strokeWidth={2.6} />
                        <span>Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} strokeWidth={2.4} />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareLink}
                    data-testid="share-link-btn"
                    className="flex-1 h-11 bg-[#DFDACD] text-black font-bold text-[14px] rounded-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Share2 size={16} strokeWidth={2.4} />
                    <span>Chia sẻ</span>
                  </button>
                </div>

                {/* Thao tác Đổi link / Hủy link */}
                <div className="flex items-center justify-between pt-1 px-0.5">
                  <button
                    type="button"
                    onClick={handleRotateLink}
                    disabled={rotateInviteMutation.isPending}
                    data-testid="rotate-link-btn"
                    className="flex items-center gap-1.5 text-[13px] font-bold text-text-secondary hover:text-text-primary active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <RotateCw
                      size={13}
                      strokeWidth={2.5}
                      className={cn(
                        'text-text-secondary',
                        rotateInviteMutation.isPending && 'animate-spin'
                      )}
                    />
                    <span>Đổi link</span>
                  </button>

                  {currentInvite && (
                    <button
                      type="button"
                      onClick={handleRevokeLink}
                      data-testid="revoke-link-btn"
                      className="text-[13px] font-bold text-error hover:opacity-80 active:scale-95 transition-transform"
                    >
                      Hủy link
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section: KẾT BẠN BẰNG LINK HOẶC MÃ */}
        <section className="space-y-2">
          <h3 className="text-[12px] font-bold text-text-secondary pl-0.5 tracking-wider uppercase">
            KẾT BẠN BẰNG LINK HOẶC MÃ
          </h3>

          <div className="bg-surface rounded-[18px] p-4 space-y-3">
            {/* Input dán link / mã */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#DFDACD]/50 rounded-[12px]">
              <input
                type="text"
                data-testid="token-input"
                placeholder="Dán link hoặc mã..."
                value={inputTokenOrUrl}
                onChange={(e) => setInputTokenOrUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputTokenOrUrl.trim()) {
                    handleAcceptByInput();
                  }
                }}
                className="w-full bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-secondary/60"
              />

              {inputTokenOrUrl.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInputTokenOrUrl('')}
                  data-testid="clear-input-btn"
                  className="text-text-secondary/60 hover:text-text-primary"
                  aria-label="Xóa nội dung nhập"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>

            {/* Nút Kết bạn ngay */}
            <button
              type="button"
              onClick={handleAcceptByInput}
              disabled={!inputTokenOrUrl.trim() || isAcceptingToken}
              data-testid="accept-token-btn"
              className={cn(
                'w-full h-11 rounded-[12px] text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95',
                inputTokenOrUrl.trim() && !isAcceptingToken
                  ? 'bg-primary text-black'
                  : 'bg-[#DFDACD] text-text-secondary cursor-not-allowed opacity-70'
              )}
            >
              {isAcceptingToken ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" />
                  <span>Đang kết bạn...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  <span>Kết bạn ngay</span>
                </>
              )}
            </button>

            {/* Banner phản hồi thành công */}
            {successMessage && (
              <div
                data-testid="invite-success-banner"
                className="p-3 bg-success/15 text-success rounded-[12px] text-[14px] font-semibold flex items-center gap-2 animate-in fade-in"
              >
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Banner phản hồi lỗi */}
            {errorMessage && (
              <div
                data-testid="invite-error-banner"
                className="p-3 bg-error/15 text-error rounded-[12px] text-[14px] font-semibold flex items-center gap-2 animate-in fade-in"
              >
                <AlertCircle size={18} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal Profile QR */}
      <ProfileQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        username={user?.username || ''}
        displayName={user?.displayName}
        avatarUrl={user?.avatarUrl}
      />
    </main>
  </div>
);
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex flex-col items-center">
          <div
            data-testid="invite-loading-skeleton"
            className="w-full max-w-md mx-auto flex flex-col min-h-screen relative p-4 space-y-4"
          >
            <div className="h-11 w-11 rounded-full bg-surface-subtle animate-pulse" />
            <div className="h-20 rounded-[18px] bg-surface-subtle animate-pulse" />
            <div className="h-20 rounded-[18px] bg-surface-subtle animate-pulse" />
            <div className="h-44 rounded-[18px] bg-surface-subtle animate-pulse" />
          </div>
        </div>
      }
    >
      <InvitePageContent />
    </Suspense>
  );
}
