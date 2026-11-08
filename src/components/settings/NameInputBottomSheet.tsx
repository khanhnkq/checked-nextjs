'use client';

import React, { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { BaseBottomSheet } from '@/components/sheets/BaseBottomSheet';

export interface NameInputBottomSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  currentFirstName?: string;
  currentLastName?: string;
  onSave: (firstName: string, lastName: string) => Promise<void> | void;
  className?: string;
}

/**
 * NameInputBottomSheet
 * - Chỉnh sửa thông tin họ & tên (First name & Last name)
 * - Tuân thủ Checked Design System: Zero Border, Zero Shadow, Zero Blur
 * - Thẻ input rounded-[18px], p-3.5, nền trắng surface
 * - Nút lưu Matcha Glow #D4EB70 cao 52px rounded-full
 */
export const NameInputBottomSheet: React.FC<NameInputBottomSheetProps> = ({
  isOpen,
  onDismiss,
  currentFirstName = '',
  currentLastName = '',
  onSave,
  className,
}) => {
  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFirstName(currentFirstName ?? '');
      setLastName(currentLastName ?? '');
      setIsSaving(false);
    }
  }, [isOpen, currentFirstName, currentLastName]);

  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const isSaveDisabled = trimmedFirstName.length === 0 || isSaving;

  const handleSave = async () => {
    if (isSaveDisabled) return;

    haptics.click();
    setIsSaving(true);
    try {
      await onSave(trimmedFirstName, trimmedLastName);
      onDismiss();
    } catch {
      // Giữ nguyên trạng thái để người dùng có thể thử lại
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title="Chỉnh sửa họ & tên"
      icon={<User size={18} strokeWidth={2.4} />}
      className={className}
    >
      <div className="space-y-3">
        {/* Card Họ và tên đệm */}
        <div className="w-full bg-[#FFFFFF] rounded-[18px] p-3.5 flex flex-col gap-1.5">
          <label htmlFor="lastNameInput" className="text-[12px] font-semibold text-[#5C5F56]">
            Họ và tên đệm
          </label>
          <input
            id="lastNameInput"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Họ và tên đệm (Last name)"
            maxLength={50}
            data-testid="last-name-input"
            className="w-full bg-transparent text-[16px] font-semibold text-[#141613] outline-none placeholder:text-[#141613]/30"
          />
        </div>

        {/* Card Tên (Bắt buộc) */}
        <div className="w-full bg-[#FFFFFF] rounded-[18px] p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="firstNameInput" className="text-[12px] font-semibold text-[#5C5F56]">
              Tên
            </label>
            <span className="text-[11px] font-medium text-[#FF5252]">* Bắt buộc</span>
          </div>
          <input
            id="firstNameInput"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Tên (First name)"
            maxLength={50}
            data-testid="first-name-input"
            className="w-full bg-transparent text-[16px] font-semibold text-[#141613] outline-none placeholder:text-[#141613]/30"
          />
        </div>

        {/* Nút lưu thay đổi Matcha Glow */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={cn(
              'w-full h-[52px] bg-[#D4EB70] text-[#141613] font-bold text-[16px] rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98]',
              isSaveDisabled && 'opacity-50 cursor-not-allowed active:scale-100'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </div>
      </div>
    </BaseBottomSheet>
  );
};
