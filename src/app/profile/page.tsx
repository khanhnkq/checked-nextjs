'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useProfileData } from '@/hooks/useProfileData';
import { getDaysInMonth } from '@/lib/utils/formatters';
import { SkeletonBone } from '@/components/common/SkeletonBone';
import { haptics } from '@/lib/utils/haptics';
import {
  ProfileTopBar,
  ProfileHeader,
  BudgetSummaryCard,
  CalorieSummaryCard,
  CalendarHistoryCard,
  ProfileStatsFooter,
  BudgetSettingSheet,
  CalorieGoalSettingSheet,
} from '@/components/profile';

/**
 * Trang Profile Next.js (/profile)
 * Tái hiện nguyên bản 100% ProfileView.swift trên iOS
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  const [showBudgetSheet, setShowBudgetSheet] = useState<boolean>(false);
  const [showCalorieSheet, setShowCalorieSheet] = useState<boolean>(false);

  // Hook điều phối dữ liệu Profile theo mô hình Two-tier Data Loading
  const {
    summaryState,
    dayCalendarData,
    isLoadingSummary,
    isLoadingCalendar,
    monthTitle,
    updateBudget,
    updateCalorieTarget,
  } = useProfileData({ enabled: Boolean(isAuthenticated) });

  // Route Guard: Nếu đã hydrate xong mà chưa đăng nhập -> chuyển hướng sang /login
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login?redirect=/profile');
    }
  }, [isHydrated, isAuthenticated, router]);

  // Tính số ngày trong tháng hiện tại
  const now = useMemo(() => new Date(), []);
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(now.getFullYear(), now.getMonth());
  }, [now]);

  // Trạng thái chờ Hydration từ LocalStorage
  if (!isHydrated) {
    return (
      <main
        data-testid="profile-loading-skeleton"
        className="min-h-screen bg-[#EDE9DF] p-4 pt-safe flex flex-col justify-between max-w-md mx-auto"
      >
        <div className="space-y-6 pt-2">
          {/* TopBar Skeleton */}
          <div className="flex justify-between items-center h-14">
            <SkeletonBone width={44} height={44} className="rounded-full" />
            <div className="flex gap-2">
              <SkeletonBone width={44} height={44} className="rounded-full" />
              <SkeletonBone width={44} height={44} className="rounded-full" />
            </div>
          </div>

          {/* Header Skeleton */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <SkeletonBone width={80} height={80} className="rounded-full" />
            <SkeletonBone width={160} height={24} className="rounded-md" />
            <SkeletonBone width={100} height={16} className="rounded-md" />
          </div>

          {/* Budget & Calorie Skeleton */}
          <SkeletonBone height={130} className="rounded-card w-full" />
          <SkeletonBone height={120} className="rounded-card w-full" />
          <SkeletonBone height={220} className="rounded-card w-full" />
        </div>
      </main>
    );
  }

  // Nếu chưa đăng nhập (đang chuyển hướng bởi useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main
      data-testid="profile-page-main"
      className="min-h-screen bg-[#EDE9DF] text-text-primary select-none"
    >
      <div className="max-w-md mx-auto min-h-screen flex flex-col justify-between pt-safe">
        <div className="flex-1 pb-10">
          {/* 1. ProfileTopBar (44px) */}
          <ProfileTopBar
            onCloseClick={() => router.push('/')}
            onFriendsClick={() => router.push('/friends/requests')}
            onSettingsClick={() => router.push('/settings')}
          />

          {/* 2. ProfileHeader (Avatar viền Matcha Glow 2px, Display Name, @username) */}
          <ProfileHeader
            displayName={user?.displayName || user?.username || 'Người dùng Checked'}
            username={user?.username || 'checked'}
            avatarUrl={user?.avatarUrl}
          />

          <div className="h-6" />

          {/* 3. Thẻ Chi Tiêu Tháng (BudgetSummaryCard) */}
          <div className="px-4 mb-4">
            <BudgetSummaryCard
              totalSpent={summaryState.totalSpent}
              budgetLimit={summaryState.budgetLimit}
              percentUsed={summaryState.percentUsed}
              remaining={summaryState.remaining}
              isBudgetExceeded={summaryState.isBudgetExceeded}
              alertPct={summaryState.alertPct}
              savingsTarget={summaryState.savingsTarget}
              isLoading={isLoadingSummary}
              onClick={() => setShowBudgetSheet(true)}
              onArrowClick={() => router.push('/expense')}
            />
          </div>

          {/* 4. Thẻ Năng Lượng Hôm Nay (CalorieSummaryCard) */}
          <div className="px-4 mb-6">
            <CalorieSummaryCard
              todayCalories={summaryState.todayCalories}
              targetCalories={summaryState.targetCalories}
              caloriePercentage={summaryState.caloriePercentage}
              calorieExceeded={summaryState.calorieExceeded}
              isLoading={isLoadingSummary}
              onClick={() => setShowCalorieSheet(true)}
              onArrowClick={() => router.push('/calorie')}
            />
          </div>

          {/* 5. Tiêu đề Lịch sử & Thẻ Lưới Lịch Tháng (CalendarHistoryCard) */}
          <div className="px-4 mb-7">
            <h2 className="text-[14px] font-medium text-text-secondary px-1 pb-2.5">
              Lịch sử
            </h2>
            <CalendarHistoryCard
              currentMonthTitle={monthTitle}
              daysInMonth={daysInMonth}
              dayCalendarData={dayCalendarData}
              isLoading={isLoadingCalendar}
              onClick={() => router.push('/history')}
              onDayClick={(day, data) => {
                if (data) {
                  router.push(`/history?day=${day}`);
                }
              }}
            />
          </div>

          {/* 6. Viên Thuốc Thành Tích Gamification (ProfileStatsFooter) */}
          <div className="flex justify-center pb-6 pt-2">
            <ProfileStatsFooter
              checkedCount={summaryState.checkedCount}
              streakDays={summaryState.streakDays}
              isLoading={isLoadingSummary}
            />
          </div>
        </div>
      </div>

      {/* 7. Modal Bottom Sheet: Thiết Lập Ngân Sách & Tiết Kiệm */}
      <BudgetSettingSheet
        isOpen={showBudgetSheet}
        onDismiss={() => setShowBudgetSheet(false)}
        monthTitle={monthTitle}
        currentBudgetLimit={summaryState.budgetLimit}
        currentAlertPct={summaryState.alertPct}
        currentSavingsTarget={summaryState.savingsTarget}
        onSave={updateBudget}
      />

      {/* 8. Modal Bottom Sheet: Thiết Lập Mục Tiêu Calo */}
      <CalorieGoalSettingSheet
        isOpen={showCalorieSheet}
        onDismiss={() => setShowCalorieSheet(false)}
        currentTarget={summaryState.targetCalories}
        onSave={updateCalorieTarget}
      />
    </main>
  );
}
