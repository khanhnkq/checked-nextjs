'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircle, Plus, User as UserIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface FriendOption {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedTitle =
    selectedFriendId === null
      ? 'Tất cả'
      : selectedFriendId === 'me'
      ? 'Bạn'
      : friends.find((f) => f.id === selectedFriendId)?.name || 'Bạn bè';

  const selectedAvatar =
    selectedFriendId === 'me'
      ? currentUserAvatar
      : friends.find((f) => f.id === selectedFriendId)?.avatarUrl;

  const handleToggleDropdown = () => {
    haptics.click();
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSelect = (id: string | null) => {
    haptics.click();
    setIsDropdownOpen(false);
    onSelectFriend?.(id);
  };

  return (
    <>
      {/* Dimmed backdrop when dropdown is open */}
      {isDropdownOpen && (
        <div
          onClick={() => setIsDropdownOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        />
      )}

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
        <div className="relative">
          <button
            type="button"
            onClick={handleToggleDropdown}
            aria-label="Lọc bạn bè"
            className="relative w-[144px] h-[44px] rounded-full bg-white flex items-center justify-center px-3 active:scale-95 transition-transform"
          >
            {/* Left 24px icon or avatar - Ghim cố định mép trái */}
            <div className="absolute left-2.5 w-6 h-6 rounded-full bg-[#DFDACD] flex items-center justify-center overflow-hidden flex-shrink-0">
              {selectedFriendId === null ? (
                <Users size={12} className="text-[#141613]" />
              ) : selectedAvatar ? (
                <img src={selectedAvatar} alt="Friend" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={12} className="text-[#141613]" />
              )}
            </div>

            {/* Center title - Căn giữa tuyệt đối trong khung 144px */}
            <span className="text-sm font-bold text-[#141613] truncate max-w-[72px] text-center">
              {selectedTitle}
            </span>

            {/* Right Chevron - Ghim cố định mép phải */}
            <ChevronDown
              size={14}
              className={cn(
                'absolute right-3.5 text-[#141613] transition-transform duration-200',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Floating Dropdown Popover */}
          {isDropdownOpen && (
            <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-[180px] rounded-3xl bg-white p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Option 1: Tất cả */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full h-10 px-2 rounded-full flex items-center gap-2.5 text-sm font-bold text-[#141613] active:bg-[#DFDACD] transition-colors',
                  selectedFriendId === null && 'bg-[#D4EB70]'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-[#DFDACD] flex items-center justify-center flex-shrink-0">
                  <Users size={12} />
                </div>
                <span>Tất cả</span>
              </button>

              {/* Option 2: Bạn */}
              <button
                type="button"
                onClick={() => handleSelect('me')}
                className={cn(
                  'w-full h-10 px-2 rounded-full flex items-center gap-2.5 text-sm font-bold text-[#141613] active:bg-[#DFDACD] transition-colors',
                  selectedFriendId === 'me' && 'bg-[#D4EB70]'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-[#DFDACD] overflow-hidden flex items-center justify-center flex-shrink-0">
                  {currentUserAvatar ? (
                    <img
                      src={currentUserAvatar}
                      alt="Me"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={12} />
                  )}
                </div>
                <span>Bạn</span>
              </button>

              {/* Friends list */}
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => handleSelect(friend.id)}
                  className={cn(
                    'w-full h-10 px-2 rounded-full flex items-center gap-2.5 text-sm font-bold text-[#141613] active:bg-[#DFDACD] transition-colors',
                    selectedFriendId === friend.id && 'bg-[#D4EB70]'
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-[#DFDACD] overflow-hidden flex items-center justify-center flex-shrink-0">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{friend.name}</span>
                </button>
              ))}

              {/* Add friend button */}
              <button
                type="button"
                onClick={() => {
                  haptics.click();
                  setIsDropdownOpen(false);
                  onAddFriendClick?.();
                }}
                className="w-full h-10 px-2 rounded-full flex items-center gap-2.5 text-sm font-bold text-[#141613] active:bg-[#DFDACD] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#DFDACD] flex items-center justify-center flex-shrink-0">
                  <Plus size={12} />
                </div>
                <span>Thêm bạn</span>
              </button>
            </div>
          )}
        </div>

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

          {/* Badge thông báo màu đỏ hoặc matcha */}
          {chatBadgeCount > 0 && (
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#FF6954] pointer-events-none" />
          )}
        </div>
      </header>
    </>
  );
};
