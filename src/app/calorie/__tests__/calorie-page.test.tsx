import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CalorieDashboardPage from '../page';
import type { UseCalorieDashboardReturn } from '@/hooks/useCalorieDashboard';
import type { CalorieMealItem } from '@/types/calorie';

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

// 4. Mock Calorie Dashboard Hook
const mockSetSelectedDate = vi.fn();
const mockSetIsGoalSheetOpen = vi.fn();
const mockSetIsAddSheetOpen = vi.fn();
const mockSetSelectedMealTypeForAdd = vi.fn();
const mockPrepareQuickAdd = vi.fn();
const mockUpdateTargetGoal = vi.fn().mockResolvedValue(true);
const mockAddQuickCalorie = vi.fn().mockResolvedValue(true);
const mockDeleteMealItem = vi.fn().mockResolvedValue(true);
const mockRefetchAll = vi.fn().mockResolvedValue(undefined);

const sampleMeals: Record<string, CalorieMealItem[]> = {
  BREAKFAST: [
    {
      id: 'm1',
      calories: 350,
      mealType: 'BREAKFAST',
      dishName: 'Bánh mì chảo',
      loggedAt: '2026-11-01T07:30:00Z',
    },
  ],
  LUNCH: [
    {
      id: 'm2',
      calories: 700,
      mealType: 'LUNCH',
      dishName: 'Cơm tấm sườn bì chả',
      loggedAt: '2026-11-01T12:00:00Z',
    },
  ],
  SNACK: [],
  DINNER: [
    {
      id: 'm3',
      calories: 600,
      mealType: 'DINNER',
      dishName: 'Phở bò tái',
      loggedAt: '2026-11-01T18:30:00Z',
    },
  ],
};

const defaultCalorieData: UseCalorieDashboardReturn = {
  selectedDate: new Date(2026, 9, 31),
  setSelectedDate: mockSetSelectedDate,
  dateKey: '2026-10-31',
  monthKey: '202610',
  dailySummary: {
    dateString: '2026-10-31',
    dailyTargetCalories: 2000,
    consumedCalories: 1650,
    remainingCalories: 350,
    isExceeded: false,
    percentage: 83,
    meals: [...sampleMeals.BREAKFAST, ...sampleMeals.LUNCH, ...sampleMeals.DINNER],
  },
  monthlySummary: {
    monthKey: '202610',
    dailyTargetCalories: 2000,
    averageDailyCalories: 1850,
    daysOnTrack: 22,
    days: [
      { day: 1, calories: 1800 },
      { day: 31, calories: 1650 },
    ],
  },
  goal: { dailyTargetCalories: 2000 },
  targetCalories: 2000,
  consumedCalories: 1650,
  remainingCalories: 350,
  isExceeded: false,
  progressRatio: 0.825,
  progressPct: 83,
  daysOnTrack: 22,
  averageDailyCalories: 1850,
  monthlyDays: [
    { day: 1, calories: 1800 },
    { day: 31, calories: 1650 },
  ],
  mealsByMealType: (type) => sampleMeals[type] || [],
  totalCaloriesByMealType: (type) =>
    (sampleMeals[type] || []).reduce((sum, item) => sum + item.calories, 0),
  isLoading: false,
  isRefreshing: false,
  errorMessage: null,
  isGoalSheetOpen: false,
  setIsGoalSheetOpen: mockSetIsGoalSheetOpen,
  isAddSheetOpen: false,
  setIsAddSheetOpen: mockSetIsAddSheetOpen,
  selectedMealTypeForAdd: 'LUNCH',
  setSelectedMealTypeForAdd: mockSetSelectedMealTypeForAdd,
  prepareQuickAdd: mockPrepareQuickAdd,
  updateTargetGoal: mockUpdateTargetGoal,
  addQuickCalorie: mockAddQuickCalorie,
  deleteMealItem: mockDeleteMealItem,
  refetchAll: mockRefetchAll,
};

let currentMockCalorieData = { ...defaultCalorieData };
vi.mock('@/hooks/useCalorieDashboard', () => ({
  useCalorieDashboard: () => currentMockCalorieData,
}));

describe('CalorieDashboardPage Integration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isAuthenticated = true;
    mockAuthState.isHydrated = true;
    currentMockCalorieData = { ...defaultCalorieData };
  });

  it('hiển thị khung skeleton khi authStore chưa hydrate (isHydrated=false)', () => {
    mockAuthState.isHydrated = false;

    render(<CalorieDashboardPage />);

    expect(
      screen.getByRole('status', { name: 'Đang nạp dữ liệu năng lượng...' })
    ).toBeInTheDocument();
  });

  it('chuyển hướng sang /login?redirect=/calorie khi đã hydrate nhưng chưa đăng nhập', () => {
    mockAuthState.isAuthenticated = false;

    render(<CalorieDashboardPage />);

    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/calorie');
  });

  it('render đầy đủ Calorie Dashboard khi đã đăng nhập và có dữ liệu', () => {
    render(<CalorieDashboardPage />);

    // 1. Header Bar
    expect(screen.getByRole('heading', { name: 'Năng lượng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm món ăn' })).toBeInTheDocument();

    // 2. Hero Card
    expect(screen.getByTestId('calorie-hero-card')).toBeInTheDocument();
    expect(screen.getByText('1.650')).toBeInTheDocument();
    expect(screen.getByText('Còn lại 350 kcal (Mục tiêu 2.000)')).toBeInTheDocument();

    // 3. Monthly Chart Card
    expect(screen.getByTestId('monthly-calorie-chart-card')).toBeInTheDocument();
    expect(screen.getByText('XU HƯỚNG NĂNG LƯỢNG THÁNG NÀY')).toBeInTheDocument();
    expect(screen.getByText('22 ngày đạt chuẩn')).toBeInTheDocument();

    // 4. 4 Meal Sections
    expect(screen.getByTestId('meal-section-breakfast')).toBeInTheDocument();
    expect(screen.getByText('Bánh mì chảo')).toBeInTheDocument();

    expect(screen.getByTestId('meal-section-lunch')).toBeInTheDocument();
    expect(screen.getByText('Cơm tấm sườn bì chả')).toBeInTheDocument();

    expect(screen.getByTestId('meal-section-snack')).toBeInTheDocument();

    expect(screen.getByTestId('meal-section-dinner')).toBeInTheDocument();
    expect(screen.getByText('Phở bò tái')).toBeInTheDocument();
  });

  it('kích hoạt điều hướng về /profile khi bấm nút Back và không có lịch sử trước đó', () => {
    render(<CalorieDashboardPage />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('kích hoạt router.back khi có lịch sử duyệt trang trước đó', () => {
    window.history.pushState({}, '', '/profile');
    window.history.pushState({}, '', '/calorie');

    render(<CalorieDashboardPage />);

    const backBtn = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backBtn);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('bấm nút Thêm món trên Header gọi prepareQuickAdd', () => {
    render(<CalorieDashboardPage />);

    const addBtn = screen.getByRole('button', { name: 'Thêm món ăn' });
    fireEvent.click(addBtn);

    expect(mockPrepareQuickAdd).toHaveBeenCalled();
  });

  it('bấm icon edit trên Hero Card gọi setIsGoalSheetOpen', () => {
    render(<CalorieDashboardPage />);

    const editGoalBtn = screen.getByRole('button', {
      name: 'Chỉnh sửa mục tiêu calo',
    });
    fireEvent.click(editGoalBtn);

    expect(mockSetIsGoalSheetOpen).toHaveBeenCalledWith(true);
  });

  it('bấm nút + trên thẻ Bữa sáng gọi prepareQuickAdd với BREAKFAST', () => {
    render(<CalorieDashboardPage />);

    const addBreakfastBtn = screen.getByRole('button', {
      name: 'Thêm món vào Bữa sáng',
    });
    fireEvent.click(addBreakfastBtn);

    expect(mockPrepareQuickAdd).toHaveBeenCalledWith('BREAKFAST');
  });

  it('bấm nút xóa món trên thẻ bữa ăn gọi deleteMealItem', () => {
    render(<CalorieDashboardPage />);

    const deleteBtn = screen.getByRole('button', {
      name: 'Xóa Bánh mì chảo',
    });
    fireEvent.click(deleteBtn);

    expect(mockDeleteMealItem).toHaveBeenCalledWith('m1');
  });

  it('hiển thị QuickAddCalorieSheet khi isAddSheetOpen là true', () => {
    currentMockCalorieData = {
      ...defaultCalorieData,
      isAddSheetOpen: true,
      selectedMealTypeForAdd: 'LUNCH',
    };

    render(<CalorieDashboardPage />);

    expect(screen.getByText('Thêm vào Bữa trưa')).toBeInTheDocument();
    expect(screen.getByText('BỮA ĂN (TỰ ĐỘNG THEO GIỜ)')).toBeInTheDocument();
  });

  it('hiển thị CalorieGoalSettingSheet khi isGoalSheetOpen là true', () => {
    currentMockCalorieData = {
      ...defaultCalorieData,
      isGoalSheetOpen: true,
    };

    render(<CalorieDashboardPage />);

    expect(screen.getByText('Mục tiêu năng lượng')).toBeInTheDocument();
    expect(screen.getByText('GỢI Ý PHỔ BIẾN')).toBeInTheDocument();
  });
});
