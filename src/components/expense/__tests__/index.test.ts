import { describe, it, expect } from 'vitest';
import * as ExpenseExports from '../index';

describe('Expense Components Barrel Export', () => {
  it('export đầy đủ 9 components của phân hệ Expense Dashboard', () => {
    expect(ExpenseExports.ExpenseHeaderBar).toBeDefined();
    expect(ExpenseExports.YearlyCashflowChart).toBeDefined();
    expect(ExpenseExports.ExpenseDashboardSkeleton).toBeDefined();
    expect(ExpenseExports.ExpenseHeroSummaryCard).toBeDefined();
    expect(ExpenseExports.ExpenseSavingsGoalCard).toBeDefined();
    expect(ExpenseExports.TopCategoriesSection).toBeDefined();
    expect(ExpenseExports.TransactionFilterTabs).toBeDefined();
    expect(ExpenseExports.TransactionListSection).toBeDefined();
    expect(ExpenseExports.ReceiptPhotoModal).toBeDefined();
  });
});
