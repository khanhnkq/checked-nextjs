import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ExpenseDashboardSkeleton } from '../ExpenseDashboardSkeleton';

describe('ExpenseDashboardSkeleton Component', () => {
  it('render đầy đủ thuộc tính trợ năng role="status"', () => {
    render(<ExpenseDashboardSkeleton />);
    const skeleton = screen.getByRole('status', { name: 'Đang nạp dữ liệu chi tiêu...' });
    expect(skeleton).toBeInTheDocument();
  });

  it('render đầy đủ 4 khối skeleton cấu trúc theo đúng thiết kế iOS', () => {
    render(<ExpenseDashboardSkeleton />);

    // 1. Hero Summary Skeleton
    expect(screen.getByTestId('hero-summary-skeleton')).toBeInTheDocument();

    // 2. Savings Goal Skeleton
    expect(screen.getByTestId('savings-goal-skeleton')).toBeInTheDocument();

    // 3. Filter Tabs Skeleton
    expect(screen.getByTestId('filter-tabs-skeleton')).toBeInTheDocument();

    // 4. Transactions List Skeleton với 5 dòng
    const transactionsSkeleton = screen.getByTestId('transactions-skeleton');
    expect(transactionsSkeleton).toBeInTheDocument();
    expect(transactionsSkeleton.children).toHaveLength(5);
  });
});
