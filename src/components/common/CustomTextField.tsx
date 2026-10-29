'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CustomTextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  containerClassName?: string;
}

export const CustomTextField = React.forwardRef<HTMLInputElement, CustomTextFieldProps>(
  (
    {
      label,
      error,
      type = 'text',
      className,
      containerClassName,
      leftIcon,
      rightAction,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label className="text-xs font-bold text-[#63685F] tracking-tight uppercase select-none">
            {label}
          </label>
        )}

        <div
          className={cn(
            'relative flex items-center w-full h-13 px-4 rounded-2xl transition-all duration-150',
            error
              ? 'bg-[#FF6954]/12 text-[#FF6954]'
              : 'bg-[#F2F2F4] focus-within:bg-white',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          {leftIcon && (
            <span className="mr-3 text-[#63685F] flex-shrink-0 flex items-center justify-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            type={computedType}
            disabled={disabled}
            className={cn(
              'w-full h-full bg-transparent text-base text-[#141613] font-medium outline-none',
              'placeholder:text-[#63685F]/60',
              className
            )}
            {...props}
          />

          {isPasswordType ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="ml-2 p-1.5 text-[#63685F] hover:text-[#141613] active:scale-95 transition-transform"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : (
            rightAction && <div className="ml-2 flex-shrink-0">{rightAction}</div>
          )}
        </div>

        {error && (
          <p className="text-xs font-semibold text-[#FF6954] mt-0.5 ml-1">{error}</p>
        )}
      </div>
    );
  }
);

CustomTextField.displayName = 'CustomTextField';

