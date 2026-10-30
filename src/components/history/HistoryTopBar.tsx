'use client';

import React from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { PillFilterDropdown, type FriendOption } from '@/components/common/PillFilterDropdown';

export interface HistoryTopBarProps {
  friends?: FriendOption[];
  selectedFilterId?: string | null;
  onSelectFilter: (id: string | null) => void;
  onBackClick: () => void;
  onChatClick?: () => void;
  onCalendarClick?: () => void;
  chatBadgeCount?: number;
  onAddFriendClick?: () => void;
  currentUserAvatar?: string | null;
  className?: string;
}

/**
 * HistoryTopBar - Header của màn hình Lịch sử khoảnh khắc
 * - 3 cụm chuẩn iOS đồng bộ 1:1 với HomeTopBar: Nút Back (44x44) bên trái, Nút Pill Dropdown (144x44) ở giữa, Nút Chat (44x44) bên phải
 * - Tuân thủ nguyên tắc Zero Border, Zero Blur, Zero Shadow
 */
export const HistoryTopBar: React.FC<HistoryTopBarProps> = ({
  friends = [],
  selectedFilterId = null,
  onSelectFilter,
  onBackClick,
  onChatClick,
  onCalendarClick,
  chatBadgeCount = 0,
  onAddFriendClick,
  currentUserAvatar,
  className,
}) => {
  return (
    <header
      className={cn(
        'relative w-full h-14 px-5 flex items-center justify-between select-none z-30',
        className
      )}
    >
      {/* 1. Nút Back quay về màn hình camera chính (44x44px) */}
      <button
        type="button"
        onClick={() => {
          haptics.click();
          onBackClick();
        }}
        aria-label="Quay lại"
        className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-95 transition-transform flex-shrink-0"
      >
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>

      {/* 2. Nút Dropdown Pill Filter căn giữa (144x44px) */}
      <PillFilterDropdown
        friends={friends}
        selectedFilterId={selectedFilterId}
        onSelectFilter={onSelectFilter}
        currentUserAvatar={currentUserAvatar}
        onAddFriendClick={onAddFriendClick}
        ariaLabel="Lọc người gửi khoảnh khắc"
      />

      {/* 3. Nút Chat / Tin nhắn bên phải (44x44px) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            haptics.click();
            if (onChatClick) {
              onChatClick();
            } else if (onCalendarClick) {
              onCalendarClick();
            }
          }}
          aria-label="Tin nhắn"
          className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-95 transition-transform flex-shrink-0"
        >
          <MessageCircle size={20} className="text-[#141613]" />
        </button>

        {chatBadgeCount > 0 && (
          <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#FF6954] pointer-events-none" />
        )}
      </div>
    </header>
  );
};
