import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '../page';
import { useAuthStore } from '@/stores/auth-store';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/hooks/useProfileData', () => ({
  useProfileData: () => ({
    summaryState: {
      budgetLimit: 1000000,
      totalSpent: 250000,
      savingsTarget: 500000,
      currentSaved: 100000,
      targetCalories: 2000,
      totalCaloriesToday: 800,
    },
    dayCalendarData: [],
    isLoadingSummary: false,
    isLoadingCalendar: false,
    monthTitle: 'Tháng 11 2026',
    updateBudget: vi.fn(),
    updateCalorieTarget: vi.fn(),
  }),
}));

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
    success: vi.fn(),
  },
}));

describe('ProfilePage Mobile Safe Area', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('render skeleton với class pt-safe khi chưa hydrate', () => {
    useAuthStore.setState({ isHydrated: false, isAuthenticated: false, user: null });
    render(<ProfilePage />);

    const skeleton = screen.getByTestId('profile-loading-skeleton');
    expect(skeleton.className).toContain('pt-safe');
  });

  it('render trang chính với class pt-safe trên container topbar', () => {
    useAuthStore.setState({
      isHydrated: true,
      isAuthenticated: true,
      user: {
        id: 'u-1',
        email: 'test@example.com',
        username: 'test_user',
        displayName: 'Test User',
        avatarUrl: null,
        isVerified: true,
        profileCompleted: true,
        isGoldMember: false,
      },
    });

    render(<ProfilePage />);
    const main = screen.getByTestId('profile-page-main');
    const container = main.querySelector('.pt-safe');
    expect(container).not.toBeNull();
    expect(container?.className).toContain('pt-safe');
  });
});
