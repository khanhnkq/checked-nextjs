'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface SettingsTileProps {
  /** Biểu tượng bên trái */
  icon: React.ReactNode;
  /** Tiêu đề chính */
  title: string;
  /** Tiêu đề phụ (mô tả bên dưới) */
  subtitle?: string;
  /** Giá trị hiển thị bên phải (ví dụ: "Tiếng Việt") */
  value?: string;
  /** Chế độ công tắc toggle */
  isSwitch?: boolean;
  /** Trạng thái bật/tắt của switch */
  switchChecked?: boolean;
  /** Callback khi thay đổi trạng thái switch */
  onSwitchChange?: (checked: boolean) => void;
  /** Callback khi bấm vào tile */
  onClick?: () => void;
  /** Kiểu cảnh báo nguy hiểm (ví dụ: Đăng xuất, Xóa tài khoản) */
  isDestructive?: boolean;
  /** Hiển thị biểu tượng mũi tên chuyển tiếp (mặc định: true nếu có onClick và không phải switch) */
  showChevron?: boolean;
  /** Hiển thị vạch ngăn cách thụt lề 54px */
  showDivider?: boolean;
  /** Trạng thái vô hiệu hóa */
  disabled?: boolean;
  className?: string;
}

export const SettingsTile: React.FC<SettingsTileProps> = ({
  icon,
  title,
  subtitle,
  value,
  isSwitch = false,
  switchChecked = false,
  onSwitchChange,
  onClick,
  isDestructive = false,
  showChevron,
  showDivider = false,
  disabled = false,
  className,
}) => {
  const hasChevron = showChevron !== undefined ? showChevron : Boolean(onClick && !isSwitch);

  const handleClick = () => {
    if (disabled) return;
    if (isSwitch) {
      haptics.light();
      onSwitchChange?.(!switchChecked);
    } else if (onClick) {
      haptics.click();
      onClick();
    }
  };

  const handleSwitchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    haptics.light();
    onSwitchChange?.(!switchChecked);
  };

  const content = (
    <div className="flex items-center gap-3.5 px-4 py-3.5 w-full select-none">
      {/* Icon pill 32x32px */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[18px]',
          isDestructive ? 'bg-[#FF5252]/10 text-[#FF5252]' : 'bg-black/5 text-text-primary'
        )}
      >
        {icon}
      </div>

      {/* Cột Tiêu đề & Phụ đề */}
      <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
        <span
          className={cn(
            'text-[16px] font-medium leading-snug truncate',
            isDestructive ? 'text-[#FF5252]' : 'text-text-primary'
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="text-[12px] text-text-secondary mt-0.5 leading-tight truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* Giá trị text bên phải */}
      {value && (
        <span className="text-[14px] text-text-secondary shrink-0 mr-1">
          {value}
        </span>
      )}

      {/* Switch toggle iOS-style */}
      {isSwitch && (
        <button
          type="button"
          role="switch"
          aria-checked={switchChecked}
          aria-label={title}
          disabled={disabled}
          onClick={handleSwitchClick}
          className={cn(
            'w-12 h-7 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer focus:outline-none shrink-0',
            switchChecked ? 'bg-[#D4EB70]' : 'bg-black/10'
          )}
        >
          <div
            className={cn(
              'w-6 h-6 rounded-full bg-white transition-transform duration-200 ease-out',
              switchChecked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      )}

      {/* Chevron phải */}
      {hasChevron && (
        <ChevronRight
          data-testid="chevron-icon"
          size={18}
          className="text-black/30 shrink-0"
        />
      )}
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      {onClick && !isSwitch ? (
        <button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          aria-label={title}
          className="w-full text-left cursor-pointer active:bg-black/5 transition-colors focus:outline-none block"
        >
          {content}
        </button>
      ) : isSwitch ? (
        <div
          onClick={handleClick}
          className="w-full cursor-pointer active:bg-black/5 transition-colors"
        >
          {content}
        </div>
      ) : (
        <div className="w-full">{content}</div>
      )}

      {/* Inset divider với pl-[54px] */}
      {showDivider && (
        <div className="pl-[54px] w-full">
          <div className="h-[1px] bg-black/5 w-full" />
        </div>
      )}
    </div>
  );
};
