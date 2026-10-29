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
  senderId?: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  createdAt?: string;
  amount?: number;
  calories?: number;
  note?: string;
  caption?: string;
  locationName?: string;
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

  // Helper kiểm tra ảnh có thuộc về người dùng hiện tại hay không (Chuẩn parity iOS)
  const isCurrentUser = (senderId?: string, senderName?: string): boolean => {
    if (!senderId && !senderName) return false;
    if (senderId === 'me' || senderName === 'Bạn') return true;
    if (currentUser?.id && senderId === currentUser.id) return true;
    if (
      currentUser?.username &&
      senderName &&
      senderName.toLowerCase() === currentUser.username.toLowerCase()
    ) {
      return true;
    }
    if (
      currentUser?.displayName &&
      senderName &&
      senderName.toLowerCase() === currentUser.displayName.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // 2. API: Lấy danh sách bạn bè từ Backend
  const { data: friendsData } = useGetMyFriends({
    query: {
      enabled: !!currentUser,
    },
  });

  // 3. API: Lấy feed ảnh bạn bè (hoặc theo friendId nếu đang chọn bạn cụ thể)
  const isMeFilter = selectedFilterId === 'me';
  const targetFriendId =
    selectedFilterId && selectedFilterId !== 'me' ? selectedFilterId : undefined;

  const { data: feedData, isLoading: isFeedLoading } = useGetFeedPhotos(
    {
      friendId: targetFriendId,
      pageable: { page: 0, size: 50 },
    },
    {
      query: {
        enabled: !!currentUser,
      },
    }
  );

  // 4. API: Lấy ảnh của chính mình
  const { data: myPhotosData, isLoading: isMyPhotosLoading } = useGetMyPhotos(
    {
      pageable: { page: 0, size: 50 },
    },
    {
      query: {
        enabled: !!currentUser,
      },
    }
  );

  // 5. Gộp và khử trùng lặp toàn bộ ảnh (feed bạn bè + ảnh của tôi) chuẩn xác theo createdAt desc
  const allPhotosMap = useMemo(() => {
    const map = new Map<string, HistoryPhotoItem>();

    const addRaw = (p: any) => {
      if (!p || !p.id) return;
      map.set(p.id, {
        id: p.id,
        imageUrl: p.imageUrl || '',
        thumbnailUrl: p.thumbnailUrl || p.imageUrl || '',
        senderId: p.senderId ? String(p.senderId) : undefined,
        senderName: p.senderDisplayName || p.senderUsername,
        senderAvatarUrl: p.senderAvatarUrl,
        createdAt: p.createdAt,
        amount: p.amount,
        calories: p.calories,
        note: p.note,
        caption: p.caption,
        locationName: p.locationName,
      });
    };

    (feedData?.content || []).forEach(addRaw);
    (myPhotosData?.content || []).forEach(addRaw);

    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [feedData?.content, myPhotosData?.content]);

  // 6. Danh sách bạn bè duy nhất cho Dropdown (Friendship list + Sender từ ảnh)
  const friends: FriendOption[] = useMemo(() => {
    const seen = new Set<string>();
    const result: FriendOption[] = [];

    // Danh sách từ API bạn bè
    (friendsData || []).forEach((f: any) => {
      if (!f) return;
      const friendId = f.id ? String(f.id) : '';
      const friendName = f.displayName || f.username || 'Bạn bè';
      if (isCurrentUser(friendId, friendName)) return;

      const key = friendId || friendName;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          id: friendId,
          name: friendName,
          avatarUrl: f.avatarUrl,
        });
      }
    });

    // Bổ sung người gửi từ feed ảnh nếu chưa có trong Friendship
    allPhotosMap.forEach((p) => {
      if (isCurrentUser(p.senderId, p.senderName)) return;
      const key = p.senderId || p.senderName;
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push({
          id: p.senderId || key,
          name: p.senderName || 'Bạn bè',
          avatarUrl: p.senderAvatarUrl,
        });
      }
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [friendsData, allPhotosMap, currentUser]);

  // 7. Lọc ảnh theo Filter Pill đang chọn:
  // - "Tất cả" (null): Trả về toàn bộ ảnh gộp (feed bạn bè + ảnh của tôi)
  // - "Bạn" ('me'): Chỉ ảnh do chính mình gửi
  // - "Tên bạn" (friendId): Chỉ ảnh do người bạn đó gửi
  const photos: HistoryPhotoItem[] = useMemo(() => {
    if (selectedFilterId === null) {
      return allPhotosMap;
    }

    if (selectedFilterId === 'me') {
      return allPhotosMap.filter((p) => isCurrentUser(p.senderId, p.senderName));
    }

    const selectedFriend = friends.find((f) => f.id === selectedFilterId);
    return allPhotosMap.filter((p) => {
      if (p.senderId && p.senderId === selectedFilterId) return true;
      if (selectedFriend && p.senderName) {
        return p.senderName.toLowerCase() === selectedFriend.name.toLowerCase();
      }
      return false;
    });
  }, [allPhotosMap, selectedFilterId, friends, currentUser]);

  const isLoading = isMeFilter ? isMyPhotosLoading : (isFeedLoading && isMyPhotosLoading);

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
      {/* 1. TOP BAR: Back button + Dropdown Pill filter + Chat button */}
      <HistoryTopBar
        friends={friends}
        selectedFilterId={selectedFilterId}
        onSelectFilter={setSelectedFilterId}
        onBackClick={handleReturnToCamera}
        onChatClick={() => {
          haptics.click();
          router.push('/messages');
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

      {/* 4. TRÌNH XEM ẢNH CHI TIẾT VUỐT DỌC NATIVE PRESENTATION CHUẨN IOS */}
      {selectedPhotoId && (
        <PhotoDetailView
          photos={photos}
          allPhotos={allPhotosMap}
          initialPhotoId={selectedPhotoId}
          onDismiss={() => setSelectedPhotoId(null)}
          friends={friends}
          selectedFilterId={selectedFilterId}
          onSelectFilter={setSelectedFilterId}
          onChatClick={() => {
            haptics.click();
            router.push('/messages');
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
