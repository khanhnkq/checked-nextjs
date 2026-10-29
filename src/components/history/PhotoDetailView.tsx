'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CreditCard, Flame, Utensils, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { formatCurrency, formatTimeAgo } from '@/lib/utils/formatters';
import { useUpsertMyReaction, useRemoveMyReaction } from '@/lib/api/generated/endpoints';
import type { HistoryPhotoItem } from '@/app/history/page';

export interface PhotoDetailViewProps {
  photos: HistoryPhotoItem[];
  initialPhotoId?: string;
  onDismiss: () => void;
  className?: string;
}

const REACTION_OPTIONS = [
  { emoji: '🔥', type: 'FIRE', label: 'Lửa' },
  { emoji: '❤️', type: 'LOVE', label: 'Tim' },
  { emoji: '😂', type: 'HAHA', label: 'Cười' },
  { emoji: '😮', type: 'WOW', label: 'Ngạc nhiên' },
  { emoji: '😢', type: 'SAD', label: 'Buồn' },
  { emoji: '👏', type: 'CLAP', label: 'Vỗ tay' },
] as const;

/**
 * PhotoDetailView - Trình xem ảnh chi tiết vuốt dọc 1:1 chuẩn iOS Locket
 * - Cuộn snap dọc giữa các khoảnh khắc (snap-y snap-mandatory)
 * - Hiển thị nhãn giao dịch, calo và món ăn AI (Transaction Tag Badges)
 * - Thanh cảm xúc Emoji phản hồi tức thì và đồng bộ API Orval
 * - Quy tắc thiết kế: ZERO border, ZERO blur, ZERO shadow
 */
export const PhotoDetailView: React.FC<PhotoDetailViewProps> = ({
  photos,
  initialPhotoId,
  onDismiss,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePhotoId, setActivePhotoId] = useState<string>(
    initialPhotoId || photos[0]?.id || ''
  );
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const upsertMutation = useUpsertMyReaction();
  const removeMutation = useRemoveMyReaction();

  // Tự động cuộn đến ảnh ban đầu khi mở
  useEffect(() => {
    if (!initialPhotoId) return;
    const targetElement = document.getElementById(`detail-photo-${initialPhotoId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [initialPhotoId]);

  // Lắng nghe phím Escape để đóng
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const activePhoto = photos.find((p) => p.id === activePhotoId) || photos[0];

  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const itemHeight = container.clientHeight;

    const activeIndex = Math.round(scrollPosition / itemHeight);
    const currentItem = photos[activeIndex];
    if (currentItem && currentItem.id !== activePhotoId) {
      setActivePhotoId(currentItem.id);
    }
  };

  const handleReactionClick = async (photoId: string, reactionType: string) => {
    haptics.click();
    const isAlreadySelected = myReactions[photoId] === reactionType;

    if (isAlreadySelected) {
      setMyReactions((prev) => {
        const next = { ...prev };
        delete next[photoId];
        return next;
      });
      setToastMessage('Đã bỏ cảm xúc');

      try {
        await removeMutation.mutateAsync({ photoId });
      } catch {
        // Optimistic update fallback
      }
    } else {
      setMyReactions((prev) => ({
        ...prev,
        [photoId]: reactionType,
      }));
      setToastMessage('Đã thả cảm xúc ✨');

      try {
        await upsertMutation.mutateAsync({
          photoId,
          data: { type: reactionType },
        });
      } catch {
        // Optimistic update fallback
      }
    }

    setTimeout(() => setToastMessage(null), 1800);
  };

  if (!photos.length) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem chi tiết khoảnh khắc"
      className={cn(
        'fixed inset-0 z-50 bg-[#EDE9DF] flex flex-col items-center select-none overflow-hidden',
        className
      )}
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 14px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* 1. TOP BAR NỔI TRÊN CÙNG */}
      <header className="relative w-full max-w-[430px] h-[52px] px-4 flex items-center justify-between z-20 flex-shrink-0">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng chi tiết"
          className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        {/* Sender Pill */}
        <div className="h-[38px] px-3.5 rounded-full bg-white flex items-center gap-2">
          {activePhoto?.senderAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activePhoto.senderAvatarUrl}
              alt=""
              aria-hidden="true"
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-5 h-5 rounded-full bg-[#DFDACD] flex items-center justify-center text-[10px] font-bold text-[#141613]"
            >
              {(activePhoto?.senderName || 'B').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-[13px] font-bold font-display text-[#141613] max-w-[140px] truncate">
            {activePhoto?.senderName || 'Bạn'}
          </span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Thoát"
          className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-95 transition-transform"
        >
          <X size={20} strokeWidth={2.2} />
        </button>
      </header>

      {/* Toast phản hồi trạng thái cảm xúc */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-[#D4EB70] text-[#141613] text-xs font-bold font-display animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* 2. KHU VỰC CUỘN DỌC SNAP SCROLL TIÊU CHUẨN */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-[430px] flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth"
      >
        {photos.map((photo) => {
          const currentReaction = myReactions[photo.id];

          return (
            <div
              key={photo.id}
              id={`detail-photo-${photo.id}`}
              className="w-full h-full min-h-[580px] snap-start snap-always flex flex-col justify-between items-center px-4 py-3 relative"
            >
              {/* KHUNG ẢNH VUÔNG 1:1 CHUẨN LOCKET (BO GÓC 32PT) */}
              <div className="w-full max-w-[390px] aspect-square rounded-[32px] overflow-hidden relative bg-[#141613] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={`Khoảnh khắc của ${photo.senderName || 'bạn'}`}
                  className="w-full h-full object-cover"
                />

                {/* CỤM BADGES TRANSACTION & AI GÓC TRÊN BÊN TRÁI */}
                <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start z-10">
                  {/* Nhãn Món Ăn / Ghi Chú */}
                  {photo.note && (
                    <div className="h-7 px-2.5 rounded-full bg-[#D4EB70] text-[#141613] flex items-center gap-1.5 text-xs font-bold font-display">
                      <Utensils size={13} strokeWidth={2.2} />
                      <span className="max-w-[160px] truncate">{photo.note}</span>
                    </div>
                  )}

                  {/* Nhãn Chi Tiêu / Giá Tiền */}
                  {typeof photo.amount === 'number' && photo.amount > 0 && (
                    <div className="h-7 px-2.5 rounded-full bg-[#D4EB70] text-[#141613] flex items-center gap-1.5 text-xs font-bold font-display">
                      <CreditCard size={13} strokeWidth={2.2} />
                      <span>{formatCurrency(photo.amount)}</span>
                    </div>
                  )}

                  {/* Nhãn Calo Năng Lượng */}
                  {typeof photo.calories === 'number' && photo.calories > 0 && (
                    <div className="h-7 px-2.5 rounded-full bg-white text-[#141613] flex items-center gap-1.5 text-xs font-bold font-display">
                      <Flame size={13} className="text-[#FF5C00]" strokeWidth={2.4} />
                      <span>{photo.calories} kcal</span>
                    </div>
                  )}
                </div>
              </div>

              {/* THÔNG TIN NGƯỜI GỬI & THỜI GIAN ĐĂNG */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-[14px] font-bold font-display text-[#141613]">
                  {photo.senderName || 'Bạn'}
                </span>
                <span className="text-[#63685F] text-xs">•</span>
                <span className="text-xs text-[#63685F] font-medium">
                  {formatTimeAgo(photo.createdAt)}
                </span>
              </div>

              {/* THANH THẢ CẢM XÚC EMOJI (6 BIỂU TƯỢNG) */}
              <div className="w-full flex justify-center pb-2">
                <div className="h-[52px] px-3.5 rounded-full bg-white flex items-center gap-2.5 select-none">
                  {REACTION_OPTIONS.map((item) => {
                    const isSelected = currentReaction === item.type;

                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleReactionClick(photo.id, item.type)}
                        aria-label={`Thả cảm xúc ${item.label}`}
                        className={cn(
                          'w-[38px] h-[38px] rounded-full flex items-center justify-center text-xl transition-all active:scale-125',
                          isSelected
                            ? 'bg-[#D4EB70] scale-110'
                            : 'hover:bg-[#F2F2F4]'
                        )}
                      >
                        <span>{item.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
