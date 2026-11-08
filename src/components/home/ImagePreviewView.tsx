'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader2, Send, Trash2, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { useVisionAnalysis } from '@/hooks/useVisionAnalysis';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePermissionStore } from '@/stores/permission-store';
import { GeminiBrandPill } from './GeminiBrandPill';
import { PreviewPinnedTags } from './PreviewPinnedTags';
import { PreviewCaptionBar } from './PreviewCaptionBar';
import { PreviewActionPills } from './PreviewActionPills';
import {
  PriceEditSheet,
  LocationEditSheet,
  FoodEditSheet,
  CalorieEditSheet,
  BillDetailSheet,
  AudienceSelectSheet,
  parsePriceToNumber,
  type BillItemData,
  type AudienceFriendItem,
} from '@/components/sheets';

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
  isBill?: boolean;
  category?: string;
  billItems?: BillItemData[];
  recipientScope?: 'ALL_FRIENDS' | 'SELECTED_FRIENDS';
  recipientIds?: string[];
  amount?: number;
  calories?: number;
  latitude?: number;
  longitude?: number;
}

export interface ImagePreviewViewProps {
  photo: CapturedPhotoData;
  onDismiss: () => void;
  onSend?: (data?: PreviewSubmitData) => void;
  isSending?: boolean;
  friends?: AudienceFriendItem[];
  initialLocationName?: string;
  initialDishName?: string;
  initialPriceText?: string;
  initialCalorieText?: string;
  initialRecipientScope?: 'ALL_FRIENDS' | 'SELECTED_FRIENDS';
  initialRecipientIds?: string[];
  isBill?: boolean;
  autoAnalyze?: boolean;
  className?: string;
}

const EMPTY_FRIENDS: AudienceFriendItem[] = [];
const EMPTY_RECIPIENTS: string[] = [];

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
  friends = EMPTY_FRIENDS,
  initialLocationName = 'TP. Hồ Chí Minh',
  initialDishName,
  initialPriceText,
  initialCalorieText,
  initialRecipientScope = 'ALL_FRIENDS',
  initialRecipientIds = EMPTY_RECIPIENTS,
  isBill = false,
  autoAnalyze = true,
  className,
}) => {
  // Trạng thái nhập Caption và gợi ý từ AI
  const [caption, setCaption] = useState('');
  const [aiSuggestedCaption, setAiSuggestedCaption] = useState<string | null>(null);

  // Trạng thái Chế độ Hóa đơn (Bill Mode)
  const [isBillMode, setIsBillMode] = useState(isBill);

  // Trạng thái hiển thị 6 Bottom Sheets (Đồng bộ iOS ImagePreviewView.swift)
  const [isShowingBillDetailSheet, setIsShowingBillDetailSheet] = useState(false);
  const [isShowingLocationSheet, setIsShowingLocationSheet] = useState(false);
  const [isShowingFoodSheet, setIsShowingFoodSheet] = useState(false);
  const [isShowingCalorieSheet, setIsShowingCalorieSheet] = useState(false);
  const [isShowingPriceSheet, setIsShowingPriceSheet] = useState(false);
  const [isShowingAudienceSheet, setIsShowingAudienceSheet] = useState(false);

  // Trạng thái chọn đối tượng bạn bè nhận ảnh
  const [recipientScope, setRecipientScope] = useState<'ALL_FRIENDS' | 'SELECTED_FRIENDS'>(
    initialRecipientScope
  );
  const [recipientIds, setRecipientIds] = useState<string[]>(initialRecipientIds);

  // Dữ liệu chi tiết món ăn & hóa đơn
  const [foodCategory, setFoodCategory] = useState<string>('Món ăn');
  const [billCategory, setBillCategory] = useState<string>('Ăn uống');
  const [billItems, setBillItems] = useState<BillItemData[]>([]);

  const cachedLocation = usePermissionStore((state) => state.cachedLocation);
  const locationPermission = usePermissionStore((state) => state.permissions.location);

  const effectiveInitialLocation =
    initialLocationName && initialLocationName !== 'TP. Hồ Chí Minh'
      ? initialLocationName
      : (cachedLocation?.locationName || initialLocationName);

  // Trạng thái Pinned Tags
  const [locationName, setLocationName] = useState(effectiveInitialLocation);
  const [isLocationPinned, setIsLocationPinned] = useState(true);

  const [dishName, setDishName] = useState<string | null>(initialDishName || null);
  const [isFoodPinned, setIsFoodPinned] = useState(true);

  const [priceText, setPriceText] = useState<string | null>(initialPriceText || null);
  const [isPricePinned, setIsPricePinned] = useState(true);

  const [calorieText, setCalorieText] = useState<string | null>(initialCalorieText || null);
  const [isCaloriePinned, setIsCaloriePinned] = useState(true);

  // Hook Định vị GPS Geolocation (Đồng bộ LocationService.swift)
  // Chỉ tự động fetch nếu đã có quyền 'granted' VÀ chưa có cache, không bao giờ pop-up xin quyền bất ngờ
  const geo = useGeolocation({
    autoFetch: Boolean(locationPermission === 'granted' && !cachedLocation),
    defaultLocationName: effectiveInitialLocation,
  });

  // Ref lưu ảnh đã phân tích để chống gọi lại nhiều lần (chống vòng lặp vô hạn)
  const lastAnalyzedPhotoRef = useRef<string | null>(null);

  // Hook Phân tích Thị giác AI Vision (Đồng bộ GeminiVisionProvider.swift)
  const { isAnalyzing, analyzeImage } = useVisionAnalysis({
    targetLanguage: 'vi',
    onSuccess: (data) => {
      haptics.success();
      if (data.is_bill) {
        setIsBillMode(true);
        if (data.merchant_name) setLocationName(data.merchant_name);
        if (data.total_amount_str) setPriceText(data.total_amount_str);
        if (data.category) setBillCategory(data.category);
        if (data.items) {
          setBillItems(
            data.items.map((it, idx) => ({
              id: String(idx + 1),
              name: it.name,
              quantity: it.quantity,
              price: it.price,
            }))
          );
        }
        if (data.suggested_caption) {
          setAiSuggestedCaption(data.suggested_caption);
          setCaption(data.suggested_caption);
        }
      } else if (data.is_food) {
        setDishName(data.dish_name);
        if (data.category) setFoodCategory(data.category);
        if (data.calories) {
          const calStr = `${data.calories} kcal`;
          setCalorieText(calStr);
        }
        if (data.suggested_caption) {
          setAiSuggestedCaption(data.suggested_caption);
          setCaption(data.suggested_caption);
        }
      } else if (data.suggested_caption) {
        setAiSuggestedCaption(data.suggested_caption);
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

  // Tự động phân tích ảnh khi người dùng mở Preview (Chỉ chạy 1 lần duy nhất cho mỗi dataUrl)
  useEffect(() => {
    if (autoAnalyze && photo?.dataUrl && lastAnalyzedPhotoRef.current !== photo.dataUrl) {
      lastAnalyzedPhotoRef.current = photo.dataUrl;
      analyzeImage(photo.dataUrl);
    }
  }, [autoAnalyze, photo?.dataUrl, analyzeImage]);

  // Sinh caption tự động (Đồng bộ 100% với generateAICaption trong ImagePreviewView.swift trên iOS)
  const handleGenerateAICaption = () => {
    haptics.medium();
    if (aiSuggestedCaption && aiSuggestedCaption.trim()) {
      setCaption(aiSuggestedCaption.trim());
    } else if (isBillMode && priceText) {
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
      const parsedAmount = isPricePinned && priceText ? parsePriceToNumber(priceText) : undefined;

      let parsedCal: number | undefined = undefined;
      if (isCaloriePinned && calorieText) {
        const match = calorieText.match(/(\d+)/);
        if (match) parsedCal = parseInt(match[1], 10);
      }

      onSend({
        caption,
        locationName: isLocationPinned ? locationName : undefined,
        dishName: isFoodPinned && dishName ? dishName : undefined,
        priceText: isPricePinned && priceText ? priceText : undefined,
        calorieText: isCaloriePinned && calorieText ? calorieText : undefined,
        amount: parsedAmount && parsedAmount > 0 ? parsedAmount : undefined,
        calories: parsedCal && parsedCal > 0 ? parsedCal : undefined,
        latitude: geo.coords?.latitude ?? undefined,
        longitude: geo.coords?.longitude ?? undefined,
        recipientScope,
        recipientIds: recipientScope === 'SELECTED_FRIENDS' ? recipientIds : undefined,
        isBill: isBillMode,
        category: isBillMode ? billCategory : foodCategory,
        billItems: isBillMode && billItems.length > 0 ? billItems : undefined,
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
            onLocationClick={() => setIsShowingLocationSheet(true)}
            dishName={dishName}
            isFoodPinned={isFoodPinned}
            onFoodClick={() => setIsShowingFoodSheet(true)}
            priceText={priceText}
            isPricePinned={isPricePinned}
            isBill={isBillMode}
            onPriceClick={() => {
              if (isBillMode) {
                setIsShowingBillDetailSheet(true);
              } else {
                setIsShowingPriceSheet(true);
              }
            }}
            calorieText={calorieText}
            isCaloriePinned={isCaloriePinned}
            onCalorieClick={() => setIsShowingCalorieSheet(true)}
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
        onEditFood={() => setIsShowingFoodSheet(true)}
        isBill={isBillMode}
        isBillPinned={isPricePinned}
        onToggleBill={() => setIsPricePinned((prev) => !prev)}
        onEditBill={() => setIsShowingBillDetailSheet(true)}
        hasCalories={Boolean(calorieText)}
        isCaloriePinned={isCaloriePinned}
        onToggleCalorie={() => setIsCaloriePinned((prev) => !prev)}
        onEditCalorie={() => setIsShowingCalorieSheet(true)}
        hasPrice={Boolean(priceText)}
        isPricePinned={isPricePinned}
        onTogglePrice={() => setIsPricePinned((prev) => !prev)}
        onEditPrice={() => setIsShowingPriceSheet(true)}
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
            className="relative inline-flex items-center justify-center select-none outline-none flex-shrink-0 cursor-pointer active:scale-95 transition-transform disabled:opacity-60"
          >
            <div className="w-[86px] h-[86px] rounded-full bg-white flex items-center justify-center">
              <div className="w-[78px] h-[78px] rounded-full bg-[#DFDACD]/60 flex items-center justify-center">
                <div className="w-[66px] h-[66px] rounded-full bg-[#D4EB70] flex items-center justify-center">
                  {isSending ? (
                    <Loader2 size={24} className="text-[#141613] animate-spin" />
                  ) : (
                    <Send size={24} className="text-[#141613] ml-0.5" strokeWidth={2.4} />
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* Nút Chọn Bạn bè (52x52px) */}
          <button
            type="button"
            onClick={() => setIsShowingAudienceSheet(true)}
            aria-label="Chọn người nhận"
            className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform cursor-pointer relative"
          >
            <Users size={22} className="text-[#141613]" strokeWidth={2.2} />
            {recipientScope === 'SELECTED_FRIENDS' && recipientIds.length > 0 && (
              <span
                data-testid="selected-audience-dot"
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#D4EB70]"
              />
            )}
          </button>
        </div>

        {/* Microcopy hướng dẫn dưới nút gửi */}
        <span className="text-[12px] font-semibold font-display text-[#63685F] text-center">
          {recipientScope === 'SELECTED_FRIENDS' && recipientIds.length > 0
            ? `${recipientIds.length} người nhận`
            : 'Gửi cho bạn bè'}
        </span>
      </footer>

      {/* 5. HỆ THỐNG FLAT BOTTOM SHEETS (Chuẩn 1:1 iOS) */}
      {/* Sheet 1: Giá tiền & Chi phí */}
      <PriceEditSheet
        isOpen={isShowingPriceSheet}
        initialPriceText={priceText}
        onConfirm={(_priceNum, formattedText) => {
          setPriceText(formattedText);
          setIsPricePinned(true);
        }}
        onDismiss={() => setIsShowingPriceSheet(false)}
      />

      {/* Sheet 2: Vị trí & Địa điểm */}
      <LocationEditSheet
        isOpen={isShowingLocationSheet}
        initialLocationName={locationName}
        currentGpsPlace={geo.locationName}
        isLocating={geo.isLocating}
        onRefreshGps={geo.refreshLocation}
        onConfirm={(newLocation) => {
          setLocationName(newLocation);
          setIsLocationPinned(true);
          if (geo.coords) {
            usePermissionStore.getState().setCachedLocation({
              coords: geo.coords,
              locationName: newLocation,
              timestamp: Date.now(),
            });
          }
        }}
        onDismiss={() => setIsShowingLocationSheet(false)}
      />

      {/* Sheet 3: Món ăn & Đồ uống */}
      <FoodEditSheet
        isOpen={isShowingFoodSheet}
        initialDishName={dishName}
        initialCategory={foodCategory}
        onConfirm={(newDish, newCategory) => {
          setDishName(newDish);
          setFoodCategory(newCategory);
          setIsFoodPinned(true);
        }}
        onDismiss={() => setIsShowingFoodSheet(false)}
      />

      {/* Sheet 4: Lượng Calo ước tính */}
      <CalorieEditSheet
        isOpen={isShowingCalorieSheet}
        initialCalorieText={calorieText}
        onConfirm={(_calNum, formattedText) => {
          setCalorieText(formattedText);
          setIsCaloriePinned(true);
        }}
        onDismiss={() => setIsShowingCalorieSheet(false)}
      />

      {/* Sheet 5: Chi tiết Hóa đơn & Bóc tách món */}
      <BillDetailSheet
        isOpen={isShowingBillDetailSheet}
        initialMerchantName={locationName}
        initialTotalAmount={parsePriceToNumber(priceText)}
        initialCategory={billCategory}
        initialItems={billItems}
        onConfirm={(payload) => {
          setLocationName(payload.merchantName);
          setPriceText(payload.formattedAmount);
          setBillCategory(payload.category);
          setCaption(payload.suggestedCaption);
          setIsPricePinned(true);
        }}
        onDismiss={() => setIsShowingBillDetailSheet(false)}
      />

      {/* Sheet 6: Chọn người nhận / Bạn bè */}
      <AudienceSelectSheet
        isOpen={isShowingAudienceSheet}
        friends={friends}
        initialScope={recipientScope}
        initialRecipientIds={recipientIds}
        onConfirm={(newScope, newIds) => {
          setRecipientScope(newScope);
          setRecipientIds(newIds || []);
          setIsShowingAudienceSheet(false);
        }}
        onDismiss={() => setIsShowingAudienceSheet(false)}
      />
    </div>
  );
};
