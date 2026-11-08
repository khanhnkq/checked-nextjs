'use client';

import React, { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { User } from '@/types/user';

export interface ProfileAvatarBannerProps {
  /** Thông tin người dùng hiện tại */
  user: User | null;
  /** Callback tải ảnh đại diện lên */
  onAvatarUpload: (file: File) => void | Promise<void>;
  /** Trạng thái đang tải ảnh lên */
  isUploading?: boolean;
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ProfileAvatarBanner: React.FC<ProfileAvatarBannerProps> = ({
  user,
  onAvatarUpload,
  isUploading = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    haptics.click();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('Dung lượng ảnh tối đa là 5MB');
      e.target.value = '';
      return;
    }

    onAvatarUpload(file);
    e.target.value = '';
  };

  const displayName = user?.displayName || 'Người dùng Checked';
  const username = user?.username ? user.username.replace(/^@/, '') : 'checked';
  const email = user?.email || '';
  const initial = (user?.displayName?.[0] || user?.username?.[0] || 'U').toUpperCase();

  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center py-4 select-none',
        className
      )}
    >
      {/* Container Avatar 80x80px */}
      <div className="relative w-20 h-20 rounded-full flex items-center justify-center">
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div
            data-testid="avatar-fallback"
            className="w-full h-full rounded-full bg-primary flex items-center justify-center text-text-primary text-[28px] font-bold"
          >
            {initial}
          </div>
        )}

        {/* Trạng thái Uploading: Spinner che mờ */}
        {isUploading && (
          <div
            data-testid="avatar-spinner"
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"
          >
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        )}

        {/* Badge nút Camera đổi avatar ở góc dưới bên phải */}
        <button
          type="button"
          aria-label="Đổi ảnh đại diện"
          disabled={isUploading}
          onClick={handleCameraClick}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-90 transition-transform cursor-pointer focus:outline-none"
        >
          <Camera size={15} strokeWidth={2.2} />
        </button>

        {/* Input file ẩn */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          data-testid="avatar-file-input"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Thông tin người dùng: Tên, @username, email */}
      <div className="mt-3 text-center flex flex-col items-center px-4 max-w-full">
        <h2 className="text-[20px] font-bold text-text-primary leading-tight truncate max-w-xs">
          {displayName}
        </h2>
        <p className="text-[14px] font-normal text-text-secondary mt-0.5">
          @{username}
        </p>
        {email && (
          <p className="text-[13px] font-normal text-text-secondary/80 mt-0.5 truncate max-w-xs">
            {email}
          </p>
        )}
      </div>
    </div>
  );
};
