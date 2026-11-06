import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCalorieGoal,
  updateCalorieGoal,
  getDailyCalorieSummary,
  getMonthlyCalorieSummary,
  createCalorieLog,
  deleteCalorieLog,
  calorieKeys,
} from '../calorie-api';
import { customFetcher } from '../custom-fetcher';
import type { CreateCalorieLogRequest } from '@/types/calorie';

vi.mock('../custom-fetcher', () => ({
  customFetcher: vi.fn(),
}));

describe('Calorie API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calorieKeys', () => {
    it('sinh đúng cấu trúc query keys cho React Query', () => {
      expect(calorieKeys.all).toEqual(['/api/v1/calories']);
      expect(calorieKeys.goal()).toEqual(['/api/v1/calories/goal']);
      expect(calorieKeys.daily('2026-10-30')).toEqual(['/api/v1/calories/daily', '2026-10-30']);
      expect(calorieKeys.summary('202610')).toEqual(['/api/v1/calories/summary', '202610']);
      expect(calorieKeys.logs()).toEqual(['/api/v1/calories/logs']);
    });
  });

  describe('getCalorieGoal', () => {
    it('gọi GET /api/v1/calories/goal thành công', async () => {
      const mockResponse = { dailyTargetCalories: 2000 };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockResponse);

      const controller = new AbortController();
      const result = await getCalorieGoal(controller.signal);

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/calories/goal',
        method: 'GET',
        signal: controller.signal,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateCalorieGoal', () => {
    it('gọi PUT /api/v1/calories/goal kèm header JSON và body', async () => {
      const payload = { dailyTargetCalories: 2200 };
      const mockResponse = { dailyTargetCalories: 2200 };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockResponse);

      const result = await updateCalorieGoal(payload);

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/calories/goal',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        data: payload,
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDailyCalorieSummary', () => {
    it('gọi GET /api/v1/calories/daily có query param date', async () => {
      const mockSummary = {
        dateString: '2026-10-30',
        dailyTargetCalories: 2000,
        consumedCalories: 1450,
        remainingCalories: 550,
        isExceeded: false,
        percentage: 72,
        meals: [],
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockSummary);

      const result = await getDailyCalorieSummary('2026-10-30');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/calories/daily',
        method: 'GET',
        params: { date: '2026-10-30' },
        signal: undefined,
      });
      expect(result).toEqual(mockSummary);
    });

    it('gọi GET /api/v1/calories/daily không truyền date thì params là undefined', async () => {
      const mockSummary = {
        dailyTargetCalories: 2000,
        consumedCalories: 0,
        remainingCalories: 2000,
        isExceeded: false,
        percentage: 0,
        meals: [],
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockSummary);

      const result = await getDailyCalorieSummary();

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/calories/daily',
        method: 'GET',
        params: undefined,
        signal: undefined,
      });
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getMonthlyCalorieSummary', () => {
    it('gọi GET /api/v1/calories/summary có query param month', async () => {
      const mockMonthly = {
        monthKey: '202610',
        dailyTargetCalories: 2000,
        averageDailyCalories: 1850,
        daysOnTrack: 22,
        days: [{ day: 1, calories: 1800 }],
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockMonthly);

      const result = await getMonthlyCalorieSummary('202610');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/calories/summary',
        method: 'GET',
        params: { month: '202610' },
        signal: undefined,
      });
      expect(result).toEqual(mockMonthly);
    });
  });

  describe('createCalorieLog', () => {
    it('gọi POST /api/v1/calories/logs kèm payload món ăn', async () => {
      const payload: CreateCalorieLogRequest = {
        calories: 350,
        mealType: 'BREAKFAST',
        dishName: 'Bánh mì thịt',
      };
      const mockCreated = {
        id: 'log-1',
        calories: 350,
        mealType: 'BREAKFAST',
        dishName: 'Bánh mì thịt',
        loggedAt: '2026-10-31T08:00:00Z',
      };
      vi.mocked(customFetcher).mockResolvedValueOnce(mockCreated);

      const result = await createCalorieLog(payload);

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/calories/logs',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: payload,
        signal: undefined,
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('deleteCalorieLog', () => {
    it('gọi DELETE /api/v1/calories/logs/{id} thành công', async () => {
      vi.mocked(customFetcher).mockResolvedValueOnce(undefined);

      await deleteCalorieLog('log-123');

      expect(customFetcher).toHaveBeenCalledWith({
        url: '/api/v1/calories/logs/log-123',
        method: 'DELETE',
        signal: undefined,
      });
    });
  });
});
