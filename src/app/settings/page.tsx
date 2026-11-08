'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshCw,
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

  // Trạng thái phiên bản và kiểm tra cập nhật PWA
  const [appVersion, setAppVersion] = useState<string>('v1.0.0');
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'latest' | 'update_available'
  >('idle');
  const initialVersionRef = useRef<string | null>(null);

  // Lấy thông tin phiên bản ban đầu từ /version.json
  useEffect(() => {
    fetch('/version.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.version) {
          if (!initialVersionRef.current) {
            initialVersionRef.current = data.version;
          }
          const display = data.version.startsWith('v')
            ? data.version
            : `v1.0.0 (${data.version.slice(0, 7)})`;
          setAppVersion(display);
        }
      })
      .catch(() => {});
  }, []);

  // Kiểm tra cập nhật thủ công
  const handleCheckUpdate = useCallback(async () => {
    haptics.light();
    setUpdateStatus('checking');

    try {
      let hasUpdateAvailable = false;

      // 1. Kiểm tra qua Service Worker registration
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update().catch(() => {});
          if (registration.waiting) {
            hasUpdateAvailable = true;
          }
        }
      }

      // 2. Kiểm tra qua /version.json
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.version) {
          if (initialVersionRef.current && data.version !== initialVersionRef.current) {
            hasUpdateAvailable = true;
          }
        }
      }

      if (hasUpdateAvailable) {
        setUpdateStatus('update_available');
        haptics.success();
      } else {
        setUpdateStatus('latest');
        haptics.selection();
      }
    } catch {
      setUpdateStatus('latest');
    }
  }, []);

  // Áp dụng cập nhật và reload
  const handleApplyUpdate = useCallback(async () => {
    haptics.medium();
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
    window.location.reload();
  }, []);

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
      <div className="max-w-md mx-auto min-h-screen flex flex-col pb-12 pt-safe">
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

          {/* Section 4: PHIÊN BẢN & CẬP NHẬT */}
          <SettingsSection title="Phiên bản & Cập nhật">
            <div className="bg-[#FAF8F5] text-[#2C2825] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[12px] text-text-secondary font-medium">Phiên bản hiện tại</span>
                  <span className="text-[15px] font-bold text-[#2C2825]" data-testid="app-version-text">
                    {appVersion}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={updateStatus === 'checking'}
                  className="bg-[#D9E872] text-[#2C2825] text-[13px] font-semibold px-3.5 py-2 rounded-full active:scale-95 transition-transform cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  aria-label="Kiểm tra cập nhật"
                >
                  <RefreshCw
                    size={14}
                    strokeWidth={2.4}
                    className={updateStatus === 'checking' ? 'animate-spin' : ''}
                  />
                  <span>
                    {updateStatus === 'checking' ? 'Đang kiểm tra...' : 'Kiểm tra cập nhật'}
                  </span>
                </button>
              </div>

              {/* Trạng thái phản hồi */}
              {updateStatus === 'latest' && (
                <div
                  role="status"
                  className="text-[13px] font-medium text-emerald-600 flex items-center gap-1.5 pt-1"
                >
                  <span className="text-sm">✓</span>
                  <span>Bạn đang dùng phiên bản mới nhất</span>
                </div>
              )}

              {updateStatus === 'update_available' && (
                <div
                  role="status"
                  className="flex items-center justify-between pt-1 gap-2"
                >
                  <span className="text-[13px] font-medium text-amber-700">
                    Đã có bản cập nhật mới!
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyUpdate}
                    className="bg-[#2C2825] text-[#FAF8F5] text-[12px] font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform cursor-pointer shrink-0"
                  >
                    Bấm để cập nhật
                  </button>
                </div>
              )}
            </div>
          </SettingsSection>

          {/* Section 5: Hệ thống & Đăng xuất */}
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
