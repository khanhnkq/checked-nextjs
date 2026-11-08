'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SettingsSectionProps {
  /** Tiêu đề đề mục (tùy chọn) */
  title?: string;
  /** Danh sách tile hoặc nội dung bên trong section */
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <section className={cn('w-full flex flex-col', className)}>
      {title && (
        <h3 className="text-[12px] font-semibold text-text-secondary px-3.5 pb-2 pt-1 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="bg-surface rounded-[22px] overflow-hidden">
        {children}
      </div>
    </section>
  );
};
