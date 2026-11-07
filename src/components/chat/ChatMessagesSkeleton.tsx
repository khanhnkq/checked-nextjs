'use client';

import React from 'react';
import { SkeletonBone } from '@/components/common/SkeletonBone';
import { cn } from '@/lib/utils/cn';

export interface ChatMessagesSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * ChatMessagesSkeleton
 * - Khung xương chuyển động (shimmer skeleton) mô phỏng dòng tin nhắn 1-on-1
 * - Các bong bóng so le trái/phải với hình dáng 1:1 bong bóng tin nhắn thật
 * - Đảm bảo CLS = 0 (Cumulative Layout Shift)
 * - Zero Border, Zero Shadow
 */
export const ChatMessagesSkeleton: React.FC<ChatMessagesSkeletonProps> = ({
  count = 6,
  className,
}) => {
  // Mảng chiều rộng ngẫu nhiên mô phỏng các tin nhắn có độ dài ngắn khác nhau
  const widths = ['45%', '65%', '55%', '70%', '40%', '60%'];

  return (
    <div
      data-testid="chat-messages-skeleton"
      className={cn('w-full flex flex-col gap-3 px-4 py-3 select-none', className)}
    >
      {Array.from({ length: count }).map((_, idx) => {
        const isMine = idx % 2 === 1; // So le đối phương (trái) -> mình (phải)
        const bubbleWidth = widths[idx % widths.length];

        return (
          <div
            key={idx}
            data-testid="chat-skeleton-row"
            className={cn('w-full flex items-end', isMine ? 'justify-end' : 'justify-start')}
          >
            <div
              style={{ width: bubbleWidth, minWidth: '120px', maxWidth: '78%' }}
              className={cn(
                'p-3 flex flex-col gap-2',
                isMine
                  ? 'bg-primary/20 rounded-[20px] rounded-br-[6px]'
                  : 'bg-surface rounded-[20px] rounded-bl-[6px]'
              )}
            >
              <SkeletonBone
                height={16}
                className={cn('w-full rounded-md', isMine ? 'bg-primary/30' : undefined)}
              />
              <div className={cn('flex items-center gap-1', isMine ? 'justify-end' : 'justify-start')}>
                <SkeletonBone height={10} width={40} className="rounded" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
