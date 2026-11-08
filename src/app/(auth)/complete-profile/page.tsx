'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  useUpdateCurrentUserAvatar,
  useUpdateCurrentUserProfile,
} from '@/lib/api/generated/endpoints';
import { useAuthStore } from '@/stores/auth-store';
import { CustomTextField, PrimaryButton } from '@/components/common';

export default function CompleteProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateAvatarMutation = useUpdateCurrentUserAvatar();
  const updateProfileMutation = useUpdateCurrentUserProfile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh');
      return;
    }

    // 1:1 square image processing via HTML Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, 512, 512);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setAvatarBlob(blob);
                setAvatarPreview(URL.createObjectURL(blob));
              }
            },
            'image/jpeg',
            0.85
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalAvatarUrl = user?.avatarUrl || null;

      // 1. Upload avatar if changed
      if (avatarBlob) {
        const avatarFile = new File([avatarBlob], 'avatar.jpg', { type: 'image/jpeg' });
        const avatarRes = await updateAvatarMutation.mutateAsync({
          data: { file: avatarFile },
        });
        finalAvatarUrl = avatarRes.avatarUrl || null;
      }

      // 2. Update profile name
      const names = displayName.trim().split(' ');
      const firstName = names.slice(0, -1).join(' ') || names[0];
      const lastName = names.length > 1 ? names[names.length - 1] : '';

      await updateProfileMutation.mutateAsync({
        data: {
          firstName,
          lastName: lastName || undefined,
          avatarUrl: finalAvatarUrl || undefined,
        },
      });

      // 3. Mark profile completed in local store
      updateUser({
        displayName: displayName.trim(),
        firstName,
        lastName,
        avatarUrl: finalAvatarUrl,
        profileCompleted: true,
      });

      toast.success('Hồ sơ đã hoàn tất');
      router.push('/');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể cập nhật hồ sơ';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#EDE9DF] flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen flex flex-col items-center justify-between px-6 py-10 pt-safe pb-safe">
      {/* Title */}
      <div className="flex flex-col items-center mt-6 text-center">
        <h1 className="text-3xl font-extrabold font-display text-[#141613] tracking-tight mb-2">
          Hồ sơ của bạn
        </h1>
        <p className="text-sm font-medium text-[#63685F]">
          Tạo dấu ấn cá nhân cùng bạn bè
        </p>
      </div>

      {/* Main Avatar & Display Name Input */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-8 my-auto">
        {/* Avatar Picker (120x120px) */}
        <div className="relative group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-30 h-30 rounded-full bg-[#DFDACD] overflow-hidden flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={52} className="text-[#63685F]" />
            )}
          </div>

          {/* Camera Button Badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Chọn ảnh đại diện"
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#D4EB70] flex items-center justify-center active:scale-90 transition-transform"
          >
            <Camera size={18} className="text-[#141613]" strokeWidth={2.4} />
          </button>
        </div>

        {/* Display Name Input */}
        <div className="w-full">
          <CustomTextField
            label="Tên hiển thị"
            placeholder="Tên của bạn"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
      </form>

      {/* Bottom Action */}
      <div className="w-full pb-4">
        <PrimaryButton
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!displayName.trim() || isSubmitting}
        >
          Bắt đầu
        </PrimaryButton>
      </div>
      </div>
    </div>
  );
}

