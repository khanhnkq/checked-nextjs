'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, User as UserIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface FriendOption {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface PillFilterDropdownProps {
  friends?: FriendOption[];
  selectedFilterId?: string | null; // null = "Tất cả", "me" = "Bạn", string = friendId
  onSelectFilter?: (id: string | null) => void;
  currentUserAvatar?: string | null;
  onAddFriendClick?: () => void;
  // Custom display overrides (used by PhotoDetailView for active photo sender)
  customTitle?: string;
  customAvatarUrl?: string | null;
  ariaLabel?: string;
  className?: string;
}

/**
 * PillFilterDropdown - Nút Pill và Menu chọn bộ lọc người gửi chuẩn 1:1 iOS
 * - 144x44px con nhộng phẳng, không viền, không đổ bóng, không làm mờ
 * - Menu danh sách có giới hạn chiều cao (max-h-[280px]) cuộn mượt mà không tràn màn hình
 * - Đồng bộ tuyệt đối giữa màn hình Home, History và PhotoDetailView
 */
export const PillFilterDropdown: React.FC<PillFilterDropdownProps> = ({
  friends = [],
  selectedFilterId = null,
  onSelectFilter,
  currentUserAvatar,
  onAddFriendClick,
  customTitle,
  customAvatarUrl,
  ariaLabel = 'Lọc bạn bè',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Tính toán tiêu đề hiển thị
  const displayTitle =
    customTitle !== undefined
      ? customTitle
      : selectedFilterId === null
      ? 'Tất cả'
      : selectedFilterId === 'me'
      ? 'Bạn'
      : friends.find((f) => f.id === selectedFilterId)?.name || 'Bạn bè';

  // Tính toán avatar hiển thị
  const displayAvatar =
    customAvatarUrl !== undefined
      ? customAvatarUrl
      : selectedFilterId === 'me'
      ? currentUserAvatar
      : friends.find((f) => f.id === selectedFilterId)?.avatarUrl;

  const isAll = customTitle === undefined ? selectedFilterId === null : false;

  const handleToggle = () => {
    haptics.click();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (id: string | null) => {
    haptics.click();
    setIsOpen(false);
    onSelectFilter?.(id);
  };

  const handleAddFriend = () => {
    haptics.click();
    setIsOpen(false);
    onAddFriendClick?.();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Dimmed backdrop khi mở menu (chạm ra ngoài để đóng) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        />
      )}

      {/* 1. NÚT PILL CHÍNH (144x44px) - CĂN GIỮA CHUẨN IOS */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={ariaLabel}
        className="relative w-[144px] h-[44px] rounded-full bg-white flex items-center justify-center px-3 active:scale-95 transition-transform flex-shrink-0 z-50 select-none"
      >
        {/* Left Avatar hoặc Icon (24x24px) - Cố định mép trái */}
        <div
          aria-hidden="true"
          className="absolute left-2.5 w-6 h-6 rounded-full bg-[#DFDACD] flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          {displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayAvatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : isAll ? (
            <Users size={12} className="text-[#141613]" />
          ) : (
            <span className="text-[10px] font-bold text-[#141613]">
              {displayTitle.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Center Title - Căn giữa trong khung 144px */}
        <span className="text-sm font-bold text-[#141613] truncate max-w-[72px] text-center">
          {displayTitle}
        </span>

        {/* Right Chevron - Cố định mép phải */}
        <ChevronDown
          size={14}
          className={cn(
            'absolute right-3.5 text-[#141613] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 2. MENU DROPDOWN NỔI CÓ CUỘN (MAX-HEIGHT 280PX) */}
      {isOpen && (
        <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-[184px] rounded-3xl bg-white p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-[280px] overflow-y-auto overscroll-contain flex flex-col gap-1 no-scrollbar pr-0.5">
            {/* Tùy chọn 1: Tất cả */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full h-10 px-2 rounded-full flex items-center gap-2.5 text-sm font-bold text-[#141613] active:bg-[#DFDACD] transition-colors flex-shrink-0 text-left',
                selectedFilterId === null && 'bg-[#D4EB70]'
              )}
            >
              <div
                aria-hidden="true"
                className="w-6 h-6 rounded-full bg-[#DFDACD] flex items-center justify-center flex-shrink-0"
              >
                <Users size={12} className="text-[#141613]" />
              </div>
              <span className="truncate">Tất cả</span>
            </button>

            {/* Tùy chọn 2: Bạn */}
            <button
              type="button"
              onClick={() => handleSelect('me')}
              className={cn(
                'w-full h-10 px-2 rounded-full flex items-center gap-2.5 text-sm font-bold text-[#141613] active:bg-[#DFDACD] transition-colors flex-shrink-0 text-left',
                selectedFilterId === 'me' && 'bg-[#D4EB70]'
              )}
            >
              <div
                aria-hidden="true"
                className="w-6 h-6 rounded-full bg-[#DFDACD] overflow-hidden flex items-center justify-center flex-shrink-0"
              >
                {currentUserAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUserAvatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon size={12} className="text-[#141613]" />
                )}
              </div>
              <span className="truncate">Bạn</span>
            </button>

            {/* Tùy chọn 3: Danh sách bạn bè */}
            {friends.map((friend) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => handleSelect(friend.id)}
                className={cn(
                  'w-full h-10 px-2 rounded-full flex items-center gap-2.5 text-sm font-bold text-[#141613] active:bg-[#DFDACD] transition-colors flex-shrink-0 text-left',
                  selectedFilterId === friend.id && 'bg-[#D4EB70]'
                )}
              >
                <div
                  aria-hidden="true"
                  className="w-6 h-6 rounded-full bg-[#DFDACD] overflow-hidden flex items-center justify-center flex-shrink-0"
                >
                  {friend.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={friend.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-[#141613]">
                      {friend.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="truncate">{friend.name}</span>
              </button>
            ))}

            {/* Tùy chọn 4: Thêm bạn */}
            <button
              type="button"
              onClick={handleAddFriend}
              className="w-full h-10 px-2 rounded-full flex items-center gap-2.5 text-sm font-bold text-[#141613] active:bg-[#DFDACD] transition-colors flex-shrink-0 text-left"
            >
              <div
                aria-hidden="true"
                className="w-6 h-6 rounded-full bg-[#DFDACD] flex items-center justify-center flex-shrink-0"
              >
                <Plus size={12} className="text-[#141613]" />
              </div>
              <span className="truncate">Thêm bạn</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
