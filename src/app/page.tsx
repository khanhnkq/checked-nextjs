'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
  useGetCurrentUser,
  useGetMyFriends,
  useGetFeedPhotos,
} from '@/lib/api/generated/endpoints';
import {
  HomeSkeleton,
  HomeTopBar,
  CameraBox,
  StackedFriendCardsView,
  CaptureButton,
  type FriendOption,
  type StackedCardPhoto,
} from '@/components/home';
import { haptics } from '@/lib/utils/haptics';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // 1. API: Đồng bộ thông tin người dùng hiện tại từ Backend
  const { data: userData, isLoading: isUserLoading } = useGetCurrentUser({
    query: {
      enabled: !!user,
    },
  });

  useEffect(() => {
    if (userData) {
      updateUser(userData as any);
    }
  }, [userData, updateUser]);

  // 2. API: Lấy danh sách bạn bè cho Dropdown Pill Filter
  const { data: friendsData, isLoading: isFriendsLoading } = useGetMyFriends({
    query: {
      enabled: !!user,
    },
  });

  const friends: FriendOption[] = useMemo(() => {
    if (!friendsData || !Array.isArray(friendsData)) return [];
    return friendsData.map((f) => ({
      id: f.id || '',
      name: f.displayName || f.username || 'Bạn bè',
      avatarUrl: f.avatarUrl,
    }));
  }, [friendsData]);

  // 3. API: Lấy Feed ảnh bạn bè theo bộ lọc đang chọn
  const targetFriendId = useMemo(() => {
    if (selectedFriendId === 'me') return user?.id;
    return selectedFriendId || undefined;
  }, [selectedFriendId, user?.id]);

  const { data: feedData, isLoading: isFeedLoading } = useGetFeedPhotos(
    {
      friendId: targetFriendId,
      pageable: { page: 0, size: 10 },
    },
    {
      query: {
        enabled: !!user,
      },
    }
  );

  const photos: StackedCardPhoto[] = useMemo(() => {
    const list = feedData?.content || [];
    return list.map((p) => ({
      id: p.id || '',
      imageUrl: p.thumbnailUrl || p.imageUrl,
      senderName: p.senderDisplayName,
    }));
  }, [feedData?.content]);

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

  // Nếu chưa có cache user và đang tải dữ liệu ban đầu -> Hiển thị Skeleton màn hình chính
  if (!user && isUserLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div
      className="relative w-full h-dvh max-w-[430px] mx-auto bg-[#EDE9DF] flex flex-col justify-between items-center select-none overflow-hidden"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 14px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
    >
      {/* Hidden file input for Photo Library Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* 1. TOP BAR & DROPDOWN BẠN BÈ GẮN API THỰC TẾ */}
      <HomeTopBar
        currentUserAvatar={user?.avatarUrl}
        onAvatarClick={() => router.push('/profile')}
        onChatClick={() => router.push('/messages')}
        chatBadgeCount={0}
        friends={friends}
        selectedFriendId={selectedFriendId}
        onSelectFriend={setSelectedFriendId}
        onAddFriendClick={() => router.push('/invite')}
        isLoading={isFriendsLoading}
        className="flex-shrink-0"
      />

      {/* 2. KHUNG CAMERA VUÔNG 1:1 CHUẨN RỘNG RETINA */}
      <div className="w-full flex justify-center px-[18px] flex-shrink-0">
        <CameraBox />
      </div>

      {/* 3. CARD BẠN BÈ XẾP CHỒNG 3D GẮN API FEED ẢNH THỰC TẾ */}
      <div className="w-full flex justify-center items-center flex-shrink-0">
        <button
          type="button"
          onClick={navigateToHistory}
          className="outline-none active:scale-95 transition-transform flex items-center justify-center"
        >
          <StackedFriendCardsView photos={photos} isLoading={isFeedLoading} />
        </button>
      </div>

      {/* 4. BOTTOM CONTROLS CHUẨN LOCKET & CHECKED IOS */}
      <footer className="w-full flex flex-col items-center gap-3.5 px-[28px] flex-shrink-0">
        {/* Hàng 3 nút: Thư viện (52px) - Nút Chụp Matcha (86px) - Lật Cam (52px) */}
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
  );
}
