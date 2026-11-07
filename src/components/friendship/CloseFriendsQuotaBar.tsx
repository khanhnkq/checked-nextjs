'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { CloseFriendsQuota } from '@/types/friendship';

export interface CloseFriendsQuotaBarProps {
  quota: CloseFriendsQuota;
  isCompact?: boolean;
  onUpgradeTap?: () => void;
  className?: string;
}

/**
 * CloseFriendsQuotaBar (Thanh chỉ số Hạn mức Bạn thân chuẩn 1:1 iOS)
 * - Hiển thị quota bạn thân (20 bạn cho Free, 100 bạn cho Gold)
 * - Tự động đổi màu chỉ số: Xanh neon (#D4EB70) -> Cam cảnh báo (#FF9500) -> Đỏ giới hạn (#FF6954)
 * - Nút "Nâng cấp" capsule xuất hiện khi cận kề hoặc đạt giới hạn (chỉ dành cho Free)
 * - Huy hiệu GOLD capsule vàng (#FFD700) với icon vương miện khi là Gold Member
 * - Tuân thủ nguyên tắc thiết kế phẳng: Zero Border, Zero Shadow
 */
export const CloseFriendsQuotaBar: React.FC<CloseFriendsQuotaBarProps> = ({
  quota,
  isCompact = false,
  onUpgradeTap,
  className,
}) => {
  const progressPercent = Math.max(
    6,
    Math.min(100, (quota.progress ?? 0) * 100)
  );

  const progressBgColor = quota.isAtLimit
    ? 'bg-[#FF6954]'
    : quota.isNearLimit
      ? 'bg-[#FF9500]'
      : 'bg-primary';

  return (
    <div
      className={cn(
        'bg-surface rounded-[16px] flex flex-col',
        isCompact ? 'p-3 space-y-1.5' : 'p-3.5 space-y-2',
        className
      )}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between">
        {/* Left: Label & Gold Badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'font-bold text-text-secondary tracking-tight',
              isCompact ? 'text-[11px]' : 'text-[12px]'
            )}
          >
            {quota.isGoldMember ? 'BẠN BÈ GOLD' : 'BẠN BÈ THÂN THIẾT'}
          </span>

          {quota.isGoldMember && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#FFD700] text-black">
              <Crown size={10} className="fill-black" />
              <span className="text-[10px] font-black leading-none">GOLD</span>
            </span>
          )}
        </div>

        {/* Right: Counter & Upgrade Capsule */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-bold font-display',
              isCompact ? 'text-[12px]' : 'text-[13px]',
              quota.isAtLimit ? 'text-error' : 'text-text-primary'
            )}
          >
            {quota.currentCount}/{quota.maxLimit}
          </span>

          {!quota.isGoldMember && (quota.isNearLimit || quota.isAtLimit) && (
            <button
              type="button"
              onClick={onUpgradeTap}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-black active:scale-95 transition-transform"
            >
              <Crown size={10} className="fill-black" />
              <span className="text-[10px] font-bold leading-none">Nâng cấp</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Track & Fill Bar */}
      <div className="w-full h-[6px] rounded-full bg-black/[0.06] overflow-hidden">
        <div
          data-testid="quota-progress-bar"
          className={cn('h-[6px] rounded-full transition-all duration-300', progressBgColor)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
