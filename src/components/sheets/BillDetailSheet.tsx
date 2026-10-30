'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Utensils, Coffee, ShoppingCart, ShoppingBag, Car } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';
import { BaseBottomSheet, BottomSheetCard } from './BaseBottomSheet';
import { parsePriceToNumber, formatVndPrice } from './PriceEditSheet';

export interface BillItemData {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface BillConfirmPayload {
  merchantName: string;
  totalAmount: number;
  category: string;
  formattedAmount: string;
  suggestedCaption: string;
  items?: BillItemData[];
}

export interface BillDetailSheetProps {
  isOpen: boolean;
  initialMerchantName?: string;
  initialTotalAmount?: number;
  initialCategory?: string;
  initialItems?: BillItemData[];
  onConfirm: (payload: BillConfirmPayload) => void;
  onDismiss: () => void;
  className?: string;
}

export const BILL_CATEGORIES = [
  { label: 'Ăn uống', icon: Utensils },
  { label: 'Cafe & Trà', icon: Coffee },
  { label: 'Đi chợ & Siêu thị', icon: ShoppingCart },
  { label: 'Mua sắm', icon: ShoppingBag },
  { label: 'Di chuyển', icon: Car },
];

/**
 * BillDetailSheet (Chi tiết Hóa đơn & Bóc tách món chuẩn 1:1 iOS)
 * - Chỉnh sửa tổng số tiền (Font lớn 34px)
 * - Chỉnh sửa tên cửa hàng / quán ăn
 * - Dải chọn 5 danh mục chi tiêu phổ biến
 * - Danh sách các món đã bóc tách từ Gemini Vision (nếu có)
 * - Tự động cập nhật smart caption: 🧾 [Tên quán] · [Tổng tiền]
 * - Tuân thủ tuyệt đối quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */
export const BillDetailSheet: React.FC<BillDetailSheetProps> = ({
  isOpen,
  initialMerchantName = '',
  initialTotalAmount = 0,
  initialCategory = 'Ăn uống',
  initialItems = [],
  onConfirm,
  onDismiss,
  className,
}) => {
  const [amountString, setAmountString] = useState<string>('');
  const [merchantInput, setMerchantInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Ăn uống');
  const [items, setItems] = useState<BillItemData[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAmountString(initialTotalAmount > 0 ? String(initialTotalAmount) : '');
      setMerchantInput(initialMerchantName || '');
      setSelectedCategory(initialCategory || 'Ăn uống');
      setItems(initialItems && initialItems.length > 0 ? initialItems : []);
    }
  }, [isOpen, initialMerchantName, initialTotalAmount, initialCategory]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/[^\d]/g, '');
    setAmountString(digitsOnly);
  };

  const handleCategorySelect = (cat: string) => {
    haptics.light();
    setSelectedCategory(cat);
  };

  const handleConfirm = () => {
    const numericAmount = parsePriceToNumber(amountString);
    const cleanedMerchant = merchantInput.trim();
    const formatted = formatVndPrice(numericAmount);

    haptics.medium();
    onConfirm({
      merchantName: cleanedMerchant,
      totalAmount: numericAmount,
      category: selectedCategory,
      formattedAmount: formatted,
      suggestedCaption: cleanedMerchant ? `🧾 ${cleanedMerchant} · ${formatted}` : `🧾 ${formatted}`,
      items,
    });
    onDismiss();
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title="Chi tiết Hóa đơn"
      icon={<Receipt size={18} strokeWidth={2.4} />}
      actionTitle="Xác nhận & Cập nhật"
      onAction={handleConfirm}
      className={className}
    >
      {/* 1. Card Tổng tiền & Tên cửa hàng */}
      <BottomSheetCard>
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold text-[#141613]/50 uppercase tracking-wider">
            TỔNG TIỀN THANH TOÁN
          </span>

          <div className="flex items-baseline gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amountString}
              onChange={handleAmountChange}
              placeholder="0"
              aria-label="Tổng tiền thanh toán"
              className="w-full bg-transparent text-[34px] font-black text-[#141613] outline-none placeholder:text-[#141613]/25"
            />
            <span className="text-[20px] font-bold text-[#141613]/50 shrink-0">
              đ
            </span>
          </div>

          {/* Dải phân cách mờ phẳng (Zero Border) */}
          <div className="w-full h-[1px] bg-black/5 my-1" />

          <span className="text-[11px] font-bold text-[#141613]/50 uppercase tracking-wider">
            CỬA HÀNG / QUÁN ĂN
          </span>

          <input
            type="text"
            value={merchantInput}
            onChange={(e) => setMerchantInput(e.target.value)}
            placeholder="Tên cửa hàng..."
            aria-label="Tên cửa hàng"
            className="w-full bg-transparent text-[16px] font-semibold text-[#141613] outline-none placeholder:text-[#141613]/30"
          />
        </div>
      </BottomSheetCard>

      {/* 2. Card Danh mục chi tiêu */}
      <BottomSheetCard title="DANH MỤC">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {BILL_CATEGORIES.map(({ label, icon: Icon }) => {
            const isSelected = selectedCategory === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleCategorySelect(label)}
                className={`shrink-0 px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[13px] font-semibold transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#D4EB70] text-[#141613]'
                    : 'bg-[#F4F1EA] text-[#141613]/70 hover:bg-[#EDE9DF]'
                }`}
              >
                <Icon size={13} strokeWidth={2.4} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheetCard>

      {/* 3. Card Danh sách món đã bóc tách (Nếu có) */}
      {items.length > 0 && (
        <BottomSheetCard title={`CÁC MÓN ĐÃ BÓC TÁCH (${items.length})`}>
          <div className="flex flex-col gap-2 pt-1">
            {items.map((item, idx) => (
              <div
                key={item.id || `${item.name}-${idx}`}
                className="flex items-center justify-between py-1 text-left"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-[13px] font-bold text-[#141613]/50 w-7 shrink-0">
                    {item.quantity}x
                  </span>
                  <span className="text-[14px] font-medium text-[#141613] truncate">
                    {item.name}
                  </span>
                </div>

                <span className="text-[14px] font-semibold text-[#141613] shrink-0">
                  {formatVndPrice(item.price)}
                </span>
              </div>
            ))}
          </div>
        </BottomSheetCard>
      )}
    </BaseBottomSheet>
  );
};
