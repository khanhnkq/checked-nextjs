'use client';

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import type { ConversationPartner } from '@/types/chat';

export interface ChatRoomTopBarProps {
  partner: ConversationPartner | {
    id?: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isOnline?: boolean;
  };
  isPartnerTyping?: boolean;
  onBack?: () => void;
  onPartnerClick?: () => void;
  className?: string;
}

/**
 * ChatRoomTopBar
 * - Thanh tiêu đề phòng chat 1-on-1 chuẩn 1:1 iOS ChatView
 * - Nút Back tròn 44x44 nền trắng, icon màu đen (#141613)
 * - Header thông tin đối phương: Avatar 38x38 (initials fallback), Tên hiển thị, @username hoặc "đang soạn tin..."
 * - Phản hồi xúc giác haptics + active:scale-95
 * - Zero Border, Zero Shadow
 */
export const ChatRoomTopBar: React.FC<ChatRoomTopBarProps> = ({
  partner,
  isPartnerTyping = false,
  onBack,
  onPartnerClick,
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const displayName = partner.displayName || partner.username || 'Bạn bè';
  const fallbackInitial = (displayName || '?').charAt(0).toUpperCase();

  const handleBack = () => {
    haptics.click();
    onBack?.();
  };

  const handlePartnerClick = () => {
    haptics.click();
    onPartnerClick?.();
  };

  return (
    <header
      data-testid="chat-room-top-bar"
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 select-none bg-canvas',
        className
      )}
    >
      {/* 1. Nút Back tròn 44x44 */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Quay lại"
        className="w-11 h-11 rounded-full bg-surface text-text-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform duration-150"
      >
        <ChevronLeft size={22} strokeWidth={2.5} className="mr-0.5" />
      </button>

      {/* 2. Header thông tin đối phương */}
      <button
        type="button"
        onClick={handlePartnerClick}
        aria-label={`Xem thông tin ${displayName}`}
        className="flex items-center gap-2.5 min-w-0 text-left active:scale-[0.98] transition-transform duration-150"
      >
        <div className="relative shrink-0">
          <div className="w-[38px] h-[38px] rounded-full overflow-hidden bg-surface-subtle flex items-center justify-center shrink-0">
            {partner.avatarUrl && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={partner.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-sm font-bold text-text-primary select-none">
                {fallbackInitial}
              </span>
            )}
          </div>

          {partner.isOnline && (
            <span
              data-testid="online-indicator"
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4E8752] ring-2 ring-canvas"
            />
          )}
        </div>

        <div className="flex flex-col min-w-0 justify-center">
          <span className="font-display font-bold text-[16px] text-text-primary truncate leading-tight">
            {displayName}
          </span>

          {isPartnerTyping ? (
            <span className="text-[12px] font-medium text-text-secondary animate-pulse leading-tight">
              đang soạn tin...
            </span>
          ) : (
            partner.username && (
              <span className="text-[12px] font-normal text-text-secondary truncate leading-tight">
                @{partner.username}
              </span>
            )
          )}
        </div>
      </button>
    </header>
  );
};
