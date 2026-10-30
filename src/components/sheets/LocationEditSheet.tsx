'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, RotateCw } from 'lucide-react';
import { haptics } from '@/lib/utils/haptics';
import { BaseBottomSheet, BottomSheetCard } from './BaseBottomSheet';

export interface LocationEditSheetProps {
  isOpen: boolean;
  initialLocationName?: string;
  currentGpsPlace?: string | null;
  isLocating?: boolean;
  onRefreshGps?: () => void;
  onConfirm: (locationName: string) => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * LocationEditSheet (Chỉnh sửa địa điểm & vị trí quán ăn chuẩn 1:1 iOS)
 * - Ô nhập tên địa điểm/quán ăn hiển thị
 * - Gợi ý từ vị trí GPS hiện tại với nút "Dùng" nhanh
 * - Nút cập nhật lại GPS với hiệu ứng xoay biểu tượng khi đang định vị
 * - Tuân thủ tuyệt đối quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */
export const LocationEditSheet: React.FC<LocationEditSheetProps> = ({
  isOpen,
  initialLocationName = '',
  currentGpsPlace,
  isLocating = false,
  onRefreshGps,
  onConfirm,
  onDismiss,
  className,
}) => {
  const [inputName, setInputName] = useState<string>(initialLocationName);

  // Đồng bộ lại tên địa điểm khi mở modal
  useEffect(() => {
    if (isOpen) {
      setInputName(initialLocationName || '');
    }
  }, [isOpen, initialLocationName]);

  const handleUseGpsPlace = () => {
    if (currentGpsPlace) {
      haptics.light();
      setInputName(currentGpsPlace);
    }
  };

  const handleRefresh = () => {
    haptics.light();
    if (onRefreshGps) {
      onRefreshGps();
    }
  };

  const handleConfirm = () => {
    const trimmed = inputName.trim();
    if (trimmed) {
      haptics.medium();
      onConfirm(trimmed);
    }
    onDismiss();
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title="Vị trí & Địa điểm"
      icon={<MapPin size={18} strokeWidth={2.4} />}
      actionTitle="Xác nhận & Cập nhật"
      onAction={handleConfirm}
      className={className}
    >
      {/* 1. Card Nhập tên địa điểm hiển thị */}
      <BottomSheetCard title="TÊN ĐỊA ĐIỂM HIỂN THỊ">
        <input
          type="text"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder="Nhập tên quán / địa điểm..."
          aria-label="Tên quán hoặc địa điểm"
          autoFocus
          className="w-full bg-transparent text-[16px] font-semibold text-[#141613] outline-none placeholder:text-[#141613]/30"
        />
      </BottomSheetCard>

      {/* 2. Card Gợi ý từ vị trí GPS */}
      <BottomSheetCard title="GỢI Ý TỪ VỊ TRÍ GPS">
        <div className="flex flex-col gap-3">
          {currentGpsPlace && (
            <button
              type="button"
              onClick={handleUseGpsPlace}
              aria-label={`Dùng địa điểm ${currentGpsPlace}`}
              className="w-full flex items-center justify-between text-left py-1 group active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <Navigation
                  size={15}
                  strokeWidth={2.4}
                  className="text-[#141613] shrink-0"
                />
                <span className="text-[14px] font-semibold text-[#141613] truncate">
                  {currentGpsPlace}
                </span>
              </div>

              <span className="px-2.5 py-1 bg-[#D4EB70] text-[#141613] font-bold text-[12px] rounded-full shrink-0 group-hover:opacity-90">
                Dùng
              </span>
            </button>
          )}

          {onRefreshGps && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLocating}
              aria-label="Cập nhật lại GPS hiện tại"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#141613]/60 hover:text-[#141613] active:text-[#141613] transition-colors self-start"
            >
              <RotateCw
                size={13}
                strokeWidth={2.4}
                className={isLocating ? 'animate-spin' : ''}
              />
              <span>
                {isLocating ? 'Đang định vị...' : 'Cập nhật lại GPS hiện tại'}
              </span>
            </button>
          )}
        </div>
      </BottomSheetCard>
    </BaseBottomSheet>
  );
};
