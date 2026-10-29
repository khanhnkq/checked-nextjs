'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
  HomeTopBar,
  CameraBox,
  StackedFriendCardsView,
  CaptureButton,
} from '@/components/home';
import { haptics } from '@/lib/utils/haptics';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  const handleCapture = () => {
    haptics.heavy();
    // Chuyển sang màn hình Preview ảnh hoặc kích hoạt Camera WebRTC ở Sprint 2
  };

  const handlePhotoLibraryClick = () => {
    haptics.click();
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Xử lý nạp ảnh từ thư viện
  };

  const handleFlipCamera = () => {
    haptics.medium();
  };

  const navigateToHistory = () => {
    haptics.click();
    router.push('/history');
  };

  return (
    <div className="relative w-full h-dvh max-w-[430px] mx-auto bg-[#EDE9DF] flex flex-col justify-between items-center select-none overflow-hidden pt-safe pb-safe">
      {/* Hidden file input for Photo Library Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* 1. TOP BAR & DROPDOWN BẠN BÈ CHUẨN IOS */}
      <HomeTopBar
        currentUserAvatar={user?.avatarUrl}
        onAvatarClick={() => router.push('/profile')}
        onChatClick={() => router.push('/messages')}
        chatBadgeCount={0}
        selectedFriendId={selectedFriendId}
        onSelectFriend={setSelectedFriendId}
        onAddFriendClick={() => router.push('/invite')}
        className="pt-1 flex-shrink-0 z-30"
      />

      {/* 2. KHUNG CAMERA VUÔNG 1:1 CĂN GIỮA TUYỆT ĐỐI THEO 2 CHIỀU (X & Y) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-[18px] z-10">
        <div className="pointer-events-auto w-full max-w-[390px] flex justify-center">
          <CameraBox />
        </div>
      </div>

      {/* 3. PHẦN DƯỚI: THẺ BẠN BÈ VÀ CỤM ĐIỀU KHIỂN CHỤP */}
      <div className="w-full flex flex-col items-center gap-3.5 pb-6 flex-shrink-0 z-20 mt-auto">
        {/* Card bạn bè xếp chồng */}
        <button
          type="button"
          onClick={navigateToHistory}
          className="outline-none active:scale-95 transition-transform flex items-center justify-center"
        >
          <StackedFriendCardsView />
        </button>

        {/* Hàng 3 nút: Thư viện (52px) - Nút Chụp Matcha (86px) - Lật Cam (52px) */}
        <footer className="w-full flex flex-col items-center gap-3.5 px-[28px]">
          <div className="w-full flex items-center justify-between">
            {/* Nút Thư viện ảnh (52x52px) */}
            <button
              type="button"
              onClick={handlePhotoLibraryClick}
              aria-label="Chọn từ thư viện"
              className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            >
              <ImageIcon size={22} className="text-[#141613]" strokeWidth={2.2} />
            </button>

            {/* NÚT CHỤP MATCHA GLOW 3 LỚP (86x86px) */}
            <CaptureButton onCapture={handleCapture} />

            {/* Nút lật camera (52x52px) */}
            <button
              type="button"
              onClick={handleFlipCamera}
              aria-label="Lật camera"
              className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            >
              <RotateCcw size={22} className="text-[#141613]" strokeWidth={2.2} />
            </button>
          </div>

          {/* Nút text cuộn Lịch sử khoảnh khắc */}
          <button
            type="button"
            onClick={navigateToHistory}
            className="flex items-center gap-1.5 text-xs font-bold font-display text-[#63685F] hover:text-[#141613] active:scale-95 transition-all pt-0.5"
          >
            <span>Lịch sử khoảnh khắc</span>
            <ChevronDown size={14} className="text-[#63685F]" strokeWidth={2.5} />
          </button>
        </footer>
      </div>
    </div>
  );
}
