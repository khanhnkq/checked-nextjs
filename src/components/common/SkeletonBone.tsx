import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SkeletonBoneProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'circle' | 'line' | 'card';
  width?: string | number;
  height?: string | number;
}

export const SkeletonBone: React.FC<SkeletonBoneProps> = ({
  variant = 'line',
  width,
  height,
  className,
  style,
  ...props
}) => {
  const variantStyles = {
    circle: 'rounded-full flex-shrink-0',
    line: 'rounded-md h-3.5 w-full',
    card: 'rounded-2xl w-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-[#DFDACD]/70',
        variantStyles[variant],
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      role="status"
      aria-label="Đang tải dữ liệu"
      {...props}
    />
  );
};

