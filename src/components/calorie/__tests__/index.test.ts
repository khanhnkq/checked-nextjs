import { describe, it, expect } from 'vitest';
import * as CalorieComponents from '../index';

describe('Calorie Components Barrel Export', () => {
  it('xuất đầy đủ tất cả các component của phân hệ Calorie', () => {
    expect(CalorieComponents.CalorieHeaderBar).toBeDefined();
    expect(CalorieComponents.CalorieDashboardSkeleton).toBeDefined();
    expect(CalorieComponents.CalorieHeroCard).toBeDefined();
    expect(CalorieComponents.MonthlyCalorieChartCard).toBeDefined();
    expect(CalorieComponents.MealItemRow).toBeDefined();
    expect(CalorieComponents.MealSectionCard).toBeDefined();
    expect(CalorieComponents.QuickAddCalorieSheet).toBeDefined();
  });
});
