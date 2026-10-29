'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CircleIconButton } from './CircleIconButton';

export interface BaseBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  snapPoints?: (string | number)[];
  activeSnapPoint?: string | number | null;
  setActiveSnapPoint?: (point: string | number | null) => void;
  className?: string;
  showCloseButton?: boolean;
}

export const BaseBottomSheet: React.FC<BaseBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  trigger,
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  className,
  showCloseButton = true,
}) => {
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      shouldScaleBackground={false}
    >
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}

      <Drawer.Portal>
        {/* Flat overlay with zero backdrop-blur */}
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />

        {/* Bottom Sheet Content with zero shadow, solid top hairline border */}
        <Drawer.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 flex flex-col',
            'bg-white rounded-t-[28px] border-t border-[#141613]/12',
            'max-h-[92vh] outline-none select-none pb-safe',
            className
          )}
        >
          {/* Mechanical Drag Handle */}
          <div className="w-full pt-3 pb-2 flex items-center justify-center">
            <div className="w-10 h-1 rounded-full bg-[#141613]/20" />
          </div>

          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-5 py-2 border-b border-[#141613]/8">
              <Drawer.Title className="text-lg font-bold text-[#141613] tracking-tight">
                {title || ''}
              </Drawer.Title>
              {showCloseButton && (
                <CircleIconButton
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  aria-label="Đóng"
                >
                  <X size={18} />
                </CircleIconButton>
              )}
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
