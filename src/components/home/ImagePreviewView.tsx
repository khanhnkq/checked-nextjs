'use client';

import React, { useState, useEffect } from 'react';
import { Download, Send, Trash2, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { useVisionAnalysis } from '@/hooks/useVisionAnalysis';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeminiBrandPill } from './GeminiBrandPill';
import { PreviewPinnedTags } from './PreviewPinnedTags';
import { PreviewCaptionBar } from './PreviewCaptionBar';
import { PreviewActionPills } from './PreviewActionPills';

export interface CapturedPhotoData {
  blob: Blob;
  dataUrl: string;
  width?: number;
  height?: number;
}

export interface PreviewSubmitData {
  caption: string;
  locationName?: string;
  dishName?: string;
  priceText?: string;
  calorieText?: string;
}

export interface ImagePreviewViewProps {
  photo: CapturedPhotoData;
  onDismiss: () => void;
  onSend?: (data?: PreviewSubmitData) => void;
  isSending?: boolean;
  initialLocationName?: string;
  initialDishName?: string;
  initialPriceText?: string;
  initialCalorieText?: string;
  isBill?: boolean;
  autoAnalyze?: boolean;
  className?: string;
}

/**
 * ImagePreviewView (Màn hình xem trước ảnh chụp chuẩn 1:1 iOS)
 * Ghép nối TopBar, Khung ảnh 1:1, Pinned Tags, Caption Bar, Action Pills và Bottom Controls.
 * Tích hợp tự động nhận diện thị giác Google Gemini Flash & định vị GPS.
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow.
 */
export const ImagePreviewView: React.FC<ImagePreviewViewProps> = ({
  photo,
  onDismiss,
  onSend,
  isSending = false,
  initialLocationName = 'TP. Hồ Chí Minh',
  initialDishName,
  initialPriceText,
  initialCalorieText,
  isBill = false,
  autoAnalyze = true,
  className,
}) => {
  // Trạng thái nhập Caption
  const [caption, setCaption] = useState('');

  // Trạng thái Chế độ Hóa đơn (Bill Mode)
  const [isBillMode, setIsBillMode] = useState(isBill);

  // Trạng thái Pinned Tags
  const [locationName, setLocationName] = useState(initialLocationName);
  const [isLocationPinned, setIsLocationPinned] = useState(true);

  const [dishName, setDishName] = useState<string | null>(initialDishName || null);
  const [isFoodPinned, setIsFoodPinned] = useState(true);

  const [priceText, setPriceText] = useState<string | null>(initialPriceText || null);
  const [isPricePinned, setIsPricePinned] = useState(true);

  const [calorieText, setCalorieText] = useState<string | null>(initialCalorieText || null);
  const [isCaloriePinned, setIsCaloriePinned] = useState(true);

  // Hook Định vị GPS Geolocation (Đồng bộ LocationService.swift)
  const geo = useGeolocation({
    autoFetch: true,
    defaultLocationName: initialLocationName,
  });

  // Hook Phân tích Thị giác AI Vision (Đồng bộ GeminiVisionProvider.swift)
  const { isAnalyzing, analyzeImage } = useVisionAnalysis({
    targetLanguage: 'vi',
    onSuccess: (data) => {
      haptics.success();
      if (data.is_bill) {
        setIsBillMode(true);
        if (data.merchant_name) setLocationName(data.merchant_name);
        if (data.total_amount_str) setPriceText(data.total_amount_str);
        if (data.suggested_caption) setCaption(data.suggested_caption);
      } else if (data.is_food) {
        setDishName(data.dish_name);
        if (data.calories) {
          const calStr = `${data.calories} kcal${data.protein_g ? ` · ${data.protein_g}g Đạm` : ''}`;
          setCalorieText(calStr);
        }
        if (data.suggested_caption) setCaption(data.suggested_caption);
      } else if (data.suggested_caption) {
        setCaption(data.suggested_caption);
      }
    },
  });

  // Đồng bộ vị trí từ GPS nếu chưa có tên cửa hàng từ hóa đơn
  useEffect(() => {
    if (geo.locationName && !isBillMode) {
      setLocationName(geo.locationName);
    }
  }, [geo.locationName, isBillMode]);

  // Tự động phân tích ảnh khi người dùng mở Preview
  useEffect(() => {
    if (autoAnalyze && photo?.dataUrl) {
      analyzeImage(photo.dataUrl);
    }
  }, [autoAnalyze, photo?.dataUrl, analyzeImage]);

  // Sinh caption tự động từ các tag đang có (tương tự generateAICaption trên iOS)
  const handleGenerateAICaption = () => {
    haptics.medium();
    if (isBillMode && priceText) {
      setCaption(`🧾 ${locationName} · ${priceText}`);
    } else if (dishName) {
      setCaption(`🍲 ${dishName}${calorieText ? ` · ${calorieText}` : ''}`);
    } else if (locationName) {
      setCaption(`📍 ${locationName}`);
    } else {
      setCaption('✨ Khoảnh khắc Checked');
    }
  };

  const handleDismiss = () => {
    haptics.click();
    onDismiss();
  };

  const handleDownload = () => {
    haptics.click();
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `checked-${Date.now()}.jpg`;
    a.click();
  };

  const handleSend = () => {
    if (isSending) return;
    haptics.heavy();
    if (onSend) {
      onSend({
        caption,
        locationName: isLocationPinned ? locationName : undefined,
        dishName: isFoodPinned && dishName ? dishName : undefined,
        priceText: isPricePinned && priceText ? priceText : undefined,
        calorieText: isCaloriePinned && calorieText ? calorieText : undefined,
      });
    }
  };

  return (
    <div
      data-testid="image-preview-view"
      className={cn(
        'relative w-full h-dvh max-w-[430px] mx-auto bg-[#EDE9DF] flex flex-col justify-between items-center select-none overflow-hidden animate-fadeIn',
        className
      )}
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 14px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
    >
      {/* 1. TOP BAR (Height 44px - Đồng bộ với HomeTopBar & iOS ImagePreviewView) */}
      <header className="w-full flex items-center justify-between px-5 h-[44px] flex-shrink-0">
        {/* Nút Hủy (✕) */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Hủy và chụp lại"
          className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        >
          <X size={20} className="text-[#141613]" strokeWidth={2.4} />
        </button>

        {/* Gemini Brand Pill (Pulse nhịp điệu khi isAnalyzing) */}
        <GeminiBrandPill isAnalyzing={isAnalyzing} />

        {/* Nút Tải về */}
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Tải ảnh về máy"
          className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        >
          <Download size={20} className="text-[#141613]" strokeWidth={2.4} />
        </button>
      </header>

      {/* 2. KHUNG ẢNH VUÔNG 1:1 TRÙNG KHÍT VIEW FINDER (max 390px, bo góc 32px) */}
      <main className="w-full flex justify-center px-[18px] flex-shrink-0">
        <div className="w-full max-w-[390px] aspect-square rounded-[32px] bg-[#141613] relative overflow-hidden select-none flex items-center justify-center">
          {/* Ảnh vừa chụp */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.dataUrl}
            alt="Khoảnh khắc vừa chụp"
            className="w-full h-full object-cover"
          />

          {/* Cụm Pinned Tags ghim góc trên trái ảnh */}
          <PreviewPinnedTags
            locationName={locationName}
            isLocationPinned={isLocationPinned}
            onLocationClick={() => setIsLocationPinned((prev) => !prev)}
            dishName={dishName}
            isFoodPinned={isFoodPinned}
            onFoodClick={() => setIsFoodPinned((prev) => !prev)}
            priceText={priceText}
            isPricePinned={isPricePinned}
            isBill={isBillMode}
            onPriceClick={() => setIsPricePinned((prev) => !prev)}
            calorieText={calorieText}
            isCaloriePinned={isCaloriePinned}
            onCalorieClick={() => setIsCaloriePinned((prev) => !prev)}
          />

          {/* Thanh nhập Caption Capsule ở đáy ảnh */}
          <PreviewCaptionBar
            caption={caption}
            onCaptionChange={setCaption}
            onGenerateAICaption={handleGenerateAICaption}
          />
        </div>
      </main>

      {/* 3. DẢI ACTION PILLS CUỘN NGANG (Tag món, Sửa bill, Tag calo, Tag giá, Tag vị trí) */}
      <PreviewActionPills
        isAnalyzing={isAnalyzing}
        hasFood={Boolean(dishName)}
        isFoodPinned={isFoodPinned}
        onToggleFood={() => setIsFoodPinned((prev) => !prev)}
        onEditFood={() => {
          if (!dishName) {
            setDishName('Món ngon');
            setIsFoodPinned(true);
          }
        }}
        isBill={isBillMode}
        isBillPinned={isPricePinned}
        onToggleBill={() => setIsPricePinned((prev) => !prev)}
        hasCalories={Boolean(calorieText)}
        isCaloriePinned={isCaloriePinned}
        onToggleCalorie={() => setIsCaloriePinned((prev) => !prev)}
        onEditCalorie={() => {
          if (!calorieText) {
            setCalorieText('500 kcal');
            setIsCaloriePinned(true);
          }
        }}
        hasPrice={Boolean(priceText)}
        isPricePinned={isPricePinned}
        onTogglePrice={() => setIsPricePinned((prev) => !prev)}
        onEditPrice={() => {
          if (!priceText) {
            setPriceText('50.000 đ');
            setIsPricePinned(true);
          }
        }}
        isLocationPinned={isLocationPinned}
        onToggleLocation={() => setIsLocationPinned((prev) => !prev)}
      />

      {/* 4. BOTTOM CONTROLS (Thùng rác - Nút Gửi Matcha Glow 86px - Chọn Bạn bè) */}
      <footer className="w-full flex flex-col items-center gap-2 px-[28px] flex-shrink-0">
        <div className="w-full flex items-center justify-between">
          {/* Nút Hủy / Xóa ảnh (52x52px) */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Xóa ảnh và chụp lại"
            className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform cursor-pointer"
          >
            <Trash2 size={22} className="text-[#141613]" strokeWidth={2.2} />
          </button>

          {/* NÚT GỬI MATCHA GLOW 3 LỚP (86x86px) */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            aria-label="Gửi khoảnh khắc"
            className="relative inline-flex items-center justify-center select-none outline-none flex-shrink-0 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-[86px] h-[86px] rounded-full bg-white flex items-center justify-center">
              <div className="w-[78px] h-[78px] rounded-full bg-[#DFDACD]/60 flex items-center justify-center">
                <div className="w-[66px] h-[66px] rounded-full bg-[#D4EB70] flex items-center justify-center">
                  <Send size={24} className="text-[#141613] ml-0.5" strokeWidth={2.4} />
                </div>
              </div>
            </div>
          </button>

          {/* Nút Chọn Bạn bè (52x52px) */}
          <button
            type="button"
            aria-label="Chọn người nhận"
            className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform cursor-pointer"
          >
            <Users size={22} className="text-[#141613]" strokeWidth={2.2} />
          </button>
        </div>

        {/* Microcopy hướng dẫn dưới nút gửi */}
        <span className="text-[12px] font-semibold font-display text-[#63685F] text-center">
          Gửi cho bạn bè
        </span>
      </footer>
    </div>
  );
};
