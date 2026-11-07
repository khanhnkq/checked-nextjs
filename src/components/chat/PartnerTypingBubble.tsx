'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface PartnerTypingBubbleProps {
  className?: string;
}

/**
 * PartnerTypingBubble
 * - Bong bóng hiển thị đối phương đang soạn tin chuẩn 1:1 iOS ChatView
 * - Căn trái, nền Surface dạng Capsule
 * - 3 chấm nhảy động màu Matcha Glow (#D4EB70)
 * - Zero Border, Zero Shadow
 */
export const PartnerTypingBubble: React.FC<PartnerTypingBubbleProps> = ({ className }) => {
  return (
    <div
      data-testid="partner-typing-bubble"
      className={cn('w-full flex items-center justify-start px-4 py-1 select-none', className)}
    >
      <div className="bg-surface rounded-full px-4 py-2.5 flex items-center gap-1.5">
        <span
          data-testid="typing-dot"
          className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"
        />
        <span
          data-testid="typing-dot"
          className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"
        />
        <span
          data-testid="typing-dot"
          className="w-2 h-2 rounded-full bg-primary animate-bounce"
        />
      </div>
    </div>
  );
};
