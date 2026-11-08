'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Calendar,
  Mail,
  Lock,
  UserPlus,
  Users,
  ShieldOff,
  Vibrate,
  Volume2,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useSettingsActions } from '@/hooks/useSettingsActions';
import {
  SettingsTopBar,
  ProfileAvatarBanner,
  SettingsSection,
  SettingsTile,
  NameInputBottomSheet,
  DobInputBottomSheet,
  formatDobPreview,
  LogoutConfirmDialog,
} from '@/components/settings';
import { haptics } from '@/lib/utils/haptics';

/**
 * SettingsPage (/settings)
 * - Màn hình Cài đặt chính đầy đủ tích hợp theo chuẩn Checked Design System
 * - Strictly Zero Border, Zero Shadow, Zero Blur
 * - Parity 1:1 với SettingsView.swift trên iOS
 */
export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  const {
    isUploadingAvatar,
    isLoggingOut,
    updateName,
    updateDob,
    uploadAvatarFile,
    logoutAccount,
  } = useSettingsActions();

  const {
    hapticsEnabled,
    soundEnabled,
    autoSavePhotos,
    toggleHaptics,
    toggleSound,
    toggleAutoSavePhotos,
  } = usePreferencesStore();

  // Local states quản lý mở/đóng các bottom sheets và confirm dialog
  const [isNameSheetOpen, setIsNameSheetOpen] = useState(false);
  const [isDobSheetOpen, setIsDobSheetOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // 1. Route Guard: Chuyển hướng sang /login nếu chưa đăng nhập và đã hydrate
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login?redirect=/settings');
    }
  }, [isHydrated, isAuthenticated, router]);

  // 2. Quay lại trang trước hoặc fallback về /profile
  const handleBack = useCallback(() => {
    haptics.light();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile');
    }
  }, [router]);

  // Tính toán hiển thị tên người dùng
  const displayNameValue =
    user?.displayName ||
    [user?.lastName, user?.firstName].filter(Boolean).join(' ') ||
    '';

  // Định dạng ngày sinh
  const dobValue = formatDobPreview(user?.dob) || 'Chưa thiết lập';

  return (
    <div className="w-full min-h-screen bg-canvas text-text-primary">
      <div className="max-w-md mx-auto min-h-screen flex flex-col pb-12">
        {/* Navigation Bar */}
        <SettingsTopBar title="Cài đặt" onBack={handleBack} />

        {/* Nội dung danh sách cài đặt */}
        <main className="flex-1 px-4 flex flex-col gap-6">
          {/* Avatar & Thông tin tài khoản */}
          <ProfileAvatarBanner
            user={user}
            onAvatarUpload={uploadAvatarFile}
            isUploading={isUploadingAvatar}
          />

          {/* Section 1: TÀI KHOẢN */}
          <SettingsSection title="Tài khoản">
            <SettingsTile
              icon={<User size={18} strokeWidth={2.2} />}
              title="Sửa tên"
              value={displayNameValue}
              onClick={() => setIsNameSheetOpen(true)}
              showDivider
            />
            <SettingsTile
              icon={<Calendar size={18} strokeWidth={2.2} />}
              title="Sửa ngày sinh"
              value={dobValue}
              onClick={() => setIsDobSheetOpen(true)}
              showDivider
            />
            <SettingsTile
              icon={<Mail size={18} strokeWidth={2.2} />}
              title="Địa chỉ email"
              value={user?.email || ''}
              rightIcon={<Lock size={16} strokeWidth={2.2} data-testid="lock-icon" />}
              showDivider
            />
            <SettingsTile
              icon={<UserPlus size={18} strokeWidth={2.2} />}
              title="Mời bạn bè"
              onClick={() => router.push('/invite')}
              showDivider
            />
            <SettingsTile
              icon={<Users size={18} strokeWidth={2.2} />}
              title="Danh sách bạn bè"
              onClick={() => router.push('/messages')}
            />
          </SettingsSection>

          {/* Section 2: RIÊNG TƯ & BẢO MẬT */}
          <SettingsSection title="Riêng tư & bảo mật">
            <SettingsTile
              icon={<ShieldOff size={18} strokeWidth={2.2} />}
              title="Tài khoản đã bị chặn"
              onClick={() => router.push('/settings/blocked')}
            />
          </SettingsSection>

          {/* Section 3: TÙY CHỌN ỨNG DỤNG */}
          <SettingsSection title="Tùy chọn ứng dụng">
            <SettingsTile
              icon={<Vibrate size={18} strokeWidth={2.2} />}
              title="Rung xúc giác"
              isSwitch
              switchChecked={hapticsEnabled}
              onSwitchChange={toggleHaptics}
              showDivider
            />
            <SettingsTile
              icon={<Volume2 size={18} strokeWidth={2.2} />}
              title="Âm thanh hiệu ứng"
              isSwitch
              switchChecked={soundEnabled}
              onSwitchChange={toggleSound}
              showDivider
            />
            <SettingsTile
              icon={<Download size={18} strokeWidth={2.2} />}
              title="Tự động lưu ảnh chụp"
              isSwitch
              switchChecked={autoSavePhotos}
              onSwitchChange={toggleAutoSavePhotos}
            />
          </SettingsSection>

          {/* Section 4: Hệ thống & Đăng xuất */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <p className="text-[13px] text-text-secondary select-none font-medium text-center">
              Phiên bản 1.0.0 (Web)
            </p>
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="w-full py-3.5 text-center text-[16px] font-bold text-[#FF5252] active:scale-95 transition-transform cursor-pointer focus:outline-none"
            >
              Đăng xuất
            </button>
          </div>
        </main>
      </div>

      {/* Bottom Sheet: Chỉnh sửa Họ & Tên */}
      <NameInputBottomSheet
        isOpen={isNameSheetOpen}
        onDismiss={() => setIsNameSheetOpen(false)}
        currentFirstName={user?.firstName || ''}
        currentLastName={user?.lastName || ''}
        onSave={async (firstName, lastName) => {
          await updateName(firstName, lastName);
        }}
      />

      {/* Bottom Sheet: Chỉnh sửa Ngày sinh */}
      <DobInputBottomSheet
        isOpen={isDobSheetOpen}
        onDismiss={() => setIsDobSheetOpen(false)}
        currentDob={user?.dob || null}
        onSave={async (dob) => {
          await updateDob(dob);
        }}
      />

      {/* Dialog: Xác nhận Đăng xuất */}
      <LogoutConfirmDialog
        isOpen={isLogoutDialogOpen}
        onDismiss={() => setIsLogoutDialogOpen(false)}
        onConfirmLogout={logoutAccount}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
