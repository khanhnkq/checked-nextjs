import { describe, it, expect } from 'vitest';
import {
  getCurrentMealType,
  getMealTypeMeta,
  formatCalorieNumber,
  formatDisplayCalorieDate,
  formatDateKey,
  formatMonthKey,
} from '../calorie-formatters';

describe('Calorie Formatters & Helper Utilities', () => {
  describe('getCurrentMealType', () => {
    it('nhận diện BREAKFAST trong khoảng 05:00 - 10:29', () => {
      const d1 = new Date(2026, 9, 31, 5, 0);
      expect(getCurrentMealType(d1)).toBe('BREAKFAST');

      const d2 = new Date(2026, 9, 31, 8, 30);
      expect(getCurrentMealType(d2)).toBe('BREAKFAST');

      const d3 = new Date(2026, 9, 31, 10, 29);
      expect(getCurrentMealType(d3)).toBe('BREAKFAST');
    });

    it('nhận diện LUNCH trong khoảng 10:30 - 14:29', () => {
      const d1 = new Date(2026, 9, 31, 10, 30);
      expect(getCurrentMealType(d1)).toBe('LUNCH');

      const d2 = new Date(2026, 9, 31, 12, 0);
      expect(getCurrentMealType(d2)).toBe('LUNCH');

      const d3 = new Date(2026, 9, 31, 14, 29);
      expect(getCurrentMealType(d3)).toBe('LUNCH');
    });

    it('nhận diện SNACK trong khoảng 14:30 - 16:59', () => {
      const d1 = new Date(2026, 9, 31, 14, 30);
      expect(getCurrentMealType(d1)).toBe('SNACK');

      const d2 = new Date(2026, 9, 31, 16, 0);
      expect(getCurrentMealType(d2)).toBe('SNACK');
    });

    it('nhận diện DINNER trong khoảng 17:00 - 21:29', () => {
      const d1 = new Date(2026, 9, 31, 17, 0);
      expect(getCurrentMealType(d1)).toBe('DINNER');

      const d2 = new Date(2026, 9, 31, 19, 30);
      expect(getCurrentMealType(d2)).toBe('DINNER');

      const d3 = new Date(2026, 9, 31, 21, 29);
      expect(getCurrentMealType(d3)).toBe('DINNER');
    });

    it('nhận diện SNACK cho khung giờ đêm muộn (21:30 - 04:59)', () => {
      const d1 = new Date(2026, 9, 31, 21, 30);
      expect(getCurrentMealType(d1)).toBe('SNACK');

      const d2 = new Date(2026, 9, 31, 23, 59);
      expect(getCurrentMealType(d2)).toBe('SNACK');

      const d3 = new Date(2026, 9, 31, 3, 0);
      expect(getCurrentMealType(d3)).toBe('SNACK');
    });
  });

  describe('getMealTypeMeta', () => {
    it('trả về đúng metadata cho từng bữa ăn', () => {
      const bf = getMealTypeMeta('BREAKFAST');
      expect(bf.displayName).toBe('Bữa sáng');
      expect(bf.timeRangeDescription).toBe('05:00 - 10:30');

      const lunch = getMealTypeMeta('LUNCH');
      expect(lunch.displayName).toBe('Bữa trưa');
      expect(lunch.timeRangeDescription).toBe('10:30 - 14:30');

      const dinner = getMealTypeMeta('DINNER');
      expect(dinner.displayName).toBe('Bữa tối');
      expect(dinner.timeRangeDescription).toBe('17:00 - 21:30');

      const snack = getMealTypeMeta('SNACK');
      expect(snack.displayName).toBe('Bữa phụ');
      expect(snack.timeRangeDescription).toBe('14:30 - 17:00 & Đêm');
    });
  });

  describe('formatCalorieNumber', () => {
    it('định dạng số phân cách hàng nghìn', () => {
      expect(formatCalorieNumber(0)).toBe('0');
      expect(formatCalorieNumber(1650)).toBe('1.650');
      expect(formatCalorieNumber(20000)).toBe('20.000');
      expect(formatCalorieNumber(NaN)).toBe('0');
    });
  });

  describe('formatDisplayCalorieDate', () => {
    it('trả về "Hôm nay" nếu là ngày hiện tại', () => {
      const today = new Date();
      expect(formatDisplayCalorieDate(today)).toBe('Hôm nay');
    });

    it('trả về "Hôm qua" nếu là ngày trước đó', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDisplayCalorieDate(yesterday)).toBe('Hôm qua');
    });

    it('trả về Thứ X, dd/MM cho ngày khác', () => {
      // 2026-10-25 là Chủ Nhật
      const date = new Date(2026, 9, 25);
      expect(formatDisplayCalorieDate(date)).toBe('Chủ Nhật, 25/10');
    });

    it('trả về rỗng nếu chuỗi ngày không hợp lệ', () => {
      expect(formatDisplayCalorieDate('invalid-date')).toBe('');
    });
  });

  describe('formatDateKey & formatMonthKey', () => {
    it('chuyển đổi Date sang dateKey yyyy-MM-dd và monthKey yyyyMM', () => {
      const date = new Date(2026, 9, 31);
      expect(formatDateKey(date)).toBe('2026-10-31');
      expect(formatMonthKey(date)).toBe('202610');
    });
  });
});
