'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface GeminiBrandPillProps {
  isAnalyzing?: boolean;
  className?: string;
}

/**
 * GeminiBrandPill
 * Nhãn thương hiệu Gemini 144x44px trên thanh TopBar của ImagePreviewView.
 * Phản hồi trạng thái AI Vision đang phân tích (isAnalyzing) với nhịp pulse mượt mà.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const GeminiBrandPill: React.FC<GeminiBrandPillProps> = ({
  isAnalyzing = false,
  className,
}) => {
  return (
    <div
      data-testid="gemini-brand-pill"
      aria-label={isAnalyzing ? 'Gemini AI đang phân tích' : 'Gemini AI'}
      className={cn(
        'w-[144px] h-[44px] rounded-full bg-white flex items-center justify-center gap-1.5 select-none transition-colors duration-200',
        className
      )}
    >
      <Sparkles
        size={16}
        data-testid="gemini-sparkles-icon"
        className={cn(
          'transition-transform duration-300',
          isAnalyzing ? 'animate-pulse scale-110 text-[#4E82EE]' : 'text-[#141613]'
        )}
      />
      <span className="text-[15px] font-bold font-display text-[#141613] tracking-tight">
        Gemini
      </span>
      {isAnalyzing && (
        <span
          data-testid="analyzing-indicator"
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-[#D4EB70] animate-ping ml-0.5"
        />
      )}
    </div>
  );
};
