'use client';

import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface StackedCardPhoto {
  id: string;
  imageUrl?: string;
  senderName?: string;
}

export interface StackedFriendCardsViewProps {
  photos?: StackedCardPhoto[];
  isLoading?: boolean;
  className?: string;
}

export const StackedFriendCardsView: React.FC<StackedFriendCardsViewProps> = ({
  photos = [],
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          'relative w-[96px] h-[74px] flex items-center justify-center cursor-pointer select-none',
          className
        )}
        aria-label="Đang tải ảnh bạn bè xếp chồng"
      >
        <div
          className="absolute w-[60px] h-[60px] rounded-[14px] overflow-hidden -rotate-[16deg] -translate-x-[14px] translate-y-[3px] bg-[#DFDACD]/50 animate-pulse pointer-events-none"
          style={{ zIndex: 1 }}
        />
        <div
          className="absolute w-[60px] h-[60px] rounded-[14px] overflow-hidden rotate-[15deg] translate-x-[14px] -translate-y-[2px] bg-[#DFDACD]/70 animate-pulse pointer-events-none"
          style={{ zIndex: 2 }}
        />
        <div
          className="absolute w-[60px] h-[60px] rounded-[14px] overflow-hidden -rotate-[3deg] bg-white animate-pulse pointer-events-none flex items-center justify-center"
          style={{ zIndex: 3 }}
        >
          <div className="w-5 h-5 rounded-full bg-[#DFDACD]" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        'relative w-[96px] h-[74px] flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform',
        className
      )}
      aria-label="Xem ảnh bạn bè xếp chồng"
    >
      {/* Thẻ 3: Dưới cùng (Góc xoay -16 độ, dịch sang trái) */}
      <div
        className="absolute w-[60px] h-[60px] rounded-[14px] overflow-hidden -rotate-[16deg] -translate-x-[14px] translate-y-[3px] bg-[#D8D0C0] pointer-events-none"
        style={{ zIndex: 1 }}
      >
        {photos[2]?.imageUrl ? (
          <img
            src={photos[2].imageUrl}
            alt="Friend 3"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E6E0D2] to-[#D8D0C0]" />
        )}
      </div>

      {/* Thẻ 2: Ở giữa (Góc xoay +15 độ, dịch sang phải, màu Matcha Glow) */}
      <div
        className="absolute w-[60px] h-[60px] rounded-[14px] overflow-hidden rotate-[15deg] translate-x-[14px] -translate-y-[2px] bg-[#D4EB70] pointer-events-none"
        style={{ zIndex: 2 }}
      >
        {photos[1]?.imageUrl ? (
          <img
            src={photos[1].imageUrl}
            alt="Friend 2"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#D4EB70]/90 to-[#BFDD4A]" />
        )}
      </div>

      {/* Thẻ 1: Trên cùng (Góc xoay -3 độ, chính giữa, có avatar/icon) */}
      <div
        className="absolute w-[60px] h-[60px] rounded-[14px] overflow-hidden -rotate-[3deg] bg-white pointer-events-none flex items-center justify-center"
        style={{ zIndex: 3 }}
      >
        {photos[0]?.imageUrl ? (
          <img
            src={photos[0].imageUrl}
            alt="Friend 1"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#F7F4EC] to-[#DFDACD] flex items-center justify-center">
            <User size={22} className="text-[#63685F]" />
          </div>
        )}
      </div>
    </div>
  );
};
