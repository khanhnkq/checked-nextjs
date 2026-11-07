'use client';

import React from 'react';
import { ChevronLeft, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface ProfileTopBarProps {
  /** Callback khi bấm vào nút Bạn bè */
  onFriendsClick?: () => void;
  /** Callback khi bấm vào nút Cài đặt */
  onSettingsClick?: () => void;
  /** Callback khi bấm nút Thoát (quay lại Camera) */
  onCloseClick?: () => void;
  /** Trạng thái thành viên Gold (tùy chọn - không còn render huy hiệu) */
  isGoldMember?: boolean;
  className?: string;
}

export const ProfileTopBar: React.FC<ProfileTopBarProps> = ({
  onFriendsClick,
  onSettingsClick,
  onCloseClick,
  isGoldMember: _isGoldMember,
  className,
}) => {
  const handleFriends = () => {
    haptics.click();
    onFriendsClick?.();
  };

  const handleSettings = () => {
    haptics.click();
    onSettingsClick?.();
  };

  const handleClose = () => {
    haptics.click();
    onCloseClick?.();
  };

  return (
    <header
      className={cn(
        'w-full h-14 flex items-center justify-between px-4 z-20 select-none flex-shrink-0 bg-transparent',
        className
      )}
    >
      {/* Nút Quay lại / Thoát về Camera bên trái */}
      <button
        type="button"
        aria-label="Quay lại"
        onClick={handleClose}
        className={cn(
          'w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform cursor-pointer border-0 focus:outline-none'
        )}
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
      </button>

      {/* Cụm 2 nút hành động bên phải: Bạn bè, Cài đặt */}
      <div className="flex items-center gap-2">
        {/* Nút Bạn bè */}
        <button
          type="button"
          aria-label="Bạn bè"
          onClick={handleFriends}
          className={cn(
            'w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform cursor-pointer border-0 focus:outline-none'
          )}
        >
          <Users size={20} strokeWidth={2.2} />
        </button>

        {/* Nút Cài đặt */}
        <button
          type="button"
          aria-label="Cài đặt"
          onClick={handleSettings}
          className={cn(
            'w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform cursor-pointer border-0 focus:outline-none'
          )}
        >
          <Settings size={20} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
};
