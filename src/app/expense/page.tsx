'use client';

/**
 * Trang Dashboard Quản lý Chi tiêu (/expense)
 * Tái hiện nguyên bản 100% ExpenseDashboardView.swift trên iOS
 * Tuân thủ quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useExpenseDashboard } from '@/hooks/useExpenseDashboard';
import {
  ExpenseHeaderBar,
  YearlyCashflowChart,
  ExpenseDashboardSkeleton,
  ExpenseHeroSummaryCard,
  ExpenseSavingsGoalCard,
  TopCategoriesSection,
  TransactionFilterTabs,
  TransactionListSection,
  ReceiptPhotoModal,
} from '@/components/expense';
import { BudgetSettingSheet } from '@/components/profile/BudgetSettingSheet';
import { formatMonthTitle } from '@/lib/utils/expense-formatters';
import { haptics } from '@/lib/utils/haptics';

export default function ExpenseDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Hook điều phối dữ liệu Dashboard Chi tiêu (TanStack Query + Cache)
  const {
    currentMonthKey,
    currentYear,
    yearlyPoints,
    summary,
    topCategories,
    transactions,
    selectedFilter,
    isLoading,
    isLoadingMore,
    hasMorePages,
    isBudgetSheetOpen,
    setIsBudgetSheetOpen,
    previewImageUrl,
    setPreviewImageUrl,
    selectMonth,
    changeYear,
    selectFilter,
    loadMoreTransactions,
    saveBudget,
    saveSavingsGoal,
  } = useExpenseDashboard({ enabled: Boolean(isAuthenticated) });

  // Route Guard: Nếu đã hydrate xong mà chưa đăng nhập -> chuyển hướng sang /login
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login?redirect=/expense');
    }
  }, [isHydrated, isAuthenticated, router]);

  // Tiêu đề tháng hiển thị (Ví dụ: "Tháng 10, 2026")
  const monthTitle = useMemo(() => {
    return formatMonthTitle(currentMonthKey);
  }, [currentMonthKey]);

  // Điều hướng quay lại
  const handleBack = () => {
    haptics.light();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile');
    }
  };

  // Mở/Đóng Bottom Sheet thiết lập ngân sách & mục tiêu tiết kiệm
  const handleOpenBudget = () => {
    setIsBudgetSheetOpen(true);
  };

  const handleCloseBudget = () => {
    setIsBudgetSheetOpen(false);
  };

  // Callback lưu ngân sách và mục tiêu tiết kiệm
  const handleSaveBudgetAndGoal = async (
    limit: number,
    alertPct: number,
    targetGoal: number | null
  ) => {
    const bSuccess = await saveBudget(limit, alertPct);
    let gSuccess = true;
    if (targetGoal !== null && targetGoal > 0) {
      gSuccess = await saveSavingsGoal(targetGoal);
    }
    if (bSuccess && gSuccess) {
      setIsBudgetSheetOpen(false);
      return true;
    }
    return false;
  };

  // Chờ Hydration từ LocalStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center">
        <div className="w-full max-w-md mx-auto flex flex-col min-h-screen relative">
          <ExpenseHeaderBar onBack={handleBack} />
          <ExpenseDashboardSkeleton />
        </div>
      </div>
    );
  }

  // Khi đang nạp dữ liệu lần đầu mà chưa có dữ liệu summary trong cache
  const showSkeleton = isLoading && !summary;

  return (
    <div className="min-h-screen bg-canvas text-text-primary select-none flex flex-col items-center">
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen relative">
        {/* 1. Header Bar phẳng với Nút Back tròn 44x44px */}
        <ExpenseHeaderBar onBack={handleBack} />

        {/* 2. Nội dung chính: Skeleton hoặc Dashboard View */}
        {showSkeleton ? (
          <ExpenseDashboardSkeleton />
        ) : (
          <main className="w-full flex-1 overflow-y-auto no-scrollbar px-4 flex flex-col gap-4 pb-12 pt-1">
            {/* 3. Bộ chọn dòng tiền 12 tháng cả năm (Mini dual-bars) */}
            <YearlyCashflowChart
              yearlyPoints={yearlyPoints}
              currentMonthKey={currentMonthKey}
              currentYear={currentYear}
              onSelectMonth={selectMonth}
              onChangeYear={changeYear}
            />

            {/* 4. Thẻ Hero Tổng chi tiêu tháng & tiến độ ngân sách 8px */}
            {summary && (
              <ExpenseHeroSummaryCard
                summary={summary}
                monthTitle={monthTitle}
                onOpenBudgetSetting={handleOpenBudget}
              />
            )}

            {/* 5. Thẻ Mục tiêu tiết kiệm & tiến độ 6px */}
            {summary && (
              <ExpenseSavingsGoalCard
                savingsTarget={summary.savingsTarget}
                currentSaved={summary.currentSaved}
                savingsProgressPct={summary.savingsProgressPct}
                onOpenSavingsSetting={handleOpenBudget}
              />
            )}

            {/* 6. Top danh mục chi tiêu cuộn ngang (Ẩn khi rỗng) */}
            {topCategories.length > 0 && (
              <TopCategoriesSection categories={topCategories} />
            )}

            {/* 7. Bộ 3 Tabs lọc giao dịch: Tất cả | Chi tiêu | Thu nhập */}
            <TransactionFilterTabs
              selectedFilter={selectedFilter}
              onSelectFilter={selectFilter}
            />

            {/* 8. Danh sách thẻ giao dịch phẳng độc lập (kèm Infinite Scroll) */}
            <TransactionListSection
              transactions={transactions}
              hasMore={hasMorePages}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMoreTransactions}
              onSelectReceiptPhoto={(url) => setPreviewImageUrl(url)}
            />
          </main>
        )}

        {/* 9. Bottom Sheet thiết lập ngân sách & mục tiêu tiết kiệm */}
        <BudgetSettingSheet
          isOpen={isBudgetSheetOpen}
          onDismiss={handleCloseBudget}
          monthTitle={monthTitle}
          currentBudgetLimit={summary?.budgetLimit}
          currentAlertPct={summary?.alertThresholdPct}
          currentSavingsTarget={summary?.savingsTarget}
          onSave={handleSaveBudgetAndGoal}
        />

        {/* 10. Modal xem ảnh hóa đơn phóng to toàn màn hình */}
        <ReceiptPhotoModal
          imageUrl={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      </div>
    </div>
  );
}
