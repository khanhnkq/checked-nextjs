'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ShutterFlashProps {
  isFlashing: boolean;
  onAnimationEnd?: () => void;
  className?: string;
}

/**
 * ShutterFlash
 * Hiệu ứng màn trập chớp trắng (Shutter Flash) tái hiện 100% cảm giác chụp ảnh của Checked iOS.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const ShutterFlash: React.FC<ShutterFlashProps> = ({
  isFlashing,
  onAnimationEnd,
  className,
}) => {
  return (
    <div
      aria-hidden="true"
      data-testid="shutter-flash"
      onTransitionEnd={onAnimationEnd}
      className={cn(
        'fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-120 ease-out',
        isFlashing ? 'opacity-80' : 'opacity-0',
        className
      )}
    />
  );
};
