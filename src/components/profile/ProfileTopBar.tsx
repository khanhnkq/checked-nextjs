'use client';

import React from 'react';
import { Users, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface ProfileTopBarProps {
  /** Callback khi bấm vào nút Bạn bè */
  onFriendsClick?: () => void;
  /** Callback khi bấm vào nút Cài đặt */
  onSettingsClick?: () => void;
  /** Callback khi bấm nút Thoát (quay lại Camera) */
  onCloseClick?: () => void;
  /** Trạng thái thành viên Gold (mặc định true) */
  isGoldMember?: boolean;
  className?: string;
}

export const ProfileTopBar: React.FC<ProfileTopBarProps> = ({
  onFriendsClick,
  onSettingsClick,
  onCloseClick,
  isGoldMember = true,
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
        'w-full h-11 flex items-center justify-between px-4 z-20 select-none flex-shrink-0',
        className
      )}
    >
      {/* 1. Huy hiệu Checked GOLD bên trái */}
      <div className="flex items-center">
        {isGoldMember && (
          <div
            data-testid="checked-gold-badge"
            className={cn(
              'px-3 py-1 rounded-xl',
              'border-[1.5px] border-primary',
              'text-[12px] font-bold font-display text-primary tracking-wide'
            )}
          >
            Checked GOLD
          </div>
        )}
      </div>

      {/* 2. Cụm 3 nút hành động bên phải (40x40px, active:scale-90) */}
      <div className="flex items-center gap-1">
        {/* Nút Bạn bè */}
        <button
          type="button"
          aria-label="Bạn bè"
          onClick={handleFriends}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full',
            'text-text-primary transition-transform duration-100 ease-out',
            'active:scale-90 focus:outline-none'
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
            'w-10 h-10 flex items-center justify-center rounded-full',
            'text-text-primary transition-transform duration-100 ease-out',
            'active:scale-90 focus:outline-none'
          )}
        >
          <Settings size={20} strokeWidth={2.2} />
        </button>

        {/* Nút Thoát / Đóng về Camera */}
        <button
          type="button"
          aria-label="Thoát về Camera"
          onClick={handleClose}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full',
            'text-text-primary transition-transform duration-100 ease-out',
            'active:scale-90 focus:outline-none'
          )}
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
};
