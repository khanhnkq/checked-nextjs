'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => {
    const chars = value.split('').slice(0, length);
    return Array.from({ length }, (_, i) => chars[i] || '');
  });

  useEffect(() => {
    const chars = value.split('').slice(0, length);
    const updated = Array.from({ length }, (_, i) => chars[i] || '');
    setDigits(updated);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const updateOtp = (newDigits: string[]) => {
    setDigits(newDigits);
    const combined = newDigits.join('');
    onChange(combined);
    if (combined.length === length && !newDigits.some((d) => !d)) {
      haptics.success();
      onComplete?.(combined);
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const next = [...digits];
      next[index] = '';
      updateOtp(next);
      return;
    }

    const char = val[val.length - 1]; // Take the latest character
    const next = [...digits];
    next[index] = char;
    updateOtp(next);

    // Auto focus next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const next = Array.from({ length }, (_, i) => pastedData[i] || '');
    updateOtp(next);

    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full" role="group" aria-label="Mã OTP 6 số">
      {Array.from({ length }, (_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digits[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            aria-label={`Số thứ ${index + 1}`}
            className={cn(
              'w-12 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold font-display rounded-2xl',
              'bg-[#F2F2F4] text-[#141613] outline-none transition-all duration-150',
              hasError
                ? 'bg-[#FF6954]/15 text-[#FF6954]'
                : isFilled
                ? 'bg-white text-[#141613]'
                : 'bg-[#F2F2F4] focus:bg-white',
              disabled && 'opacity-50 pointer-events-none'
            )}
          />
        );
      })}
    </div>
  );
};
