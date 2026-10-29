'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, History, MessageCircle, LogOut, Flame, DollarSign, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { clearSessionCookies } from '@/lib/auth/session-sync';
import { CircleIconButton } from '@/components/common';
import { haptics } from '@/lib/utils/haptics';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    logout();
    await clearSessionCookies();
    router.push('/login');
  };

  const handleCaptureClick = () => {
    haptics.medium();
  };

  return (
    <div className="flex flex-col justify-between min-h-screen px-4 py-4 max-w-md mx-auto pt-safe pb-safe select-none">
      {/* 1. Home Top Bar */}
      <header className="flex items-center justify-between h-14 px-2">
        {/* User Profile Avatar */}
        <button
          type="button"
          onClick={() => router.push('/complete-profile')}
          className="w-10 h-10 rounded-full overflow-hidden border border-[#141613]/15 bg-[#DFDACD] flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Hồ sơ"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-[#141613]">
              {(user?.displayName || user?.username || 'C')[0].toUpperCase()}
            </span>
          )}
        </button>

        {/* Center Pill: Filter Friends */}
        <div className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-white border border-[#141613]/12 active:bg-[#DFDACD] transition-colors cursor-pointer">
          <Users size={16} className="text-[#141613]" />
          <span className="text-sm font-bold text-[#141613]">Tất cả</span>
        </div>

        {/* Right Action: Logout */}
        <CircleIconButton
          size="sm"
          variant="surface"
          onClick={handleLogout}
          aria-label="Đăng xuất"
        >
          <LogOut size={16} />
        </CircleIconButton>
      </header>

      {/* 2. Main Camera Viewfinder Placeholder */}
      <main className="w-full my-auto flex flex-col items-center">
        <div className="w-full aspect-square rounded-[32px] bg-[#141613] border-2 border-[#141613]/15 overflow-hidden relative flex flex-col items-center justify-center text-white">
          <Camera size={48} className="text-[#D4EB70] mb-3" strokeWidth={1.8} />
          <p className="text-base font-bold font-display text-white tracking-tight">
            Camera Checked
          </p>
          <p className="text-xs text-white/60 mt-1 font-medium">
            Khoảnh khắc của {user?.displayName || user?.username || 'bạn'}
          </p>

          {/* Top In-Camera Status Indicators */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-xs font-bold text-white/80">
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">1:1</span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">Auto</span>
          </div>
        </div>
      </main>

      {/* 3. Bottom Camera Controls & Feature Navigation */}
      <footer className="flex flex-col gap-4 pb-2">
        {/* Navigation Shortcuts */}
        <div className="flex items-center justify-around px-4">
          <CircleIconButton
            size="md"
            variant="surface"
            aria-label="Lịch sử"
            onClick={() => haptics.click()}
          >
            <History size={20} />
          </CircleIconButton>

          <CircleIconButton
            size="md"
            variant="surface"
            aria-label="Chi tiêu"
            onClick={() => haptics.click()}
          >
            <DollarSign size={20} />
          </CircleIconButton>

          <CircleIconButton
            size="md"
            variant="surface"
            aria-label="Calo"
            onClick={() => haptics.click()}
          >
            <Flame size={20} />
          </CircleIconButton>

          <CircleIconButton
            size="md"
            variant="surface"
            aria-label="Tin nhắn"
            badge={2}
            onClick={() => haptics.click()}
          >
            <MessageCircle size={20} />
          </CircleIconButton>
        </div>

        {/* Central Capture Shutter Button */}
        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            onClick={handleCaptureClick}
            aria-label="Chụp ảnh"
            className="w-20 h-20 rounded-full border-2 border-[#D4EB70] flex items-center justify-center active:scale-95 transition-transform"
          >
            <div className="w-[68px] h-[68px] rounded-full bg-[#D4EB70] border border-[#141613]/10 active:scale-90 transition-transform" />
          </button>
        </div>
      </footer>
    </div>
  );
}
