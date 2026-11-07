import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ProfilePage from '../page';

// 1. Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
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
    avatarUrl?: string;
  } | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const mockAuthState: MockAuthStateType = {
  user: {
    id: 'user-1',
    displayName: 'Quốc Khánh',
    username: 'khanhnkq',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  isAuthenticated: true,
  isHydrated: true,
};
const mockUseAuthStore = vi.fn<() => MockAuthStateType>(() => mockAuthState);
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// 4. Mock Profile Data Hook
const mockUpdateBudget = vi.fn().mockResolvedValue(true);
const mockUpdateCalorieTarget = vi.fn().mockResolvedValue(true);
const mockRefetch = vi.fn().mockResolvedValue(undefined);

const defaultProfileData = {
  summaryState: {
    totalSpent: 1250000,
    budgetLimit: 3000000,
    alertPct: 80,
    savingsTarget: 500000,
    percentUsed: 41.6,
    remaining: 1750000,
    isBudgetExceeded: false,
    todayCalories: 1650,
    targetCalories: 2000,
    calorieExceeded: false,
    caloriePercentage: 82.5,
    checkedCount: 24,
    streakDays: 7,
  },
  dayCalendarData: {
    5: {
      latestImageUrl: 'https://example.com/img5.jpg',
      latestDate: new Date('2026-10-05T12:00:00Z'),
      postCount: 2,
    },
  },
  isLoadingSummary: false,
  isLoadingCalendar: false,
  isLoading: false,
  monthTitle: 'Tháng 10 2026',
  monthKey: '2026-10',
  todayDateKey: '2026-10-30',
  updateBudget: mockUpdateBudget,
  updateCalorieTarget: mockUpdateCalorieTarget,
  refetch: mockRefetch,
};

const mockUseProfileData = vi.fn(() => defaultProfileData);
vi.mock('@/hooks/useProfileData', () => ({
  useProfileData: () => mockUseProfileData(),
}));

describe('ProfilePage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue(mockAuthState);
    mockUseProfileData.mockReturnValue(defaultProfileData);
  });

  it('hiển thị khung skeleton khi authStore chưa hydrate (isHydrated=false)', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
    });

    render(<ProfilePage />);

    expect(
      screen.getByTestId('profile-loading-skeleton')
    ).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('chuyển hướng sang /login?redirect=/profile khi đã hydrate nhưng chưa đăng nhập', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });

    render(<ProfilePage />);

    expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/profile');
    expect(screen.queryByTestId('profile-page-main')).not.toBeInTheDocument();
  });

  it('render đầy đủ trang Profile khi đã đăng nhập', () => {
    render(<ProfilePage />);

    // Kiểm tra main container
    expect(screen.getByTestId('profile-page-main')).toBeInTheDocument();

    // TopBar
    expect(screen.getByText('Checked GOLD')).toBeInTheDocument();

    // Header
    expect(screen.getByText('Quốc Khánh')).toBeInTheDocument();
    expect(screen.getByText('@khanhnkq')).toBeInTheDocument();

    // Budget Card
    expect(screen.getByText('Chi tiêu tháng này')).toBeInTheDocument();
    expect(screen.getByText(/1\.250\.000/)).toBeInTheDocument();

    // Calorie Card
    expect(screen.getByText('Năng lượng hôm nay')).toBeInTheDocument();
    expect(screen.getByText('1650 kcal')).toBeInTheDocument();

    // Section Lịch sử & Calendar Card
    expect(screen.getByText('Lịch sử')).toBeInTheDocument();
    expect(screen.getByText('Tháng 10 2026')).toBeInTheDocument();

    // Stats Footer
    expect(screen.getByText(/24 Checked/)).toBeInTheDocument();
    expect(screen.getByText(/7d chuỗi/)).toBeInTheDocument();
  });

  it('mở BudgetSettingSheet khi click vào thân BudgetSummaryCard và gọi updateBudget khi lưu', async () => {
    render(<ProfilePage />);

    // Click vào thân thẻ ngân sách
    const budgetCard = screen.getByRole('button', {
      name: 'Thẻ chi tiêu tháng này',
    });
    fireEvent.click(budgetCard);

    // Bottom sheet hiển thị tiêu đề
    expect(screen.getByText('Ngân sách & Tiết kiệm')).toBeInTheDocument();
    expect(screen.getByText('HẠN MỨC CHI TIÊU THÁNG')).toBeInTheDocument();
    expect(
      screen.getByText('MỤC TIÊU TIẾT KIỆM (TÙY CHỌN)')
    ).toBeInTheDocument();

    // Click Lưu thiết lập
    const saveBtn = screen.getByRole('button', { name: 'Lưu thiết lập' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateBudget).toHaveBeenCalled();
    });
  });

  it('điều hướng sang /expense khi click vào mũi tên trên BudgetSummaryCard', async () => {
    render(<ProfilePage />);

    // Click vào nút mũi tên trên thẻ ngân sách
    const arrowBtn = screen.getByRole('button', {
      name: 'Xem chi tiết màn hình chi tiêu',
    });
    fireEvent.click(arrowBtn);

    expect(mockPush).toHaveBeenCalledWith('/expense');
  });

  it('mở CalorieGoalSettingSheet khi click vào CalorieSummaryCard và gọi updateCalorieTarget khi lưu', async () => {
    render(<ProfilePage />);

    // Click vào thẻ calo
    const calorieCard = screen.getByRole('button', {
      name: 'Thẻ năng lượng hôm nay',
    });
    fireEvent.click(calorieCard);

    // Modal hiển thị
    expect(screen.getByText('Mục tiêu năng lượng')).toBeInTheDocument();
    expect(screen.getByText('GỢI Ý PHỔ BIẾN')).toBeInTheDocument();

    // Click preset 2500
    const preset2500 = screen.getByRole('button', { name: '2500' });
    fireEvent.click(preset2500);

    // Click Lưu mục tiêu
    const saveBtn = screen.getByRole('button', { name: 'Lưu mục tiêu' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateCalorieTarget).toHaveBeenCalledWith(2500);
    });
  });

  it('điều hướng sang /calorie khi click vào mũi tên trên CalorieSummaryCard', async () => {
    render(<ProfilePage />);

    // Click vào nút mũi tên trên thẻ calo
    const arrowBtn = screen.getByRole('button', {
      name: 'Xem chi tiết màn hình năng lượng',
    });
    fireEvent.click(arrowBtn);

    expect(mockPush).toHaveBeenCalledWith('/calorie');
  });

  it('điều hướng đúng khi bấm các nút trên TopBar', () => {
    render(<ProfilePage />);

    // Click nút Đóng (quay lại trang chủ)
    const closeBtn = screen.getByRole('button', {
      name: 'Thoát về Camera',
    });
    fireEvent.click(closeBtn);
    expect(mockPush).toHaveBeenCalledWith('/');

    // Click nút Bạn bè
    const friendsBtn = screen.getByRole('button', { name: 'Bạn bè' });
    fireEvent.click(friendsBtn);
    expect(mockPush).toHaveBeenCalledWith('/friends/requests');

    // Click nút Cài đặt
    const settingsBtn = screen.getByRole('button', {
      name: 'Cài đặt',
    });
    fireEvent.click(settingsBtn);
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('điều hướng sang /history khi click vào thẻ lịch sử tháng', () => {
    render(<ProfilePage />);

    const calendarCard = screen.getByRole('button', {
      name: 'Thẻ lịch sử tháng',
    });
    fireEvent.click(calendarCard);

    expect(mockPush).toHaveBeenCalledWith('/history');
  });
});
