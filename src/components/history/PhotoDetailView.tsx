'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  CreditCard,
  Flame,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Users,
  Utensils,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { formatCurrency, formatTimeAgo } from '@/lib/utils/formatters';
import { useUpsertMyReaction, useRemoveMyReaction } from '@/lib/api/generated/endpoints';
import type { HistoryPhotoItem } from '@/app/history/page';
import type { FriendOption } from '@/components/home';

export interface PhotoDetailViewProps {
  photos: HistoryPhotoItem[];
  allPhotos?: HistoryPhotoItem[];
  initialPhotoId?: string;
  onDismiss: () => void;
  friends?: FriendOption[];
  selectedFilterId?: string | null;
  onSelectFilter?: (id: string | null) => void;
  onChatClick?: () => void;
  currentUser?: any;
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
 * PhotoDetailView - Trình xem ảnh chi tiết vuốt dọc chuẩn 1:1 iOS Locket
 * - Header Dropdown đồng bộ: Nút Back, Pill người gửi/bộ lọc, Nút Chat
 * - Khung ảnh vuông 1:1 bo góc 32pt, cụm tag AI góc trên & caption ở đáy
 * - Thanh Pill Reaction (330x46px) bo cong, avatar tim bên trái, 6 emoji bên phải
 * - Thanh phản hồi & nhập tin nhắn cố định ở đáy (h-[50px] capsule)
 * - Nghiêm ngặt: ZERO border, ZERO blur, ZERO shadow
 */
export const PhotoDetailView: React.FC<PhotoDetailViewProps> = ({
  photos,
  allPhotos = [],
  initialPhotoId,
  onDismiss,
  friends = [],
  selectedFilterId = null,
  onSelectFilter,
  onChatClick,
  currentUser,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePhotoId, setActivePhotoId] = useState<string>(
    initialPhotoId || photos[0]?.id || ''
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const upsertMutation = useUpsertMyReaction();
  const removeMutation = useRemoveMyReaction();

  // Kiểm tra ảnh có thuộc về người dùng hiện tại không
  const isUserPhoto = (senderId?: string, senderName?: string): boolean => {
    if (!senderId && !senderName) return false;
    if (senderId === 'me' || senderName === 'Bạn') return true;
    if (currentUser?.id && senderId === currentUser.id) return true;
    if (
      currentUser?.username &&
      senderName &&
      senderName.toLowerCase() === currentUser.username.toLowerCase()
    ) {
      return true;
    }
    if (
      currentUser?.displayName &&
      senderName &&
      senderName.toLowerCase() === currentUser.displayName.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // Cuộn ngay đến ảnh được click ban đầu khi mở
  useEffect(() => {
    if (!initialPhotoId) return;
    const target = document.getElementById(`detail-photo-${initialPhotoId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [initialPhotoId]);

  // Phím Escape để đóng
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

  // Tính toán tiêu đề & avatar hiển thị trên Pill TopBar
  const isOwnActivePhoto = isUserPhoto(
    activePhoto?.senderId,
    activePhoto?.senderName
  );

  let pillTitle = 'Tất cả';
  let pillAvatar: string | null = null;
  let isAllMode = false;

  if (selectedFilterId === 'me') {
    pillTitle = 'Bạn';
    pillAvatar = currentUser?.avatarUrl || null;
  } else if (selectedFilterId) {
    const friend = friends.find((f) => f.id === selectedFilterId);
    pillTitle = friend?.name || activePhoto?.senderName || 'Bạn bè';
    pillAvatar = friend?.avatarUrl || activePhoto?.senderAvatarUrl || null;
  } else {
    // Mode "Tất cả": Hiển thị tên & avatar người gửi của bức ảnh đang active
    pillTitle = isOwnActivePhoto ? 'Bạn' : activePhoto?.senderName || 'Khoảnh khắc';
    pillAvatar = isOwnActivePhoto
      ? currentUser?.avatarUrl || null
      : activePhoto?.senderAvatarUrl || null;
    isAllMode = true;
  }

  const handleSelectFilter = (id: string | null) => {
    haptics.click();
    setIsDropdownOpen(false);
    onSelectFilter?.(id);
  };

  const handleReactionClick = async (photo: HistoryPhotoItem, reactionType: string) => {
    const isOwn = isUserPhoto(photo.senderId, photo.senderName);
    if (isOwn) {
      haptics.heavy();
      setToastMessage('Bạn không thể thả cảm xúc vào ảnh của chính mình ✨');
      setTimeout(() => setToastMessage(null), 2200);
      return;
    }

    haptics.medium();
    const isAlreadySelected = myReactions[photo.id] === reactionType;

    if (isAlreadySelected) {
      setMyReactions((prev) => {
        const next = { ...prev };
        delete next[photo.id];
        return next;
      });
      setToastMessage('Đã bỏ cảm xúc');

      try {
        await removeMutation.mutateAsync({ photoId: photo.id });
      } catch {
        // Fallback optimistic
      }
    } else {
      setMyReactions((prev) => ({
        ...prev,
        [photo.id]: reactionType,
      }));
      setToastMessage('Đã thả cảm xúc ✨');

      try {
        await upsertMutation.mutateAsync({
          photoId: photo.id,
          data: { type: reactionType },
        });
      } catch {
        // Fallback optimistic
      }
    }

    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    haptics.success();
    setToastMessage('Đã gửi phản hồi! ✨');
    setCommentText('');
    setTimeout(() => setToastMessage(null), 2000);
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
    >
      {/* 1. TOP BAR NỔI TRÊN CÙNG ĐỒNG BỘ 100% VỚI IOS */}
      <header
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[52px] px-4 flex items-center justify-between z-40 select-none"
        style={{ top: 'max(env(safe-area-inset-top), 14px)' }}
      >
        {/* Nút Back quay về lưới ảnh */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng chi tiết"
          className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        {/* Nút Dropdown Pill Filter căn giữa */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              haptics.click();
              setIsDropdownOpen((prev) => !prev);
            }}
            aria-label="Lọc người gửi khoảnh khắc"
            className="h-[38px] px-3.5 rounded-full bg-white flex items-center gap-2 active:scale-95 transition-transform"
          >
            {pillAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pillAvatar}
                alt=""
                aria-hidden="true"
                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              />
            ) : isAllMode && !isOwnActivePhoto && !activePhoto?.senderName ? (
              <Users size={15} className="text-[#141613] flex-shrink-0" />
            ) : (
              <div
                aria-hidden="true"
                className="w-5 h-5 rounded-full bg-[#DFDACD] flex items-center justify-center text-[10px] font-bold text-[#141613]"
              >
                {pillTitle.charAt(0).toUpperCase()}
              </div>
            )}

            <span className="text-[13px] font-bold font-display text-[#141613] tracking-tight max-w-[120px] truncate">
              {pillTitle}
            </span>

            <ChevronDown
              size={14}
              className={cn(
                'text-[#63685F] transition-transform duration-200',
                isDropdownOpen && 'rotate-180'
              )}
              strokeWidth={2.5}
            />
          </button>

          {/* Menu Dropdown nổi */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-[46px] left-1/2 -translate-x-1/2 w-[200px] rounded-2xl bg-white p-1.5 flex flex-col gap-1 z-50">
                {/* Tùy chọn 1: Tất cả */}
                <button
                  type="button"
                  onClick={() => handleSelectFilter(null)}
                  className={cn(
                    'w-full h-[40px] px-3 rounded-xl flex items-center gap-2.5 text-left text-[13px] font-semibold font-display active:bg-[#F2F2F4] transition-colors',
                    selectedFilterId === null
                      ? 'bg-[#EDE9DF] text-[#141613]'
                      : 'text-[#63685F]'
                  )}
                >
                  <Users size={16} />
                  <span>Tất cả</span>
                </button>

                {/* Tùy chọn 2: Bạn */}
                <button
                  type="button"
                  onClick={() => handleSelectFilter('me')}
                  className={cn(
                    'w-full h-[40px] px-3 rounded-xl flex items-center gap-2.5 text-left text-[13px] font-semibold font-display active:bg-[#F2F2F4] transition-colors',
                    selectedFilterId === 'me'
                      ? 'bg-[#EDE9DF] text-[#141613]'
                      : 'text-[#63685F]'
                  )}
                >
                  {currentUser?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatarUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-5 h-5 rounded-full bg-[#D4EB70] flex items-center justify-center text-[10px] font-bold text-[#141613]"
                    >
                      B
                    </div>
                  )}
                  <span>Bạn</span>
                </button>

                {/* Tùy chọn 3: Danh sách bạn bè */}
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => handleSelectFilter(friend.id)}
                    className={cn(
                      'w-full h-[40px] px-3 rounded-xl flex items-center gap-2.5 text-left text-[13px] font-semibold font-display active:bg-[#F2F2F4] transition-colors',
                      selectedFilterId === friend.id
                        ? 'bg-[#EDE9DF] text-[#141613]'
                        : 'text-[#63685F]'
                    )}
                  >
                    {friend.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={friend.avatarUrl}
                        alt=""
                        aria-hidden="true"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="w-5 h-5 rounded-full bg-[#DFDACD] flex items-center justify-center text-[10px] font-bold text-[#141613]"
                      >
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{friend.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Nút Chat bên phải */}
        <button
          type="button"
          onClick={() => {
            haptics.click();
            onDismiss();
            onChatClick?.();
          }}
          aria-label="Tin nhắn"
          className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-95 transition-transform"
        >
          <MessageCircle size={20} className="text-[#141613]" />
        </button>
      </header>

      {/* 2. KHU VỰC CUỘN DỌC SNAP PAGING (SPACING CHUẨN IOS) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-[430px] h-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar z-10"
      >
        {photos.map((photo) => {
          const currentReaction = myReactions[photo.id];
          const isOwn = isUserPhoto(photo.senderId, photo.senderName);

          return (
            <div
              key={photo.id}
              id={`detail-photo-${photo.id}`}
              className="w-full h-full snap-start snap-always flex flex-col items-center justify-center px-4 relative select-none"
              style={{
                paddingTop: 'calc(max(env(safe-area-inset-top), 14px) + 52px + 10px)',
                paddingBottom: 'calc(max(env(safe-area-inset-bottom), 16px) + 64px + 10px)',
              }}
            >
              {/* KHUNG ẢNH VUÔNG 1:1 CHUẨN LOCKET (BO GÓC 32PT) */}
              <div className="w-[calc(100vw-36px)] max-w-[370px] aspect-square rounded-[32px] overflow-hidden relative bg-[#141613] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={`Khoảnh khắc của ${photo.senderName || 'bạn'}`}
                  className="w-full h-full object-cover"
                />

                {/* CỤM BADGES TRANSACTION & AI GÓC TRÊN BÊN TRÁI (top-3.5 left-3.5) */}
                <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start z-10">
                  {photo.locationName && (
                    <div className="h-7 px-2.5 rounded-full bg-white text-[#141613] flex items-center gap-1.5 text-xs font-bold font-display">
                      <MapPin size={12} strokeWidth={2.4} />
                      <span className="max-w-[150px] truncate">{photo.locationName}</span>
                    </div>
                  )}

                  {photo.note && (
                    <div className="h-7 px-2.5 rounded-full bg-[#D4EB70] text-[#141613] flex items-center gap-1.5 text-xs font-bold font-display">
                      <Utensils size={12} strokeWidth={2.4} />
                      <span className="max-w-[150px] truncate">{photo.note}</span>
                    </div>
                  )}

                  {typeof photo.amount === 'number' && photo.amount > 0 && (
                    <div className="h-7 px-2.5 rounded-full bg-[#D4EB70] text-[#141613] flex items-center gap-1.5 text-xs font-bold font-display">
                      <CreditCard size={12} strokeWidth={2.4} />
                      <span>{formatCurrency(photo.amount)}</span>
                    </div>
                  )}

                  {typeof photo.calories === 'number' && photo.calories > 0 && (
                    <div className="h-7 px-2.5 rounded-full bg-white text-[#141613] flex items-center gap-1.5 text-xs font-bold font-display">
                      <Flame size={12} className="text-[#FF5C00]" strokeWidth={2.4} />
                      <span>{photo.calories} kcal</span>
                    </div>
                  )}
                </div>

                {/* THANH CAPTION ĐÁY HÌNH CHUẨN IOS */}
                {photo.caption && (
                  <div className="absolute bottom-4 left-4 right-4 flex justify-center z-10">
                    <span className="px-4 py-1.5 rounded-full bg-black/55 text-white text-[13px] font-semibold font-display max-w-[85%] text-center truncate">
                      {photo.caption}
                    </span>
                  </div>
                )}
              </div>

              {/* THANH PILL REACTION (w-[330px] h-[46px] rounded-full bg-white) */}
              <div className="mt-3.5 w-[330px] h-[46px] rounded-full bg-white flex items-center justify-between px-2.5 flex-shrink-0">
                {/* Vùng trái 88px: Icon tim biểu tượng */}
                <div className="w-[88px] flex items-center">
                  <div className="w-7 h-7 rounded-full bg-[#DFDACD] flex items-center justify-center text-[#63685F]">
                    <Heart size={13} strokeWidth={2.4} />
                  </div>
                </div>

                {/* Dải 6 Emoji cảm xúc bên phải */}
                <div className="flex items-center gap-1">
                  {REACTION_OPTIONS.map((item) => {
                    const isSelected = currentReaction === item.type;

                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleReactionClick(photo, item.type)}
                        aria-label={`Thả cảm xúc ${item.label}`}
                        className={cn(
                          'w-[32px] h-[32px] rounded-full flex items-center justify-center text-[17px] active:scale-125 transition-all',
                          isSelected && 'bg-[#D4EB70] scale-105'
                        )}
                      >
                        <span>{item.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* THÔNG TIN NGƯỜI GỬI & THỜI GIAN THỰC TẾ (mt-2.5) */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[15px] font-bold font-display text-[#141613]">
                  {isOwn ? 'Bạn' : photo.senderName || 'Bạn'}
                </span>
                <span className="text-[#63685F] text-xs">•</span>
                <span className="text-xs text-[#63685F] font-medium">
                  {formatTimeAgo(photo.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. THANH PHẢN HỒI & NHẬP TIN NHẮN CỐ ĐỊNH Ở ĐÁY (CHUẨN IOS) */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-[398px] px-4 z-30 pointer-events-auto flex flex-col items-center gap-2 select-none"
        style={{ bottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {/* Toast thông báo phản hồi / trạng thái */}
        {toastMessage && (
          <div className="px-4 py-2 rounded-full bg-[#D4EB70] text-[#141613] text-xs font-bold font-display animate-fade-in text-center">
            {toastMessage}
          </div>
        )}

        {/* Thanh nhập tin nhắn h-[50px] capsule */}
        <form
          onSubmit={handleSendMessage}
          className="w-full h-[50px] px-4 rounded-full bg-white flex items-center gap-2.5"
        >
          <MessageCircle size={16} className="text-[#63685F] flex-shrink-0" />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Gửi tin nhắn..."
            className="flex-1 bg-transparent text-[15px] font-medium text-[#141613] placeholder:text-[#63685F] outline-none"
          />
          {commentText.trim().length > 0 && (
            <button
              type="submit"
              aria-label="Gửi phản hồi"
              className="w-7 h-7 rounded-full bg-[#141613] text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            >
              <ArrowUp size={15} strokeWidth={2.4} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
