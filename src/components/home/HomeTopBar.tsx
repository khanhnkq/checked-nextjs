'use client';

import React from 'react';
import { MessageCircle, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { PillFilterDropdown, type FriendOption } from '@/components/common/PillFilterDropdown';

export type { FriendOption };

export interface HomeTopBarProps {
  currentUserAvatar?: string | null;
  onAvatarClick: () => void;
  onChatClick: () => void;
  chatBadgeCount?: number;
  friends?: FriendOption[];
  selectedFriendId?: string | null; // null = "Tất cả", "me" = "Bạn", string = friendId
  onSelectFriend?: (friendId: string | null) => void;
  onAddFriendClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * HomeTopBar - Thanh điều hướng trên cùng màn hình chính (Camera)
 * - 3 cụm chuẩn iOS: Nút Avatar (44x44) bên trái, Nút Pill Dropdown (144x44) ở giữa, Nút Chat (44x44) bên phải
 * - Tuân thủ nguyên tắc Zero Border, Zero Blur, Zero Shadow
 */
export const HomeTopBar: React.FC<HomeTopBarProps> = ({
  currentUserAvatar,
  onAvatarClick,
  onChatClick,
  chatBadgeCount = 0,
  friends = [],
  selectedFriendId = null,
  onSelectFriend,
  onAddFriendClick,
  isLoading = false,
  className,
}) => {
  return (
    <header
      className={cn(
        'relative w-full h-14 flex items-center justify-between px-5 z-50 select-none',
        className
      )}
    >
      {/* 1. Nút Avatar Profile bên trái (44x44px) */}
      <button
        type="button"
        onClick={() => {
          haptics.click();
          onAvatarClick();
        }}
        aria-label="Hồ sơ cá nhân"
        className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0 active:scale-95 transition-transform"
      >
        {currentUserAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUserAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon size={20} className="text-[#141613]" />
        )}
      </button>

      {/* 2. Nút Pill Dropdown ở giữa (144x44px) - Căn giữa tuyệt đối chuẩn iOS */}
      <PillFilterDropdown
        friends={friends}
        selectedFilterId={selectedFriendId}
        onSelectFilter={onSelectFriend}
        currentUserAvatar={currentUserAvatar}
        onAddFriendClick={onAddFriendClick}
        ariaLabel="Lọc bạn bè"
      />

      {/* 3. Nút Chat / Tin nhắn bên phải (44x44px) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            haptics.click();
            onChatClick();
          }}
          aria-label="Tin nhắn"
          className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        >
          <MessageCircle size={20} className="text-[#141613]" />
        </button>

        {/* Badge thông báo đỏ */}
        {chatBadgeCount > 0 && (
          <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#FF6954] pointer-events-none" />
        )}
      </div>
    </header>
  );
};
