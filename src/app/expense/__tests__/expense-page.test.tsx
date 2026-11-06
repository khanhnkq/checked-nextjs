import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ExpenseDashboardPage from '../page';
import type { UseExpenseDashboardReturn } from '@/hooks/useExpenseDashboard';

// 1. Mock Next.js navigation router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

// 2. Mock Haptics
vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    light: vi.fn(),
    medium: vi.fn(),
  },
}));

// 3. Mock AuthStore
interface MockAuthStateType {
  user: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const mockAuthState: MockAuthStateType = {
  user: {
    id: 'user-1',
    displayName: 'Quốc Khánh',
    username: 'khanhnkq',
  },
  isAuthenticated: true,
  isHydrated: true,
};

const mockUseAuthStore = vi.fn<() => MockAuthStateType>(() => mockAuthState);
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// 4. Mock Expense Dashboard Hook
const mockSelectMonth = vi.fn().mockResolvedValue(undefined);
const mockChangeYear = vi.fn().mockResolvedValue(undefined);
const mockSelectFilter = vi.fn().mockResolvedValue(undefined);
const mockLoadMoreTransactions = vi.fn().mockResolvedValue(undefined);
const mockSaveBudget = vi.fn().mockResolvedValue(true);
const mockSaveSavingsGoal = vi.fn().mockResolvedValue(true);
const mockSetIsBudgetSheetOpen = vi.fn();
const mockSetPreviewImageUrl = vi.fn();

const defaultExpenseData: UseExpenseDashboardReturn = {
  currentMonthKey: '202610',
  currentYear: 2026,
  availableMonths: ['202609', '202610'],
  selectedFilter: 'ALL',
  yearlyPoints: [
    { monthKey: '202601', monthIndex: 1, monthName: 'T1', income: 10000000, expense: 5000000, net: 5000000 },
    { monthKey: '202610', monthIndex: 10, monthName: 'T10', income: 25000000, expense: 12500000, net: 12500000 },
  ],
  summary: {
    monthKey: '202610',
    totalIncome: 25000000,
    totalExpense: 12500000,
    netCashflow: 12500000,
    budgetLimit: 15000000,
    budgetUsedPct: 83,
    budgetRemaining: 2500000,
    isBudgetExceeded: false,
    alertThresholdPct: 80,
    savingsTarget: 5000000,
    currentSaved: 2500000,
    savingsProgressPct: 50,
  },
  topCategories: [
    { categoryId: 'cat-1', categoryName: 'Ăn uống', totalAmount: 4500000, percentage: 36 },
    { categoryId: 'cat-2', categoryName: 'Cà phê', totalAmount: 1800000, percentage: 14 },
  ],
  transactions: [
    {
      id: 'tx-1',
      amount: 150000,
      isIncome: false,
      categoryName: 'Ăn uống',
      note: 'Phở bò tái nạm',
      createdAt: '2026-10-30T12:30:00Z',
      imageUrl: 'https://example.com/receipt-1.jpg',
      thumbnailUrl: 'https://example.com/receipt-1-thumb.jpg',
    },
    {
      id: 'tx-2',
      amount: 5000000,
      isIncome: true,
      categoryName: 'Lương & Thưởng',
      note: 'Thưởng quý 3',
      createdAt: '2026-10-29T08:00:00Z',
    },
  ],
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasMorePages: false,
  currentPage: 0,
  totalPages: 1,
  errorMessage: null,
  isBudgetSheetOpen: false,
  setIsBudgetSheetOpen: mockSetIsBudgetSheetOpen,
  previewImageUrl: null,
  setPreviewImageUrl: mockSetPreviewImageUrl,
  selectMonth: mockSelectMonth,
  changeYear: mockChangeYear,
  selectFilter: mockSelectFilter,
  loadMoreTransactions: mockLoadMoreTransactions,
  refresh: vi.fn().mockResolvedValue(undefined),
  saveBudget: mockSaveBudget,
  saveSavingsGoal: mockSaveSavingsGoal,
};

let currentMockExpenseData = { ...defaultExpenseData };
vi.mock('@/hooks/useExpenseDashboard', () => ({
  useExpenseDashboard: () => currentMockExpenseData,
}));

describe('ExpenseDashboardPage Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isAuthenticated = true;
    mockAuthState.isHydrated = true;
    currentMockExpenseData = { ...defaultExpenseData };
  });

  it('hiển thị khung skeleton khi authStore chưa hydrate (isHydrated=false)', () => {
    mockAuthState.isHydrated = false;

    render(<ExpenseDashboardPage />);

    expect(screen.getByRole('status', { name: 'Đang nạp dữ liệu chi tiêu...' })).toBeInTheDocument();
  });

  it('chuyển hướng sang /login?redirect=/expense khi đã hydrate nhưng chưa đăng nhập', () => {
    mockAuthState.isAuthenticated = false;

    render(<ExpenseDashboardPage />);

    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/expense');
  });

  it('hiển thị khung skeleton khi đang tải dữ liệu lần đầu (isLoading=true, summary=null)', () => {
    currentMockExpenseData = {
      ...defaultExpenseData,
      isLoading: true,
      summary: null as unknown as typeof defaultExpenseData.summary,
    };

    render(<ExpenseDashboardPage />);

    expect(screen.getByRole('status', { name: 'Đang nạp dữ liệu chi tiêu...' })).toBeInTheDocument();
  });

  it('render đầy đủ trang Dashboard Chi tiêu khi đã đăng nhập và có dữ liệu', () => {
    render(<ExpenseDashboardPage />);

    // 1. Header Bar
    expect(screen.getByRole('heading', { name: 'Chi tiêu' })).toBeInTheDocument();

    // 2. Yearly Chart
    expect(screen.getByText('Dòng tiền 2026')).toBeInTheDocument();

    // 3. Hero Summary Card
    expect(screen.getByText('TỔNG CHI TIÊU • THÁNG 10, 2026')).toBeInTheDocument();
    expect(screen.getByText('12.500.000 đ')).toBeInTheDocument();

    // 4. Savings Goal Card
    expect(screen.getByText('Mục tiêu tiết kiệm')).toBeInTheDocument();
    expect(screen.getByText('2.5tr / 5tr')).toBeInTheDocument();

    // 5. Top Categories Carousel
    expect(screen.getByRole('heading', { name: 'Danh mục' })).toBeInTheDocument();
    expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    expect(screen.getByText('Cà phê')).toBeInTheDocument();

    // 6. Filter Tabs
    expect(screen.getByRole('tab', { name: 'Tất cả' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Chi tiêu' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Thu nhập' })).toBeInTheDocument();

    // 7. Transaction List
    expect(screen.getByRole('heading', { name: 'Giao dịch' })).toBeInTheDocument();
    expect(screen.getByText('Phở bò tái nạm')).toBeInTheDocument();
    expect(screen.getByText('Thưởng quý 3')).toBeInTheDocument();
  });

  it('kích hoạt điều hướng về /profile khi bấm nút Back và không có lịch sử trước đó', () => {
    render(<ExpenseDashboardPage />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('kích hoạt router.back khi có lịch sử duyệt trang trước đó', () => {
    window.history.pushState({}, '', '/profile');
    window.history.pushState({}, '', '/expense');

    render(<ExpenseDashboardPage />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('kích hoạt mở BudgetSettingSheet khi bấm vào thanh tiến độ ngân sách', () => {
    render(<ExpenseDashboardPage />);

    const progressBtn = screen.getByRole('button', {
      name: /Đã chi 83% ngân sách/i,
    });
    fireEvent.click(progressBtn);

    expect(mockSetIsBudgetSheetOpen).toHaveBeenCalledWith(true);
  });

  it('kích hoạt mở BudgetSettingSheet khi bấm nút Sửa trên thẻ mục tiêu tiết kiệm', () => {
    render(<ExpenseDashboardPage />);

    const editGoalBtn = screen.getByRole('button', {
      name: 'Sửa mục tiêu tiết kiệm',
    });
    fireEvent.click(editGoalBtn);

    expect(mockSetIsBudgetSheetOpen).toHaveBeenCalledWith(true);
  });

  it('chuyển tab bộ lọc giao dịch gọi selectFilter', () => {
    render(<ExpenseDashboardPage />);

    const expenseTab = screen.getByRole('tab', { name: 'Chi tiêu' });
    fireEvent.click(expenseTab);

    expect(mockSelectFilter).toHaveBeenCalledWith('EXPENSE');
  });

  it('kích hoạt setPreviewImageUrl khi click vào giao dịch có ảnh hóa đơn', () => {
    render(<ExpenseDashboardPage />);

    const photoCard = screen.getByRole('button', {
      name: /Xem ảnh hóa đơn giao dịch Phở bò tái nạm/i,
    });
    fireEvent.click(photoCard);

    expect(mockSetPreviewImageUrl).toHaveBeenCalledWith('https://example.com/receipt-1.jpg');
  });

  it('hiển thị ReceiptPhotoModal khi previewImageUrl có giá trị', () => {
    currentMockExpenseData = {
      ...defaultExpenseData,
      previewImageUrl: 'https://example.com/receipt-1.jpg',
    };

    render(<ExpenseDashboardPage />);

    expect(screen.getByRole('dialog', { name: 'Xem ảnh hóa đơn phóng to' })).toBeInTheDocument();
    expect(screen.getByAltText('Ảnh hóa đơn phóng to')).toBeInTheDocument();
  });

  it('hiển thị BudgetSettingSheet khi isBudgetSheetOpen là true và gọi save khi lưu', async () => {
    currentMockExpenseData = {
      ...defaultExpenseData,
      isBudgetSheetOpen: true,
    };

    render(<ExpenseDashboardPage />);

    // Sheet hiển thị
    expect(screen.getByText('Ngân sách & Tiết kiệm')).toBeInTheDocument();
    expect(screen.getByText('HẠN MỨC CHI TIÊU THÁNG')).toBeInTheDocument();

    // Sửa hạn mức
    const input = screen.getByPlaceholderText('0');
    fireEvent.change(input, { target: { value: '18000000' } });

    // Bấm lưu
    const saveBtn = screen.getByRole('button', { name: 'Lưu thiết lập' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSaveBudget).toHaveBeenCalledWith(18000000, 80);
    });
  });
});
