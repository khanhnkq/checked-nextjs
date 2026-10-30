'use client';

import React from 'react';
import { CreditCard, Flame, Loader2, MapPin, Pencil, Receipt, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface PreviewActionPillsProps {
  isAnalyzing?: boolean;

  // 1. Món ăn
  hasFood?: boolean;
  isFoodPinned?: boolean;
  onToggleFood?: () => void;
  onEditFood?: () => void;

  // 2. Hóa đơn
  isBill?: boolean;
  isBillPinned?: boolean;
  onToggleBill?: () => void;
  onEditBill?: () => void;

  // 3. Calo
  hasCalories?: boolean;
  isCaloriePinned?: boolean;
  onToggleCalorie?: () => void;
  onEditCalorie?: () => void;

  // 4. Giá tiền
  hasPrice?: boolean;
  isPricePinned?: boolean;
  onTogglePrice?: () => void;
  onEditPrice?: () => void;

  // 5. Vị trí
  isLocationPinned?: boolean;
  onToggleLocation?: () => void;

  className?: string;
}

/**
 * PreviewActionPills
 * Hàng nút con nhộng cuộn ngang (height 44px) hỗ trợ bật/tắt nhanh các Tag trên ảnh.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const PreviewActionPills: React.FC<PreviewActionPillsProps> = ({
  isAnalyzing = false,
  hasFood = false,
  isFoodPinned = true,
  onToggleFood,
  onEditFood,
  isBill = false,
  isBillPinned = true,
  onToggleBill,
  onEditBill,
  hasCalories = false,
  isCaloriePinned = true,
  onToggleCalorie,
  onEditCalorie,
  hasPrice = false,
  isPricePinned = true,
  onTogglePrice,
  onEditPrice,
  isLocationPinned = true,
  onToggleLocation,
  className,
}) => {
  const handleClick = (callback?: () => void) => {
    haptics.click();
    if (callback) callback();
  };

  // 1. Trạng thái AI Vision đang phân tích ảnh
  if (isAnalyzing) {
    return (
      <div
        data-testid="action-pills-analyzing"
        className={cn(
          'w-full flex items-center justify-center px-5 h-[44px] flex-shrink-0 select-none',
          className
        )}
      >
        <div className="h-[44px] px-5 rounded-full bg-white flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-[#141613]" />
          <span className="text-[13px] font-semibold font-display text-[#63685F]">
            AI đang phân tích...
          </span>
        </div>
      </div>
    );
  }

  // 2. Hàng nút thao tác cuộn ngang
  return (
    <div
      data-testid="preview-action-pills"
      className={cn(
        'w-full flex items-center px-5 h-[44px] flex-shrink-0 select-none overflow-x-auto no-scrollbar',
        className
      )}
    >
      <div className="flex items-center gap-2 mx-auto">
        {/* a. Nút Tag Món ăn */}
        <button
          type="button"
          onClick={() => handleClick(hasFood ? onToggleFood : onEditFood)}
          aria-label={isFoodPinned ? 'Ẩn tag món' : 'Ghim tag món'}
          className={cn(
            'h-[44px] px-4 rounded-full flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform text-[14px] font-bold font-display cursor-pointer',
            hasFood && isFoodPinned ? 'bg-[#D4EB70] text-[#141613]' : 'bg-white text-[#141613]'
          )}
        >
          <Utensils size={14} className="text-[#141613]" strokeWidth={2.4} />
          <span>{hasFood ? (isFoodPinned ? 'Tag món' : 'Ghim món') : '+ Món ăn'}</span>
        </button>

        {/* b. Nút Hóa đơn (nếu có Bill) */}
        {isBill && (
          <>
            <button
              type="button"
              onClick={() => handleClick(onToggleBill)}
              aria-label={isBillPinned ? 'Ẩn tag bill' : 'Ghim tag bill'}
              className={cn(
                'h-[44px] px-4 rounded-full flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform text-[14px] font-bold font-display cursor-pointer',
                isBillPinned ? 'bg-[#D4EB70] text-[#141613]' : 'bg-white text-[#141613]'
              )}
            >
              <Receipt size={14} className="text-[#141613]" strokeWidth={2.4} />
              <span>{isBillPinned ? 'Tag bill' : 'Ghim bill'}</span>
            </button>

            {onEditBill && (
              <button
                type="button"
                onClick={() => handleClick(onEditBill)}
                aria-label="Sửa chi tiết bill"
                className="h-[44px] px-4 rounded-full bg-white text-[#141613] flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform text-[14px] font-bold font-display cursor-pointer"
              >
                <Pencil size={14} className="text-[#141613]" strokeWidth={2.4} />
                <span>Sửa bill</span>
              </button>
            )}
          </>
        )}

        {/* c. Nút Tag Calo */}
        <button
          type="button"
          onClick={() => handleClick(hasCalories ? onToggleCalorie : onEditCalorie)}
          aria-label={isCaloriePinned ? 'Ẩn tag calo' : 'Ghim tag calo'}
          className={cn(
            'h-[44px] px-4 rounded-full flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform text-[14px] font-bold font-display cursor-pointer',
            hasCalories && isCaloriePinned ? 'bg-[#D4EB70] text-[#141613]' : 'bg-white text-[#141613]'
          )}
        >
          <Flame size={14} className="text-orange-500 fill-orange-500" />
          <span>{hasCalories ? (isCaloriePinned ? 'Tag calo' : 'Ghim calo') : '+ Calo'}</span>
        </button>

        {/* d. Nút Tag Giá tiền (khi không phải ảnh Hóa đơn) */}
        {!isBill && (
          <button
            type="button"
            onClick={() => handleClick(hasPrice ? onTogglePrice : onEditPrice)}
            aria-label={isPricePinned ? 'Ẩn tag giá' : 'Ghim tag giá'}
            className={cn(
              'h-[44px] px-4 rounded-full flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform text-[14px] font-bold font-display cursor-pointer',
              hasPrice && isPricePinned ? 'bg-[#D4EB70] text-[#141613]' : 'bg-white text-[#141613]'
            )}
          >
            <CreditCard size={14} className="text-[#141613]" strokeWidth={2.4} />
            <span>{hasPrice ? (isPricePinned ? 'Tag giá' : 'Ghim giá') : '+ Giá tiền'}</span>
          </button>
        )}

        {/* e. Nút Tag Vị trí */}
        <button
          type="button"
          onClick={() => handleClick(onToggleLocation)}
          aria-label={isLocationPinned ? 'Ẩn tag vị trí' : 'Ghim tag vị trí'}
          className={cn(
            'h-[44px] px-4 rounded-full flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform text-[14px] font-bold font-display cursor-pointer',
            isLocationPinned ? 'bg-[#D4EB70] text-[#141613]' : 'bg-white text-[#141613]'
          )}
        >
          <MapPin size={14} className="text-[#141613]" strokeWidth={2.4} />
          <span>{isLocationPinned ? 'Tag vị trí' : 'Ghim vị trí'}</span>
        </button>
      </div>
    </div>
  );
};
