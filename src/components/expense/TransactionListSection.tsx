'use client';

/**
 * TransactionListSection Component
 * Danh sách thẻ giao dịch phẳng độc lập (Zero Border, Zero Divider)
 * Chuẩn Parity 1:1 với transactionListSection & transactionCard trong ExpenseDashboardView.swift
 */

import React, { useRef, useCallback } from 'react';
import {
  ArrowDownLeft,
  CreditCard,
  Utensils,
  Coffee,
  ShoppingBag,
  Car,
  Banknote,
} from 'lucide-react';
import { formatCurrency, formatTransactionDate, getCategoryIconName } from '@/lib/utils/expense-formatters';
import { haptics } from '@/lib/utils/haptics';
import type { ExpenseTransaction } from '@/types/expense';

export interface TransactionListSectionProps {
  /** Danh sách giao dịch chi tiêu / thu nhập */
  transactions: ExpenseTransaction[];
  /** Cờ báo hiệu còn giao dịch để tải tiếp hay không */
  hasMore?: boolean;
  /** Cờ báo hiệu đang tải thêm dữ liệu trang tiếp theo */
  isLoadingMore?: boolean;
  /** Callback kích hoạt khi cuộn đến cuối danh sách để tải thêm */
  onLoadMore?: () => void;
  /** Callback khi người dùng bấm vào một giao dịch có ảnh hóa đơn / bill */
  onSelectReceiptPhoto?: (imageUrl: string) => void;
}

/** Helper render icon theo categoryName */
function CategoryIcon({ categoryName }: { categoryName?: string | null }) {
  const iconName = getCategoryIconName(categoryName);
  const iconClass = 'w-[18px] h-[18px] text-text-primary fill-current stroke-[1.5]';

  switch (iconName) {
    case 'Utensils':
      return <Utensils className={iconClass} aria-hidden="true" />;
    case 'Coffee':
      return <Coffee className={iconClass} aria-hidden="true" />;
    case 'ShoppingBag':
      return <ShoppingBag className={iconClass} aria-hidden="true" />;
    case 'Car':
      return <Car className={iconClass} aria-hidden="true" />;
    case 'Banknote':
      return <Banknote className={iconClass} aria-hidden="true" />;
    case 'CreditCard':
    default:
      return <CreditCard className={iconClass} aria-hidden="true" />;
  }
}

export function TransactionListSection({
  transactions,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onSelectReceiptPhoto,
}: TransactionListSectionProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Hook Callback cho Infinite Scroll phần tử cuối cùng
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      if (node && hasMore && onLoadMore) {
        observerRef.current = new IntersectionObserver((entries) => {
          if (entries[0]?.isIntersecting) {
            onLoadMore();
          }
        });
        observerRef.current.observe(node);
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  return (
    <section
      className="flex flex-col gap-2.5 w-full select-none text-text-primary"
      aria-label="Danh sách giao dịch"
    >
      {/* 1. Header: Tiêu đề "Giao dịch" + Số lượng */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold font-display text-text-primary">
          Giao dịch
        </h2>
        <span className="text-[13px] font-bold font-display text-text-secondary">
          {transactions.length}
        </span>
      </div>

      {/* 2. Trạng thái rỗng (Empty State) */}
      {transactions.length === 0 ? (
        <div
          role="region"
          aria-label="Không có giao dịch"
          className="w-full py-8 flex flex-col items-center justify-center gap-2 bg-surface rounded-[20px] select-none"
        >
          <CreditCard
            className="w-7 h-7 text-text-primary fill-current stroke-[1.5]"
            aria-hidden="true"
          />
          <span className="text-[13px] font-bold font-display text-text-secondary">
            Chưa có giao dịch
          </span>
        </div>
      ) : (
        /* 3. Danh sách các Transaction Card phẳng độc lập (Zero Divider, Zero Border) */
        <div className="flex flex-col gap-2 w-full">
          {transactions.map((item, index) => {
            const isLast = index === transactions.length - 1;
            const photoUrl = item.imageUrl || item.thumbnailUrl;
            const hasPhoto = Boolean(photoUrl && photoUrl.trim().length > 0);

            const displayTitle =
              item.note?.trim() ||
              item.categoryName ||
              (item.isIncome ? 'Thu nhập' : 'Chi tiêu');

            const amountFormatted = `${item.isIncome ? '+' : '-'}${formatCurrency(item.amount)}`;

            const handleClick = () => {
              if (hasPhoto && photoUrl) {
                haptics.light();
                onSelectReceiptPhoto?.(photoUrl);
              }
            };

            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (hasPhoto && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleClick();
              }
            };

            return (
              <div
                key={item.id || `tx-${index}`}
                ref={isLast ? lastItemRef : undefined}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                role={hasPhoto ? 'button' : undefined}
                tabIndex={hasPhoto ? 0 : undefined}
                aria-label={
                  hasPhoto
                    ? `Xem ảnh hóa đơn giao dịch ${displayTitle}: ${amountFormatted}`
                    : undefined
                }
                className={`w-full flex items-center gap-3 px-4 py-3 bg-surface rounded-[20px] select-none text-left border-0 transition-transform ${
                  hasPhoto
                    ? 'active:scale-[0.98] cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                {/* Thumbnail ảnh bill hoặc icon tròn 44px */}
                <div className="w-11 h-11 shrink-0 rounded-[12px] overflow-hidden bg-graySubtle flex items-center justify-center">
                  {hasPhoto && photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : item.isIncome ? (
                    <ArrowDownLeft
                      className="w-[18px] h-[18px] text-text-primary stroke-[2.5]"
                      aria-hidden="true"
                    />
                  ) : (
                    <CategoryIcon categoryName={item.categoryName} />
                  )}
                </div>

                {/* Tên / Ghi chú & Ngày giờ */}
                <div className="flex flex-col gap-0.5 items-start text-left min-w-0 flex-1">
                  <span className="text-[15px] font-bold font-display text-text-primary truncate w-full">
                    {displayTitle}
                  </span>
                  <span className="text-[12px] font-medium font-display text-text-secondary truncate w-full">
                    {formatTransactionDate(item.createdAt)}
                  </span>
                </div>

                {/* Số tiền (+/- X đ) */}
                <span
                  className={`text-[15px] font-bold font-display shrink-0 text-right ${
                    item.isIncome ? 'text-success' : 'text-text-primary'
                  }`}
                >
                  {amountFormatted}
                </span>
              </div>
            );
          })}

          {/* Chỉ báo trạng thái đang tải thêm trang kế tiếp */}
          {isLoadingMore && (
            <div className="w-full py-2 flex items-center justify-center text-[12px] font-medium font-display text-text-secondary">
              Đang tải thêm...
            </div>
          )}
        </div>
      )}
    </section>
  );
}
