'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import type { FriendProfile } from '@/types/friendship';

export interface BlockedUserRowProps {
  /** Thông tin người dùng bị chặn */
  user: FriendProfile;
  /** Callback khi người dùng bấm bỏ chặn */
  onUnblock: (userId: string) => void | Promise<void>;
  /** Trạng thái đang thực thi bỏ chặn */
  isUnblocking?: boolean;
  className?: string;
}

/**
 * BlockedUserRow
 * - Hàng hiển thị tài khoản bị chặn trong danh sách Cài đặt (/settings/blocked)
 * - Parity 1:1 với BlockedUsersView.swift trên iOS
 * - Tuân thủ nghiêm ngặt Checked Design System: Zero Border, Zero Shadow, Zero Blur
 */
export const BlockedUserRow: React.FC<BlockedUserRowProps> = ({
  user,
  onUnblock,
  isUnblocking = false,
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const displayName = user.displayName || user.username || 'Người dùng';
  const cleanUsername = user.username ? user.username.replace(/^@/, '') : '';
  const fallbackInitial = (displayName[0] || cleanUsername[0] || '?').toUpperCase();

  const handleUnblockClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isUnblocking) return;
    haptics.click();
    onUnblock(user.id);
  };

  return (
    <div
      className={cn(
        'w-full bg-surface rounded-[18px] p-3.5 flex items-center justify-between gap-3 select-none',
        className
      )}
    >
      {/* 1. Avatar 44x44px tròn với fallback initial */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-surface-subtle flex items-center justify-center">
          {user.avatarUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-[16px] font-bold text-text-primary select-none">
              {fallbackInitial}
            </span>
          )}
        </div>

        {/* 2. Tên hiển thị (font-semibold 15px) và @username (text-secondary 12px) */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <span className="font-semibold text-[15px] text-text-primary truncate leading-tight">
            {displayName}
          </span>
          {cleanUsername && (
            <span className="text-text-secondary text-[12px] truncate leading-normal mt-0.5">
              @{cleanUsername}
            </span>
          )}
        </div>
      </div>

      {/* 3. Nút Bỏ chặn */}
      <button
        type="button"
        onClick={handleUnblockClick}
        disabled={isUnblocking}
        aria-label={`Bỏ chặn ${displayName}`}
        className="rounded-full bg-surface px-4 py-1.5 text-xs font-semibold text-text-primary active:scale-95 transition-transform disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-[76px] h-8 shrink-0"
      >
        {isUnblocking ? (
          <Loader2
            className="animate-spin text-text-primary"
            size={14}
            data-testid="unblocking-spinner"
          />
        ) : (
          'Bỏ chặn'
        )}
      </button>
    </div>
  );
};
