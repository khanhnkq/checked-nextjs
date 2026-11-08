'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { BaseBottomSheet } from '@/components/sheets/BaseBottomSheet';

export interface DobInputBottomSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  currentDob?: string | null;
  onSave: (dob: string) => Promise<void> | void;
  className?: string;
}

/**
 * Định dạng chuỗi ngày sinh YYYY-MM-DD sang preview tiếng Việt e.g. "15 tháng 08, 2000"
 */
export function formatDobPreview(dobStr: string | null | undefined): string | null {
  if (!dobStr) return null;
  const parts = dobStr.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const padDay = day.padStart(2, '0');
  const padMonth = month.padStart(2, '0');
  return `${padDay} tháng ${padMonth}, ${year}`;
}

/**
 * Kiểm tra ngày sinh hợp lệ và bắt buộc phải ở trong quá khứ
 */
export function isValidPastDate(val: string | null | undefined): boolean {
  if (!val) return false;
  const date = new Date(val);
  if (isNaN(date.getTime())) return false;
  return date < new Date();
}

/**
 * DobInputBottomSheet
 * - Chọn và xác thực ngày sinh (Date of Birth)
 * - Tuân thủ Checked Design System: Zero Border, Zero Shadow, Zero Blur
 * - Thẻ input rounded-[18px], p-3.5, nền trắng surface
 * - Nút lưu "Lưu ngày sinh" Matcha Glow #D4EB70 cao 52px rounded-full
 */
export const DobInputBottomSheet: React.FC<DobInputBottomSheetProps> = ({
  isOpen,
  onDismiss,
  currentDob = null,
  onSave,
  className,
}) => {
  const [dob, setDob] = useState<string>(currentDob ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDob(currentDob ?? '');
      setIsSaving(false);
    }
  }, [isOpen, currentDob]);

  const isValid = useMemo(() => isValidPastDate(dob), [dob]);
  const formattedPreview = useMemo(() => formatDobPreview(dob), [dob]);
  const isFutureOrToday = Boolean(dob && !isValid);

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    haptics.click();
    setIsSaving(true);
    try {
      await onSave(dob);
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
      title="Ngày sinh"
      icon={<Calendar size={18} strokeWidth={2.4} />}
      className={className}
    >
      <div className="space-y-3">
        {/* Thẻ nhập ngày sinh */}
        <div className="w-full bg-[#FFFFFF] rounded-[18px] p-3.5 flex flex-col gap-2">
          <label htmlFor="dobInput" className="text-[12px] font-semibold text-[#5C5F56]">
            Chọn ngày sinh
          </label>
          <input
            id="dobInput"
            type="date"
            data-testid="dob-date-input"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full bg-transparent text-[16px] font-semibold text-[#141613] outline-none cursor-pointer"
          />

          {formattedPreview && (
            <div
              data-testid="dob-preview"
              className="text-[13px] font-medium text-[#141613]/70 pt-1"
            >
              {formattedPreview}
            </div>
          )}

          {isFutureOrToday && (
            <div className="text-[12px] font-medium text-[#FF5252] pt-0.5">
              Ngày sinh phải ở trong quá khứ
            </div>
          )}
        </div>

        {/* Nút lưu ngày sinh Matcha Glow */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className={cn(
              'w-full h-[52px] bg-[#D4EB70] text-[#141613] font-bold text-[16px] rounded-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98]',
              (!isValid || isSaving) && 'opacity-50 cursor-not-allowed active:scale-100'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu ngày sinh</span>
            )}
          </button>
        </div>
      </div>
    </BaseBottomSheet>
  );
};
