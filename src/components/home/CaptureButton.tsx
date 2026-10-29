'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface CaptureButtonProps {
  onCapture: () => void;
  disabled?: boolean;
  className?: string;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  onCapture,
  disabled = false,
  className,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = () => {
    if (disabled) return;
    setIsPressed(true);
    haptics.heavy();
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (!disabled) {
      onCapture();
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      aria-label="Chụp ảnh khoảnh khắc"
      className={cn(
        'relative inline-flex items-center justify-center select-none outline-none flex-shrink-0 cursor-pointer',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
    >
      {/* Vòng đệm ngoài 86px trắng nổi bật trên nền Oat Milk */}
      <div className="w-[86px] h-[86px] rounded-full bg-white flex items-center justify-center">
        {/* Vòng đệm giữa 78px Sand Dust nhẹ */}
        <div className="w-[78px] h-[78px] rounded-full bg-[#DFDACD]/60 flex items-center justify-center">
          {/* Lõi chụp 66px Matcha Glow tươi sáng */}
          <div
            className={cn(
              'w-[66px] h-[66px] rounded-full bg-[#D4EB70] transition-transform duration-100 ease-out',
              isPressed ? 'scale-[0.88] bg-[#BFDD4A]' : 'scale-100'
            )}
          />
        </div>
      </div>
    </button>
  );
};
