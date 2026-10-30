'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export interface AppLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

/**
 * AppLogo
 * Logo chính thức của ứng dụng Checked mang biểu tượng chú mèo đỏ đặc trưng.
 * Sử dụng hình ảnh vector tối ưu hóa từ Checked Brand Assets.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  size = 80,
  className,
  priority = false,
  alt = 'Checked Logo',
}) => {
  return (
    <div
      data-testid="app-logo"
      className={cn(
        'relative shrink-0 flex items-center justify-center select-none overflow-hidden',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/icons/icon-192x192.png"
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
