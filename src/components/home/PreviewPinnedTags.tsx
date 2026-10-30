'use client';

import React from 'react';
import { CreditCard, Flame, MapPin, Receipt, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';

export interface PreviewPinnedTagsProps {
  // 1. Thẻ Địa điểm
  locationName?: string | null;
  isLocationPinned?: boolean;
  onLocationClick?: () => void;

  // 2. Thẻ Món ăn
  dishName?: string | null;
  isFoodPinned?: boolean;
  onFoodClick?: () => void;

  // 3. Thẻ Giá tiền / Hóa đơn
  priceText?: string | null;
  isPricePinned?: boolean;
  isBill?: boolean;
  onPriceClick?: () => void;

  // 4. Thẻ Calo dinh dưỡng
  calorieText?: string | null;
  isCaloriePinned?: boolean;
  onCalorieClick?: () => void;

  className?: string;
}

/**
 * PreviewPinnedTags
 * Cụm thẻ con nhộng ghim nổi ở góc trên bên trái khung ảnh 1:1.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const PreviewPinnedTags: React.FC<PreviewPinnedTagsProps> = ({
  locationName,
  isLocationPinned = true,
  onLocationClick,
  dishName,
  isFoodPinned = true,
  onFoodClick,
  priceText,
  isPricePinned = true,
  isBill = false,
  onPriceClick,
  calorieText,
  isCaloriePinned = true,
  onCalorieClick,
  className,
}) => {
  const showLocation = isLocationPinned && Boolean(locationName);
  const showFood = isFoodPinned && Boolean(dishName);
  const showPrice = isPricePinned && Boolean(priceText);
  const showCalorie = isCaloriePinned && Boolean(calorieText);

  // Nếu không có tag nào được bật, không cần render container
  if (!showLocation && !showFood && !showPrice && !showCalorie) {
    return null;
  }

  const handleTagClick = (callback?: () => void) => {
    haptics.click();
    if (callback) callback();
  };

  return (
    <div
      data-testid="preview-pinned-tags"
      className={cn(
        'absolute top-3.5 left-3.5 z-20 flex flex-col items-start gap-1.5 pointer-events-auto select-none',
        className
      )}
    >
      {/* 1. THẺ ĐỊA ĐIỂM (Nền Trắng + Icon Định vị) */}
      {showLocation && (
        <button
          type="button"
          onClick={() => handleTagClick(onLocationClick)}
          aria-label={`Địa điểm: ${locationName}`}
          className="h-[30px] px-2.5 rounded-full bg-white text-[#141613] hover:bg-white/95 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
        >
          <MapPin size={12} className="text-[#141613] flex-shrink-0" strokeWidth={2.4} />
          <span className="text-[12px] font-bold font-display max-w-[160px] truncate">
            {locationName}
          </span>
        </button>
      )}

      {/* 2. THẺ MÓN ĂN (Nền Matcha Glow + Icon Ẩm thực) */}
      {showFood && (
        <button
          type="button"
          onClick={() => handleTagClick(onFoodClick)}
          aria-label={`Món ăn: ${dishName}`}
          className="h-[30px] px-2.5 rounded-full bg-[#D4EB70] text-[#141613] hover:bg-[#c5dc60] active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer animate-fadeIn"
        >
          <Utensils size={12} className="text-[#141613] flex-shrink-0" strokeWidth={2.4} />
          <span className="text-[12px] font-bold font-display max-w-[160px] truncate">
            {dishName}
          </span>
        </button>
      )}

      {/* 3. THẺ GIÁ TIỀN HOẶC HÓA ĐƠN (Nền Matcha Glow + Icon Tiền tệ) */}
      {showPrice && (
        <button
          type="button"
          onClick={() => handleTagClick(onPriceClick)}
          aria-label={isBill ? `Hóa đơn: ${priceText}` : `Giá tiền: ${priceText}`}
          className="h-[30px] px-2.5 rounded-full bg-[#D4EB70] text-[#141613] hover:bg-[#c5dc60] active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer animate-fadeIn"
        >
          {isBill ? (
            <Receipt size={12} className="text-[#141613] flex-shrink-0" strokeWidth={2.4} />
          ) : (
            <CreditCard size={12} className="text-[#141613] flex-shrink-0" strokeWidth={2.4} />
          )}
          <span className="text-[12px] font-bold font-display max-w-[140px] truncate">
            {priceText}
          </span>
        </button>
      )}

      {/* 4. THẺ CALO (Nền Trắng + Icon Lửa Cam) */}
      {showCalorie && (
        <button
          type="button"
          onClick={() => handleTagClick(onCalorieClick)}
          aria-label={`Lượng calo: ${calorieText}`}
          className="h-[30px] px-2.5 rounded-full bg-white text-[#141613] hover:bg-white/95 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer animate-fadeIn"
        >
          <Flame size={12} className="text-orange-500 fill-orange-500 flex-shrink-0" />
          <span className="text-[12px] font-bold font-display max-w-[120px] truncate">
            {calorieText}
          </span>
        </button>
      )}
    </div>
  );
};
