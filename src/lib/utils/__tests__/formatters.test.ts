import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatTimeAgo,
  formatCurrentMonthVi,
  formatMonthKey,
  formatDateKey,
  getDaysInMonth,
} from '../formatters';

describe('formatters utility suite', () => {
  describe('formatCurrency', () => {
    it('định dạng số tiền hợp lệ sang VND', () => {
      const formatted = formatCurrency(150000);
      expect(formatted).toMatch(/150\.000/);
      expect(formatted).toContain('₫');
    });

    it('trả về "0 ₫" nếu giá trị truyền vào không hợp lệ hoặc 0', () => {
      expect(formatCurrency(0)).toMatch(/0/);
      expect(formatCurrency(NaN)).toBe('0 ₫');
      expect(formatCurrency(Infinity)).toBe('0 ₫');
      // @ts-expect-error test invalid type
      expect(formatCurrency(undefined)).toBe('0 ₫');
    });
  });

  describe('formatCurrentMonthVi', () => {
    it('định dạng đúng chuẩn "Tháng M YYYY" cho ngày truyền vào', () => {
      const date = new Date(2026, 9, 30); // Tháng 10 năm 2026 (0-indexed month)
      expect(formatCurrentMonthVi(date)).toBe('Tháng 10 2026');
    });

    it('hỗ trợ date dạng chuỗi ISO', () => {
      expect(formatCurrentMonthVi('2026-03-15T00:00:00Z')).toBe('Tháng 3 2026');
    });

    it('fallback về tháng năm hiện tại nếu không truyền hoặc truyền null/invalid', () => {
      const now = new Date();
      const expected = `Tháng ${now.getMonth() + 1} ${now.getFullYear()}`;
      expect(formatCurrentMonthVi()).toBe(expected);
      expect(formatCurrentMonthVi(null)).toBe(expected);
      expect(formatCurrentMonthVi('invalid-date')).toBe(expected);
    });
  });

  describe('formatMonthKey', () => {
    it('trả về định dạng yyyyMM có đệm số 0 cho tháng < 10', () => {
      const march = new Date(2026, 2, 1); // Tháng 3 (month index 2)
      expect(formatMonthKey(march)).toBe('202603');
    });

    it('trả về đúng định dạng cho tháng 10, 11, 12', () => {
      const oct = new Date(2026, 9, 15); // Tháng 10
      expect(formatMonthKey(oct)).toBe('202610');
      const dec = new Date(2026, 11, 31); // Tháng 12
      expect(formatMonthKey(dec)).toBe('202612');
    });

    it('hỗ trợ date dạng string', () => {
      expect(formatMonthKey('2026-05-20')).toBe('202605');
    });
  });

  describe('formatDateKey', () => {
    it('trả về định dạng yyyy-MM-dd chuẩn ISO', () => {
      const date = new Date(2026, 9, 5); // 05/10/2026
      expect(formatDateKey(date)).toBe('2026-10-05');
    });

    it('đệm số 0 cho cả ngày và tháng có 1 chữ số', () => {
      const date = new Date(2026, 3, 2); // 02/04/2026
      expect(formatDateKey(date)).toBe('2026-04-02');
    });
  });

  describe('getDaysInMonth', () => {
    it('trả về 31 ngày cho các tháng 1, 3, 5, 7, 8, 10, 12', () => {
      expect(getDaysInMonth(2026, 1)).toBe(31);
      expect(getDaysInMonth(2026, 10)).toBe(31);
      expect(getDaysInMonth(2026, 12)).toBe(31);
    });

    it('trả về 30 ngày cho các tháng 4, 6, 9, 11', () => {
      expect(getDaysInMonth(2026, 4)).toBe(30);
      expect(getDaysInMonth(2026, 6)).toBe(30);
      expect(getDaysInMonth(2026, 9)).toBe(30);
      expect(getDaysInMonth(2026, 11)).toBe(30);
    });

    it('trả về 28 ngày cho Tháng 2 năm thường (2026)', () => {
      expect(getDaysInMonth(2026, 2)).toBe(28);
    });

    it('trả về 29 ngày cho Tháng 2 năm nhuận (2024, 2028)', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(getDaysInMonth(2028, 2)).toBe(29);
    });
  });

  describe('formatTimeAgo', () => {
    it('trả về "Vừa xong" nếu thời gian < 60 giây', () => {
      const now = new Date();
      expect(formatTimeAgo(now)).toBe('Vừa xong');
    });

    it('trả về số phút trước nếu thời gian < 1 giờ', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatTimeAgo(fiveMinsAgo)).toBe('5 phút trước');
    });

    it('trả về số giờ trước nếu thời gian < 24 giờ', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatTimeAgo(twoHoursAgo)).toBe('2 giờ trước');
    });

    it('trả về "Vừa xong" khi truyền null hoặc giá trị không hợp lệ', () => {
      expect(formatTimeAgo(null)).toBe('Vừa xong');
      expect(formatTimeAgo('invalid')).toBe('Vừa xong');
    });
  });
});
