'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface PreviewCaptionBarProps {
  caption: string;
  onCaptionChange: (caption: string) => void;
  onGenerateAICaption?: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * PreviewCaptionBar
 * Thanh capsule nhập tin nhắn mờ 44px ghim đáy khung ảnh 1:1.
 * Có nút Sparkles tự động điền gợi ý Caption thông minh.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const PreviewCaptionBar: React.FC<PreviewCaptionBarProps> = ({
  caption,
  onCaptionChange,
  onGenerateAICaption,
  placeholder = 'Thêm tin nhắn...',
  className,
}) => {
  const handleSparklesClick = () => {
    haptics.medium();
    if (onGenerateAICaption) {
      onGenerateAICaption();
    }
  };

  return (
    <div
      data-testid="preview-caption-bar-container"
      className={cn(
        'absolute bottom-4 left-0 right-0 flex justify-center px-4 pointer-events-auto z-20 select-none',
        className
      )}
    >
      <div
        data-testid="preview-caption-bar"
        className="h-[44px] min-w-[200px] max-w-[300px] w-full rounded-full bg-black/60 px-4 flex items-center gap-2"
      >
        <input
          type="text"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder={placeholder}
          maxLength={100}
          aria-label="Nhập chú thích khoảnh khắc"
          className="bg-transparent text-white placeholder-white/70 text-[14px] font-semibold font-display outline-none flex-1 min-w-0"
        />

        {onGenerateAICaption && (
          <button
            type="button"
            onClick={handleSparklesClick}
            aria-label="Gợi ý caption"
            className="text-white hover:text-[#D4EB70] active:scale-90 transition-transform flex-shrink-0 cursor-pointer p-1"
          >
            <Sparkles size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </div>
  );
};
