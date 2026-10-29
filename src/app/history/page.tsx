'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
  useGetCurrentUser,
  useGetMyFriends,
  useGetFeedPhotos,
  useGetMyPhotos,
} from '@/lib/api/generated/endpoints';
import {
  HistoryTopBar,
  HistoryGridSkeleton,
  HistoryEmptyState,
  PhotoDetailView,
} from '@/components/history';
import type { FriendOption } from '@/components/home';
import { haptics } from '@/lib/utils/haptics';

export interface HistoryPhotoItem {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  createdAt?: string;
  amount?: number;
  calories?: number;
  note?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // 1. API: Lấy thông tin user hiện tại nếu store chưa có
  const { data: userData } = useGetCurrentUser({
    query: {
      enabled: !user,
    },
  });
  const currentUser = user || userData;

  // 2. API: Lấy danh sách bạn bè cho bộ lọc
  const { data: friendsData } = useGetMyFriends({
    query: {
      enabled: !!currentUser,
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

  // 3. API: Lấy danh sách ảnh feed chung hoặc theo bạn bè
  const isMeFilter = selectedFilterId === 'me';
  const targetFriendId = !isMeFilter ? selectedFilterId || undefined : undefined;

  const { data: feedData, isLoading: isFeedLoading } = useGetFeedPhotos(
    {
      friendId: targetFriendId,
      pageable: { page: 0, size: 50 },
    },
    {
      query: {
        enabled: !isMeFilter,
      },
    }
  );

  // 4. API: Lấy ảnh của chính mình nếu chọn bộ lọc "Bạn"
  const { data: myPhotosData, isLoading: isMyPhotosLoading } = useGetMyPhotos(
    {
      pageable: { page: 0, size: 50 },
    },
    {
      query: {
        enabled: isMeFilter,
      },
    }
  );

  const isLoading = isMeFilter ? isMyPhotosLoading : isFeedLoading;

  // Chuẩn hóa danh sách ảnh hiển thị trên lưới 3 cột
  const photos: HistoryPhotoItem[] = useMemo(() => {
    const rawList = isMeFilter
      ? myPhotosData?.content || []
      : feedData?.content || [];

    return rawList.map((p: any) => ({
      id: p.id || '',
      imageUrl: p.imageUrl || '',
      thumbnailUrl: p.thumbnailUrl || p.imageUrl || '',
      senderName: p.senderDisplayName || p.senderUsername,
      senderAvatarUrl: p.senderAvatarUrl,
      createdAt: p.createdAt,
      amount: p.amount,
      calories: p.calories,
      note: p.note,
    }));
  }, [isMeFilter, myPhotosData?.content, feedData?.content]);

  const handlePhotoClick = (photoId: string) => {
    haptics.light();
    setSelectedPhotoId(photoId);
    // Khi PhotoDetailView được tích hợp ở Bước 5, mở modal / fullscreen view
  };

  const handleReturnToCamera = () => {
    haptics.click();
    router.push('/');
  };

  return (
    <div
      className="relative w-full min-h-dvh max-w-[430px] mx-auto bg-[#EDE9DF] flex flex-col items-center select-none overflow-x-hidden"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 14px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
      }}
    >
      {/* 1. TOP BAR: Back button + Dropdown Pill filter + Calendar button */}
      <HistoryTopBar
        friends={friends}
        selectedFilterId={selectedFilterId}
        onSelectFilter={setSelectedFilterId}
        onBackClick={handleReturnToCamera}
        onCalendarClick={() => {
          haptics.click();
          // Điều hướng đến lịch chi tiêu / calo
        }}
        onAddFriendClick={() => router.push('/invite')}
        currentUserAvatar={currentUser?.avatarUrl}
        className="flex-shrink-0"
      />

      {/* 2. NỘI DUNG LƯỚI ẢNH (SCROLLABLE) */}
      <main className="w-full flex-1 pt-3 pb-24">
        {isLoading && photos.length === 0 ? (
          <HistoryGridSkeleton count={12} />
        ) : photos.length === 0 ? (
          <HistoryEmptyState onCaptureClick={handleReturnToCamera} />
        ) : (
          <div
            role="region"
            aria-label="Lưới lịch sử khoảnh khắc"
            className="grid grid-cols-3 gap-1.5 px-2.5 w-full"
          >
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => handlePhotoClick(photo.id)}
                aria-label={`Xem ảnh khoảnh khắc của ${photo.senderName || 'bạn'}`}
                className="aspect-square rounded-[14px] bg-white overflow-hidden relative active:scale-95 transition-transform cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbnailUrl || photo.imageUrl}
                  alt="Khoảnh khắc"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 3. NÚT CAMERA NỔI Ở ĐÁY ĐỂ QUAY VỀ CHỤP ẢNH */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={handleReturnToCamera}
          aria-label="Quay về camera"
          className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-90 transition-transform"
        >
          <Camera size={22} strokeWidth={2.2} />
        </button>
      </div>

      {/* 4. TRÌNH XEM ẢNH CHI TIẾT VUỐT DỌC NATIVE PRESENTATION */}
      {selectedPhotoId && (
        <PhotoDetailView
          photos={photos}
          initialPhotoId={selectedPhotoId}
          onDismiss={() => setSelectedPhotoId(null)}
        />
      )}
    </div>
  );
}
