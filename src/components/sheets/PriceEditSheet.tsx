'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Tag } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';
import { BaseBottomSheet, BottomSheetCard } from './BaseBottomSheet';

export interface PriceEditSheetProps {
  isOpen: boolean;
  initialPrice?: number | null;
  initialPriceText?: string | null;
  onConfirm: (price: number, formattedText: string) => void;
  onDismiss: () => void;
  className?: string;
}

const QUICK_PRESETS: { label: string; value: number }[] = [
  { label: '20k', value: 20000 },
  { label: '35k', value: 35000 },
  { label: '50k', value: 50000 },
  { label: '75k', value: 75000 },
  { label: '100k', value: 100000 },
  { label: '150k', value: 150000 },
  { label: '200k', value: 200000 },
];

/**
 * Trích xuất số nguyên từ chuỗi tiền tệ bất kỳ (e.g. "75.000 đ" -> 75000)
 */
export function parsePriceToNumber(val?: string | number | null): number {
  if (typeof val === 'number') return Math.max(0, Math.floor(val));
  if (!val) return 0;
  const digits = String(val).replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Format số tiền sang chuẩn VNĐ (e.g. 75000 -> "75.000 đ")
 */
export function formatVndPrice(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

/**
 * PriceEditSheet (Chỉnh sửa số tiền chi tiêu / giá món ăn chuẩn 1:1 iOS)
 * - Ô nhập số tiền lớn 34px hỗ trợ bàn phím số
 * - Dải chip chọn nhanh mức giá thông dụng: 20k, 35k, 50k, 75k, 100k, 150k, 200k
 * - Tuân thủ tuyệt đối quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */
export const PriceEditSheet: React.FC<PriceEditSheetProps> = ({
  isOpen,
  initialPrice,
  initialPriceText,
  onConfirm,
  onDismiss,
  className,
}) => {
  const [amountString, setAmountString] = useState<string>('');

  // Đồng bộ giá trị khởi tạo khi mở sheet
  useEffect(() => {
    if (isOpen) {
      const parsed = initialPrice ?? parsePriceToNumber(initialPriceText);
      setAmountString(parsed > 0 ? String(parsed) : '');
    }
  }, [isOpen, initialPrice, initialPriceText]);

  const currentNumeric = parsePriceToNumber(amountString);

  const handlePresetClick = (val: number) => {
    haptics.light();
    setAmountString(String(val));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/[^\d]/g, '');
    setAmountString(digitsOnly);
  };

  const handleSave = () => {
    const numeric = parsePriceToNumber(amountString);
    if (numeric > 0) {
      haptics.medium();
      onConfirm(numeric, formatVndPrice(numeric));
    }
    onDismiss();
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title="Giá tiền & Chi phí"
      icon={<CreditCard size={18} strokeWidth={2.4} />}
      actionTitle="Xác nhận & Cập nhật"
      onAction={handleSave}
      className={className}
    >
      {/* 1. Card Ô nhập giá tiền lớn */}
      <BottomSheetCard title="SỐ TIỀN">
        <div className="flex items-baseline gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amountString}
            onChange={handleInputChange}
            placeholder="0"
            aria-label="Nhập số tiền"
            autoFocus
            className="w-full bg-transparent text-[34px] font-black text-[#141613] outline-none placeholder:text-[#141613]/25"
          />
          <span className="text-[20px] font-bold text-[#141613]/50 shrink-0">
            đ
          </span>
        </div>
      </BottomSheetCard>

      {/* 2. Card Các nút gợi ý chọn nhanh mức giá */}
      <BottomSheetCard title="CHỌN NHANH MỨC GIÁ">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_PRESETS.map(({ label, value }) => {
            const isSelected = currentNumeric === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handlePresetClick(value)}
                className={`shrink-0 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#D4EB70] text-[#141613]'
                    : 'bg-[#F4F1EA] text-[#141613]/70 hover:bg-[#EDE9DF]'
                }`}
              >
                <Tag size={12} strokeWidth={2.4} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheetCard>
    </BaseBottomSheet>
  );
};
