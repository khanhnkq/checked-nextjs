'use client';

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface ProfileHeaderProps {
  /** Tên hiển thị người dùng (mặc định: "Người dùng Checked") */
  displayName?: string;
  /** Username tài khoản (mặc định: "checked") */
  username?: string;
  /** URL ảnh đại diện */
  avatarUrl?: string | null;
  /** Callback khi bấm vào avatar */
  onAvatarClick?: () => void;
  className?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName = 'Người dùng Checked',
  username = 'checked',
  avatarUrl,
  onAvatarClick,
  className,
}) => {
  const handleAvatarClick = () => {
    if (onAvatarClick) {
      haptics.click();
      onAvatarClick();
    }
  };

  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  return (
    <section
      aria-label="Thông tin cá nhân"
      className={cn('flex items-center gap-5 px-6 select-none', className)}
    >
      {/* 1. Avatar tròn 80x80px viền xanh Matcha Glow 2px, padding 3px */}
      <button
        type="button"
        disabled={!onAvatarClick}
        onClick={handleAvatarClick}
        aria-label={`Ảnh đại diện của ${displayName}`}
        className={cn(
          'relative w-20 h-20 rounded-full border-2 border-primary p-[3px] flex items-center justify-center flex-shrink-0',
          'focus:outline-none',
          onAvatarClick
            ? 'cursor-pointer active:scale-95 transition-transform duration-100 ease-out'
            : 'cursor-default'
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-[70px] h-[70px] rounded-full object-cover"
          />
        ) : (
          <div
            data-testid="avatar-fallback"
            className="w-[70px] h-[70px] rounded-full bg-gray-subtle flex items-center justify-center text-text-secondary"
          >
            <UserIcon size={28} strokeWidth={2.2} />
          </div>
        )}
      </button>

      {/* 2. Cột thông tin: Tên hiển thị & @username */}
      <div className="flex flex-col min-w-0">
        <h1 className="text-[24px] font-bold font-display text-text-primary leading-tight truncate">
          {displayName}
        </h1>
        <p className="text-[16px] font-normal text-text-secondary truncate mt-0.5">
          @{cleanUsername}
        </p>
      </div>
    </section>
  );
};
