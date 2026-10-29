'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface CircleIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'surface' | 'subtle' | 'dark' | 'primary' | 'ghost';
  badge?: number | boolean;
  badgeColor?: 'matcha' | 'danger';
}

export const CircleIconButton = React.forwardRef<HTMLButtonElement, CircleIconButtonProps>(
  (
    {
      children,
      className,
      size = 'md',
      variant = 'surface',
      badge,
      badgeColor = 'danger',
      disabled,
      onClick,
      onPointerDown,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!disabled) {
        haptics.click();
      }
      onPointerDown?.(e);
    };

    const sizeStyles = {
      sm: 'w-9 h-9 text-base',
      md: 'w-11 h-11 text-lg', // 44x44 iOS touch target
      lg: 'w-13 h-13 text-xl', // 52x52 Bottom bar
    };

    const variantStyles = {
      surface: 'bg-[#FFFFFF] text-[#141613] active:bg-[#DFDACD]',
      subtle: 'bg-[#DFDACD] text-[#141613] active:bg-[#EDE9DF]',
      dark: 'bg-[#141613] text-[#FFFFFF] active:bg-[#282B24]',
      primary: 'bg-[#D4EB70] text-[#141613] active:bg-[#BFDD4A]',
      ghost: 'bg-transparent text-[#141613] active:bg-[#141613]/8',
    };

    const badgeBg = badgeColor === 'matcha' ? 'bg-[#D4EB70] text-[#141613]' : 'bg-[#FF6954] text-white';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onClick={onClick}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full select-none flex-shrink-0',
          'transition-transform duration-100 ease-out active:scale-[0.92]',
          'disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100',
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}

        {Boolean(badge) && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center font-bold text-[10px] leading-none',
              'min-w-4 h-4 px-1 rounded-full pointer-events-none',
              badgeBg
            )}
          >
            {typeof badge === 'number' ? (badge > 99 ? '99+' : badge) : null}
          </span>
        )}
      </button>
    );
  }
);

CircleIconButton.displayName = 'CircleIconButton';

