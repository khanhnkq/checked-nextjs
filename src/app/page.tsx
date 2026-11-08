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
  ShutterFlash,
  ImagePreviewView,
  type FriendOption,
  type StackedCardPhoto,
  type CapturedPhotoData,
  type PreviewSubmitData,
} from '@/components/home';
import { useCameraContext } from '@/contexts/CameraContext';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useConversations } from '@/hooks/useConversations';
import { captureVideoFrame, cropImageFileToSquare } from '@/lib/media/canvas-capture';
import { haptics } from '@/lib/utils/haptics';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhotoData | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Dọn dẹp timer màn trập khi component unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  // Hook Camera WebRTC toàn cục (Global Stream Singleton)
  const camera = useCameraContext();

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

  const { data: feedData, isLoading: isFeedLoading, refetch: refetchFeed } = useGetFeedPhotos(
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

  // Hook Đăng ảnh Multipart & Đồng bộ Feed (Phase 5)
  const { isUploading, uploadPhoto } = usePhotoUpload();

  // Đồng bộ số lượng tin nhắn chưa đọc realtime cho HomeTopBar
  const { unreadTotal } = useConversations({ enabled: !!user });

  const photos: StackedCardPhoto[] = useMemo(() => {
    const list = feedData?.content || [];
    return list.map((p) => ({
      id: p.id || '',
      imageUrl: p.thumbnailUrl || p.imageUrl,
      senderName: p.senderDisplayName,
    }));
  }, [feedData?.content]);

  // Kích hoạt Shutter Flash trắng lóe 120ms chuẩn iOS
  const triggerShutterFlash = () => {
    setIsFlashing(true);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => {
      setIsFlashing(false);
      flashTimerRef.current = null;
    }, 120);
  };

  // Chụp ảnh từ luồng camera WebRTC (crop vuông 1:1 chuẩn xác)
  const handleCapture = async () => {
    haptics.heavy();
    triggerShutterFlash();

    if (camera.status === 'streaming' && camera.videoRef.current) {
      try {
        const photo = await captureVideoFrame(camera.videoRef.current);
        setCapturedPhoto(photo);
      } catch (err) {
        console.error('Lỗi khi chụp ảnh từ video stream:', err);
      }
    } else {
      // Môi trường giả lập khi không có camera phần cứng (Simulator mode)
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext ? canvas.getContext('2d') : null;
        if (ctx) {
          ctx.fillStyle = '#141613';
          ctx.fillRect(0, 0, 1080, 1080);
          ctx.fillStyle = '#D4EB70';
          ctx.font = 'bold 48px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Checked Moment', 540, 540);
        }
        const dataUrl = canvas.toDataURL ? canvas.toDataURL('image/jpeg', 0.9) : 'data:image/jpeg;base64,mock';
        const blob = canvas.toBlob
          ? await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.9);
            })
          : new Blob(['sim-photo'], { type: 'image/jpeg' });
        setCapturedPhoto({ blob, dataUrl, width: 1080, height: 1080 });
      } catch (err) {
        console.warn('Simulator fallback canvas note:', err);
        setCapturedPhoto({
          blob: new Blob(['sim-photo'], { type: 'image/jpeg' }),
          dataUrl: 'data:image/jpeg;base64,mock',
          width: 1080,
          height: 1080,
        });
      }
    }
  };

  // Mở trình chọn ảnh hệ thống (PhotosPicker)
  const handlePhotoLibraryClick = () => {
    haptics.click();
    fileInputRef.current?.click();
  };

  // Nạp ảnh từ Thư viện và tự động crop vuông 1:1
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      triggerShutterFlash();
      const photo = await cropImageFileToSquare(file);
      setCapturedPhoto(photo);
    } catch (err) {
      console.error('Lỗi cắt ảnh album:', err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Đổi giữa camera trước và sau
  const handleFlipCamera = () => {
    haptics.medium();
    camera.toggleFacingMode();
  };

  // Hủy ảnh và quay lại camera live
  const handleDismissPreview = () => {
    setCapturedPhoto(null);
    const isLive = camera.stream?.getVideoTracks().some((t) => !t.readyState || t.readyState === 'live');
    if (!isLive && camera.status !== 'starting' && camera.status !== 'denied') {
      camera.startCamera();
    }
  };

  // Đảm bảo camera được khởi động lại khi quay về Home nếu luồng video bị gián đoạn
  useEffect(() => {
    if (!capturedPhoto) {
      const isLive = camera.stream?.getVideoTracks().some((t) => !t.readyState || t.readyState === 'live');
      if (!isLive && camera.status !== 'starting' && camera.status !== 'denied') {
        camera.startCamera();
      }
    }
  }, [capturedPhoto, camera.stream, camera.status, camera.startCamera]);

  // Gửi ảnh multipart và đồng bộ feed (Phase 5)
  const handleSendPhoto = async (data?: PreviewSubmitData) => {
    if (!capturedPhoto || isUploading) return;

    const result = await uploadPhoto({
      file: capturedPhoto.blob,
      caption: data?.caption,
      amount: data?.amount,
      dishName: data?.dishName,
      calories: data?.calories,
      locationName: data?.locationName,
      latitude: data?.latitude,
      longitude: data?.longitude,
      recipientScope: data?.recipientScope,
      recipientIds: data?.recipientIds,
    });

    if (result) {
      handleDismissPreview();
      refetchFeed();
    }
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
    <>
      {/* Lớp phủ màn trập Shutter Flash trắng lóe 120ms */}
      <ShutterFlash isFlashing={isFlashing} />

      {/* Chuyển đổi trạng thái giữa Live Viewfinder và ImagePreviewView chuẩn 1:1 iOS */}
      {capturedPhoto ? (
        <ImagePreviewView
          photo={capturedPhoto}
          friends={friends}
          isSending={isUploading}
          onDismiss={handleDismissPreview}
          onSend={handleSendPhoto}
        />
      ) : (
        <div
          className="relative w-full h-dvh max-w-[430px] mx-auto bg-[#EDE9DF] flex flex-col justify-between items-center select-none overflow-hidden animate-fadeIn"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 14px)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
          }}
        >
          {/* Hidden file input cho PhotosPicker Album */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
            data-testid="photo-library-input"
          />

          {/* 1. TOP BAR & DROPDOWN BẠN BÈ GẮN API THỰC TẾ */}
          <HomeTopBar
            currentUserAvatar={user?.avatarUrl}
            onAvatarClick={() => router.push('/profile')}
            onChatClick={() => router.push('/messages')}
            chatBadgeCount={unreadTotal}
            friends={friends}
            selectedFriendId={selectedFriendId}
            onSelectFriend={setSelectedFriendId}
            onAddFriendClick={() => router.push('/invite')}
            isLoading={isFriendsLoading}
            className="flex-shrink-0"
          />

          {/* 2. KHUNG CAMERA VUÔNG 1:1 KẾT NỐI WEBRTC */}
          <div className="w-full flex justify-center px-[18px] flex-shrink-0">
            <CameraBox
              videoRef={camera.videoRef}
              stream={camera.stream}
              isLive={camera.status === 'streaming'}
              status={camera.status}
              facingMode={camera.facingMode}
              isFlashOn={camera.isFlashOn}
              onToggleFlash={camera.toggleFlash}
              zoomLevel={camera.zoomLevel}
              onToggleZoom={camera.toggleZoom}
              onRetryPermission={() => camera.startCamera()}
            />
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
      )}
    </>
  );
}
