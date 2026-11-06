import { describe, it, expect } from 'vitest';
import * as ProfileExports from '../index';

describe('Profile Components Barrel Export', () => {
  it('export đầy đủ 8 components của màn hình Profile', () => {
    expect(ProfileExports.ProfileTopBar).toBeDefined();
    expect(ProfileExports.ProfileHeader).toBeDefined();
    expect(ProfileExports.BudgetSummaryCard).toBeDefined();
    expect(ProfileExports.CalorieSummaryCard).toBeDefined();
    expect(ProfileExports.ProfileStatsFooter).toBeDefined();
    expect(ProfileExports.CalendarHistoryCard).toBeDefined();
    expect(ProfileExports.BudgetSettingSheet).toBeDefined();
    expect(ProfileExports.CalorieGoalSettingSheet).toBeDefined();
  });
});
