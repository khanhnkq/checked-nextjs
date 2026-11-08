'use client';

/**
 * Trang Dashboard Quản lý Năng lượng / Calorie (/calorie)
 * Tái hiện nguyên bản 100% CalorieDashboardView.swift trên iOS
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useCalorieDashboard } from '@/hooks/useCalorieDashboard';
import {
  CalorieHeaderBar,
  CalorieDashboardSkeleton,
  CalorieHeroCard,
  MonthlyCalorieChartCard,
  MealSectionCard,
  QuickAddCalorieSheet,
} from '@/components/calorie';
import { CalorieGoalSettingSheet } from '@/components/profile/CalorieGoalSettingSheet';
import { getCurrentMealType } from '@/lib/utils/calorie-formatters';
import { haptics } from '@/lib/utils/haptics';
import type { MealType } from '@/types/calorie';

export default function CalorieDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Hook điều phối dữ liệu Dashboard Calorie (TanStack Query + Stale-While-Revalidate)
  const {
    selectedDate,
    targetCalories,
    consumedCalories,
    remainingCalories,
    isExceeded,
    progressRatio,
    progressPct,
    daysOnTrack,
    averageDailyCalories,
    monthlyDays,
    mealsByMealType,
    isLoading,
    isGoalSheetOpen,
    setIsGoalSheetOpen,
    isAddSheetOpen,
    setIsAddSheetOpen,
    selectedMealTypeForAdd,
    prepareQuickAdd,
    updateTargetGoal,
    addQuickCalorie,
    deleteMealItem,
  } = useCalorieDashboard({ enabled: Boolean(isAuthenticated) });

  // Route Guard: Nếu đã hydrate xong mà chưa đăng nhập -> chuyển hướng sang /login
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login?redirect=/calorie');
    }
  }, [isHydrated, isAuthenticated, router]);

  // Điều hướng quay lại
  const handleBack = () => {
    haptics.light();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile');
    }
  };

  // Xác định bữa ăn hiện tại theo đồng hồ thời gian thực
  const currentMealNow: MealType = useMemo(() => {
    return getCurrentMealType();
  }, []);

  // Chờ Hydration từ LocalStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center">
        <div className="w-full max-w-md mx-auto flex flex-col min-h-screen relative">
          <CalorieHeaderBar onBack={handleBack} />
          <CalorieDashboardSkeleton />
        </div>
      </div>
    );
  }

  // Khi đang nạp dữ liệu lần đầu mà chưa có dữ liệu trong cache
  const showSkeleton = isLoading && consumedCalories === 0 && monthlyDays.length === 0;

  return (
    <div
      data-testid="calorie-page-main"
      className="min-h-screen bg-canvas text-text-primary select-none flex flex-col items-center"
    >
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen relative pt-safe">
        {/* 1. Header Bar phẳng với Nút Back tròn 44x44px & Nút Thêm món */}
        <CalorieHeaderBar
          onBack={handleBack}
          onQuickAdd={() => prepareQuickAdd()}
        />

        {/* 2. Nội dung chính: Skeleton hoặc Calorie Dashboard View */}
        {showSkeleton ? (
          <CalorieDashboardSkeleton />
        ) : (
          <main className="w-full flex-1 overflow-y-auto no-scrollbar px-4 flex flex-col gap-4 pb-12 pt-1">
            {/* 3. Thẻ Calorie Hero: Năng lượng hôm nay & Thanh tiến độ 8px */}
            <CalorieHeroCard
              consumedCalories={consumedCalories}
              targetCalories={targetCalories}
              remainingCalories={remainingCalories}
              isExceeded={isExceeded}
              progressRatio={progressRatio}
              progressPct={progressPct}
              selectedDate={selectedDate}
              onOpenGoalSetting={() => setIsGoalSheetOpen(true)}
            />

            {/* 4. Thẻ Biểu đồ xu hướng Calo 31 ngày trong tháng */}
            <MonthlyCalorieChartCard
              points={monthlyDays}
              targetCalories={targetCalories}
              daysOnTrack={daysOnTrack}
              averageDailyCalories={averageDailyCalories}
              currentDay={selectedDate.getDate()}
            />

            {/* 5. Danh sách 4 Bữa ăn trong ngày: Sáng, Trưa, Phụ, Tối */}
            <div className="flex flex-col gap-3">
              {/* Bữa sáng */}
              <MealSectionCard
                type="BREAKFAST"
                items={mealsByMealType('BREAKFAST')}
                isCurrentMealNow={currentMealNow === 'BREAKFAST'}
                onQuickAdd={(t) => prepareQuickAdd(t)}
                onDeleteMeal={deleteMealItem}
              />

              {/* Bữa trưa */}
              <MealSectionCard
                type="LUNCH"
                items={mealsByMealType('LUNCH')}
                isCurrentMealNow={currentMealNow === 'LUNCH'}
                onQuickAdd={(t) => prepareQuickAdd(t)}
                onDeleteMeal={deleteMealItem}
              />

              {/* Bữa phụ */}
              <MealSectionCard
                type="SNACK"
                items={mealsByMealType('SNACK')}
                isCurrentMealNow={currentMealNow === 'SNACK'}
                onQuickAdd={(t) => prepareQuickAdd(t)}
                onDeleteMeal={deleteMealItem}
              />

              {/* Bữa tối */}
              <MealSectionCard
                type="DINNER"
                items={mealsByMealType('DINNER')}
                isCurrentMealNow={currentMealNow === 'DINNER'}
                onQuickAdd={(t) => prepareQuickAdd(t)}
                onDeleteMeal={deleteMealItem}
              />
            </div>
          </main>
        )}

        {/* 6. Bottom Sheet Thêm nhanh món ăn */}
        <QuickAddCalorieSheet
          isOpen={isAddSheetOpen}
          onDismiss={() => setIsAddSheetOpen(false)}
          initialMealType={selectedMealTypeForAdd}
          onAdd={addQuickCalorie}
        />

        {/* 7. Bottom Sheet Thiết lập mục tiêu calo */}
        <CalorieGoalSettingSheet
          isOpen={isGoalSheetOpen}
          onDismiss={() => setIsGoalSheetOpen(false)}
          currentTarget={targetCalories}
          onSave={updateTargetGoal}
        />
      </div>
    </div>
  );
}
