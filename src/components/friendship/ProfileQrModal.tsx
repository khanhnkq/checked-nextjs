'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { ChevronLeft, ScanLine, Download, Share2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface ProfileQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatarUrl?: string | null;
  displayName?: string;
  onScanTap?: () => void;
  className?: string;
}

/**
 * ProfileQrModal (Màn hình Modal Mã QR cá nhân chuẩn 1:1 iOS)
 * - Nền Canvas Oat Milk (#EDE9DF) toàn màn hình phẳng
 * - Header: Nút tròn Back 44px, Tiêu đề "Mã QR", Nút tròn quét mã ScanLine 44px
 * - Khung mã QR 270x270px bo tròn 26px chứa ảnh QR (client-side rendered) và Avatar tròn 52x52 viền trắng ở tâm
 * - 2 Nút hành động cao 50px bo góc 16px: "Lưu ảnh" (Surface) và "Chia sẻ" (Matcha Glow #D4EB70)
 * - Tự động tạo mã QR chất lượng cao (High Error Correction Level H) không bao giờ bị lỗi ảnh vỡ
 * - Toast phản hồi nổi chuẩn iOS Locket khi sao chép liên kết hoặc lưu ảnh
 */
export const ProfileQrModal: React.FC<ProfileQrModalProps> = ({
  isOpen,
  onClose,
  username,
  avatarUrl,
  displayName,
  onScanTap,
  className,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>(
    'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="236" height="236" viewBox="0 0 236 236"><rect width="236" height="236" fill="%23FFFFFF"/></svg>'
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const effectiveDisplayName = displayName || username;
  const fallbackInitial = (effectiveDisplayName || '?').charAt(0).toUpperCase();
  const profileUrl = `https://checked.app/u/${username}`;

  // Sinh mã QR trực tiếp trên Client bằng thư viện QRCode (High Error Correction)
  useEffect(() => {
    if (!username) return;

    let isMounted = true;
    QRCode.toDataURL(profileUrl, {
      width: 472, // 2x độ phân giải cho màn hình Retina
      margin: 1,
      color: {
        dark: '#141613',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // Mức H (30% phục hồi dữ liệu) để nhúng Avatar ở giữa vẫn quét cực nhạy
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi sinh mã QR client-side:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [username, profileUrl]);

  // Keyboard Escape Handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        haptics.light();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  const showToast = (message: string) => {
    haptics.light();
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Lưu ảnh QR chất lượng cao (ghép Avatar vào giữa Canvas)
  const handleSaveQr = async () => {
    haptics.medium();

    try {
      // 1. Tạo Canvas ảo để xuất ảnh hoàn chỉnh
      const canvas = document.createElement('canvas');
      const size = 540;
      canvas.width = size;
      canvas.height = size;
      let ctx: CanvasRenderingContext2D | null = null;
      try {
        ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
      } catch {
        ctx = null;
      }

      if (!ctx) {
        throw new Error('Canvas context không khả dụng');
      }

      // Nền trắng bo tròn
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // Vẽ QR Code
      const currentQrUrl =
        qrDataUrl && !qrDataUrl.startsWith('data:image/svg+xml')
          ? qrDataUrl
          : await QRCode.toDataURL(profileUrl, {
              width: 472,
              margin: 1,
              color: { dark: '#141613', light: '#FFFFFF' },
              errorCorrectionLevel: 'H',
            });

      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => reject(new Error('Lỗi load QR image'));
        qrImage.src = currentQrUrl;
      });

      const qrPadding = 34;
      ctx.drawImage(qrImage, qrPadding, qrPadding, size - qrPadding * 2, size - qrPadding * 2);

      // Vẽ Avatar ở trung tâm nếu có
      const center = size / 2;
      const avatarSize = 104; // 52px * 2

      // Vòng tròn trắng viền bảo vệ
      ctx.beginPath();
      ctx.arc(center, center, avatarSize / 2 + 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Nếu có ảnh avatar thì vẽ ảnh tròn, nếu không vẽ initials
      if (avatarUrl && !avatarError) {
        try {
          const avatarImg = new Image();
          avatarImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            avatarImg.onload = () => resolve();
            avatarImg.onerror = () => reject();
            avatarImg.src = avatarUrl;
          });

          ctx.save();
          ctx.beginPath();
          ctx.arc(center, center, avatarSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatarImg, center - avatarSize / 2, center - avatarSize / 2, avatarSize, avatarSize);
          ctx.restore();
        } catch {
          drawFallbackAvatar(ctx, center, avatarSize, fallbackInitial);
        }
      } else {
        drawFallbackAvatar(ctx, center, avatarSize, fallbackInitial);
      }

      // Tải ảnh về máy
      const finalDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = finalDataUrl;
      link.download = `checked-qr-${username}.png`;
      link.addEventListener('click', (e) => {
        if (process.env.NODE_ENV === 'test') {
          e.preventDefault();
        }
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Đã lưu mã QR vào máy');
    } catch {
      // Fallback tải link cơ bản
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `checked-qr-${username}.png`;
      link.addEventListener('click', (e) => {
        if (process.env.NODE_ENV === 'test') {
          e.preventDefault();
        }
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Đã lưu mã QR vào máy');
    }
  };

  const drawFallbackAvatar = (
    ctx: CanvasRenderingContext2D,
    center: number,
    size: number,
    initial: string
  ) => {
    ctx.beginPath();
    ctx.arc(center, center, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#DFDACD';
    ctx.fill();

    ctx.fillStyle = '#141613';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, center, center);
  };

  const handleShare = async () => {
    haptics.medium();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Kết bạn với tôi trên Checked',
          text: `Kết bạn với @${username} trên Checked: ${profileUrl}`,
          url: profileUrl,
        });
        return;
      } catch {
        // Người dùng hủy chia sẻ
        return;
      }
    }

    // Fallback: sao chép clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(profileUrl);
        showToast('Đã sao chép liên kết');
      } catch {
        showToast('Không thể sao chép liên kết');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mã QR"
      className={cn(
        'fixed inset-0 z-50 bg-[#EDE9DF] flex flex-col items-center justify-between select-none animate-in fade-in duration-200 overflow-y-auto',
        className
      )}
    >
      <div className="w-full max-w-md min-h-[100dvh] flex flex-col justify-between p-4 pt-3 pb-8 relative">
        {/* 1. Top Navigation Bar */}
        <div className="flex items-center justify-between py-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              haptics.light();
              onClose();
            }}
            aria-label="Quay lại"
            className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform"
          >
            <ChevronLeft size={20} strokeWidth={2.6} />
          </button>

          <h1 className="text-[18px] font-bold text-text-primary font-display tracking-tight">
            Mã QR
          </h1>

          <button
            type="button"
            onClick={() => {
              haptics.light();
              onScanTap?.();
            }}
            aria-label="Quét mã QR"
            className="w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform"
          >
            <ScanLine size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* 2. Khung Mã QR vuông 270x270px (Avatar tròn 52x52px chính giữa) */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="w-[270px] h-[270px] bg-white rounded-[26px] relative flex items-center justify-center p-4">
            {/* QR Image with Smooth Transition */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`Mã QR của ${username}`}
              className={cn(
                'w-[236px] h-[236px] rounded-[14px] object-contain transition-opacity duration-200',
                isGeneratingQr ? 'opacity-0' : 'opacity-100'
              )}
            />

            {isGeneratingQr && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Loader2 size={32} className="animate-spin text-text-secondary" />
              </div>
            )}

            {/* Avatar trung tâm tròn 52x52 viền trắng */}
            <div className="w-[52px] h-[52px] rounded-full object-cover border-[3.5px] border-white absolute inset-0 m-auto flex items-center justify-center overflow-hidden bg-[#DFDACD] pointer-events-none">
              {avatarUrl && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={effectiveDisplayName}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-[20px] font-bold text-text-primary select-none">
                  {fallbackInitial}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Action Buttons (Lưu ảnh, Chia sẻ) */}
        <div className="flex items-center gap-3 pt-2 shrink-0">
          {/* Nút Lưu ảnh */}
          <button
            type="button"
            onClick={handleSaveQr}
            aria-label="Lưu ảnh"
            className="h-[50px] flex-1 bg-surface rounded-[16px] flex items-center justify-center gap-2 text-text-primary font-bold text-[15px] active:scale-[0.98] transition-transform"
          >
            <Download size={16} strokeWidth={2.6} />
            <span>Lưu ảnh</span>
          </button>

          {/* Nút Chia sẻ */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Chia sẻ"
            className="h-[50px] flex-1 bg-primary rounded-[16px] flex items-center justify-center gap-2 text-black font-bold text-[15px] active:scale-[0.98] transition-transform"
          >
            <Share2 size={16} strokeWidth={2.6} />
            <span>Chia sẻ</span>
          </button>
        </div>

        {/* Hidden Canvas phục vụ trích xuất ảnh */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Toast Banner chuẩn iOS */}
        {toastMessage && (
          <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 pointer-events-none px-4 animate-in slide-in-from-bottom duration-200">
            <div className="bg-surface px-5 py-3.5 rounded-full flex items-center gap-2.5 text-text-primary text-[14px] font-semibold">
              <CheckCircle2 size={17} className="text-primary fill-black shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

