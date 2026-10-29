'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'lg',
      isLoading = false,
      fullWidth = true,
      disabled,
      onClick,
      onPointerDown,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled && !isLoading) {
        haptics.click();
      }
      onPointerDown?.(e);
    };

    const variantStyles = {
      primary: 'bg-[#D4EB70] text-[#141613] border border-[#141613]/15 active:bg-[#BFDD4A]',
      secondary: 'bg-[#FFFFFF] text-[#141613] border border-[#141613]/15 active:bg-[#DFDACD]',
      danger: 'bg-[#FF6954] text-white border border-[#141613]/15 active:bg-[#E55340]',
      ghost: 'bg-transparent text-[#141613] border border-transparent active:bg-[#141613]/5',
    };

    const sizeStyles = {
      sm: 'h-10 px-4 text-sm font-semibold',
      md: 'h-12 px-5 text-base font-bold',
      lg: 'h-14 px-6 text-lg font-bold',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        onPointerDown={handlePointerDown}
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center rounded-full select-none font-display tracking-tight',
          'transition-transform duration-100 ease-out active:scale-[0.97]',
          'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : 'w-auto',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              role="status"
              aria-label="Đang tải"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Xử lý...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';
