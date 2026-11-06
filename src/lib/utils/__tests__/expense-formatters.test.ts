import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatShortCurrency,
  normalizeMonthKey,
  formatMonthTitle,
  formatMonthCapsule,
  formatTransactionDate,
  getCategoryIconName,
  generateAvailableMonths,
  generate12MonthsCashflowPoints,
} from '../expense-formatters';

describe('expense-formatters', () => {
  describe('formatCurrency', () => {
    it('định dạng số tiền dương chuẩn VNĐ', () => {
      expect(formatCurrency(1250000)).toBe('1.250.000 đ');
      expect(formatCurrency(50000)).toBe('50.000 đ');
      expect(formatCurrency(0)).toBe('0 đ');
    });

    it('định dạng số tiền âm chuẩn VNĐ', () => {
      expect(formatCurrency(-500000)).toBe('-500.000 đ');
      expect(formatCurrency(-1250000)).toBe('-1.250.000 đ');
    });

    it('xử lý số NaN an toàn', () => {
      expect(formatCurrency(NaN)).toBe('0 đ');
    });
  });

  describe('formatShortCurrency', () => {
    it('định dạng số tiền rút gọn', () => {
      expect(formatShortCurrency(500)).toBe('500đ');
      expect(formatShortCurrency(50000)).toBe('50k');
      expect(formatShortCurrency(560000)).toBe('560k');
      expect(formatShortCurrency(1000000)).toBe('1tr');
      expect(formatShortCurrency(1200000)).toBe('1.2tr');
      expect(formatShortCurrency(2000000000)).toBe('2 tỷ');
      expect(formatShortCurrency(2500000000)).toBe('2.5 tỷ');
    });

    it('định dạng số âm rút gọn', () => {
      expect(formatShortCurrency(-50000)).toBe('-50k');
      expect(formatShortCurrency(-1500000)).toBe('-1.5tr');
      expect(formatShortCurrency(-2000000000)).toBe('-2 tỷ');
    });

    it('xử lý 0 và NaN', () => {
      expect(formatShortCurrency(0)).toBe('0đ');
      expect(formatShortCurrency(NaN)).toBe('0đ');
    });
  });

  describe('normalizeMonthKey, formatMonthTitle & formatMonthCapsule', () => {
    it('chuẩn hóa monthKey 6 ký tự hoặc gạch ngang', () => {
      expect(normalizeMonthKey('202610')).toEqual({ year: 2026, month: 10, normalizedKey: '202610' });
      expect(normalizeMonthKey('2026-10')).toEqual({ year: 2026, month: 10, normalizedKey: '202610' });
      expect(normalizeMonthKey('2026-05')).toEqual({ year: 2026, month: 5, normalizedKey: '202605' });
      expect(normalizeMonthKey('invalid')).toBeNull();
      expect(normalizeMonthKey('')).toBeNull();
    });

    it('định dạng tiêu đề tháng', () => {
      expect(formatMonthTitle('202610')).toBe('Tháng 10, 2026');
      expect(formatMonthTitle('2026-05')).toBe('Tháng 5, 2026');
      expect(formatMonthTitle('invalid')).toBe('invalid');
    });

    it('định dạng capsule tháng', () => {
      expect(formatMonthCapsule('202610')).toBe('Tháng 10');
      expect(formatMonthCapsule('2026-03')).toBe('Tháng 3');
      expect(formatMonthCapsule('invalid')).toBe('invalid');
    });
  });

  describe('formatTransactionDate', () => {
    it('định dạng hôm nay', () => {
      const now = new Date();
      now.setHours(14, 30, 0, 0);
      expect(formatTransactionDate(now)).toBe('Hôm nay, 14:30');
    });

    it('định dạng hôm qua', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(9, 15, 0, 0);
      expect(formatTransactionDate(yesterday)).toBe('Hôm qua, 09:15');
    });

    it('định dạng ngày khác', () => {
      const otherDate = new Date(2026, 9, 20, 18, 5); // 20/10/2026 18:05
      expect(formatTransactionDate(otherDate)).toBe('20/10, 18:05');
    });

    it('xử lý chuỗi không hợp lệ an toàn', () => {
      expect(formatTransactionDate('invalid-date')).toBe('');
    });
  });

  describe('getCategoryIconName', () => {
    it('ánh xạ đúng tên icon Lucide tương ứng', () => {
      expect(getCategoryIconName('Cơm tấm Ba Ghiền')).toBe('Utensils');
      expect(getCategoryIconName('Phở bò')).toBe('Utensils');
      expect(getCategoryIconName('Highlands Coffee')).toBe('Coffee');
      expect(getCategoryIconName('Trà sữa Phúc Long')).toBe('Coffee');
      expect(getCategoryIconName('Mua sắm Shopee')).toBe('ShoppingBag');
      expect(getCategoryIconName('GrabBike')).toBe('Car');
      expect(getCategoryIconName('Lương tháng 10')).toBe('Banknote');
      expect(getCategoryIconName('Chi phí khác')).toBe('CreditCard');
      expect(getCategoryIconName(null)).toBe('CreditCard');
    });
  });

  describe('generateAvailableMonths', () => {
    it('tạo danh sách 7 tháng lân cận', () => {
      const months = generateAvailableMonths('202610');
      expect(months).toHaveLength(7);
      expect(months).toContain('202610');
      expect(months[0]).toBe('202605'); // 5 tháng trước
      expect(months[months.length - 1]).toBe('202611'); // 1 tháng sau
    });
  });

  describe('generate12MonthsCashflowPoints', () => {
    it('tạo đủ 12 cột T1 đến T12 cho năm', () => {
      const mockBackendMonths = [
        { monthKey: '202601', income: 10000000, expense: 5000000, net: 5000000 },
        { monthKey: '2026-10', income: 25000000, expense: 12000000, net: 13000000 },
      ];

      const points = generate12MonthsCashflowPoints(2026, mockBackendMonths);
      expect(points).toHaveLength(12);
      expect(points[0]).toEqual({
        monthKey: '202601',
        monthIndex: 1,
        monthName: 'T1',
        income: 10000000,
        expense: 5000000,
        net: 5000000,
      });

      expect(points[9]).toEqual({
        monthKey: '202610',
        monthIndex: 10,
        monthName: 'T10',
        income: 25000000,
        expense: 12000000,
        net: 13000000,
      });

      // Tháng không có dữ liệu trả về 0
      expect(points[1]).toEqual({
        monthKey: '202602',
        monthIndex: 2,
        monthName: 'T2',
        income: 0,
        expense: 0,
        net: 0,
      });
    });
  });
});
