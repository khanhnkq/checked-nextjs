import { describe, it, expect } from 'vitest';
import {
  aggregateCalendarData,
  calculateStreakDays,
} from '../calendar-aggregator';
import type { PhotoResponse, ExpenseItemResponse } from '@/types/api.generated.ts';
import type { DayCalendarData } from '@/types/profile';

describe('calendar-aggregator utility suite', () => {
  describe('calculateStreakDays', () => {
    it('trả về 1 nếu lịch hoàn toàn trống', () => {
      const emptyCalendar: Record<number, DayCalendarData> = {};
      expect(calculateStreakDays(emptyCalendar, 15)).toBe(1);
    });

    it('tính đúng chuỗi 3 ngày liên tiếp khi hôm nay đã có post (13, 14, 15)', () => {
      const calendar: Record<number, DayCalendarData> = {
        13: { latestImageUrl: 'img13.jpg', latestDate: new Date(), postCount: 1 },
        14: { latestImageUrl: 'img14.jpg', latestDate: new Date(), postCount: 2 },
        15: { latestImageUrl: 'img15.jpg', latestDate: new Date(), postCount: 1 },
      };
      // Hôm nay là ngày 15
      expect(calculateStreakDays(calendar, 15)).toBe(3);
    });

    it('bảo toàn streak nếu hôm nay chưa post nhưng hôm qua có post (13, 14)', () => {
      const calendar: Record<number, DayCalendarData> = {
        13: { latestImageUrl: 'img13.jpg', latestDate: new Date(), postCount: 1 },
        14: { latestImageUrl: 'img14.jpg', latestDate: new Date(), postCount: 1 },
      };
      // Hôm nay là ngày 15 (chưa post)
      expect(calculateStreakDays(calendar, 15)).toBe(2);
    });

    it('dừng streak khi gặp ngày đứt quãng (có 15, không có 14, có 13)', () => {
      const calendar: Record<number, DayCalendarData> = {
        12: { latestImageUrl: 'img12.jpg', latestDate: new Date(), postCount: 1 },
        13: { latestImageUrl: 'img13.jpg', latestDate: new Date(), postCount: 1 },
        // Ngày 14 đứt quãng
        15: { latestImageUrl: 'img15.jpg', latestDate: new Date(), postCount: 1 },
      };
      // Hôm nay là ngày 15 -> streak = 1
      expect(calculateStreakDays(calendar, 15)).toBe(1);
    });

    it('trả về 1 nếu cả hôm nay và hôm qua đều không có post', () => {
      const calendar: Record<number, DayCalendarData> = {
        10: { latestImageUrl: 'img10.jpg', latestDate: new Date(), postCount: 1 },
      };
      // Hôm nay là ngày 15, hôm qua là 14 (đều không có)
      expect(calculateStreakDays(calendar, 15)).toBe(1);
    });
  });

  describe('aggregateCalendarData', () => {
    const targetDate = new Date(2026, 9, 30); // Ngày 30 Tháng 10 năm 2026

    it('xử lý an toàn khi không có dữ liệu', () => {
      const result = aggregateCalendarData({
        entries: [],
        myPhotos: [],
        targetDate,
      });

      expect(result.dayCalendarData).toEqual({});
      expect(result.checkedCount).toBe(0);
      expect(result.streakDays).toBe(1);
    });

    it('lọc bỏ các ảnh thuộc tháng hoặc năm khác', () => {
      const photos: PhotoResponse[] = [
        {
          id: 'photo-sep',
          imageUrl: 'https://example.com/sep.jpg',
          createdAt: '2026-09-25T10:00:00Z', // Tháng 9
        },
        {
          id: 'photo-last-year',
          imageUrl: 'https://example.com/2025.jpg',
          createdAt: '2025-10-30T10:00:00Z', // Năm 2025
        },
        {
          id: 'photo-oct',
          imageUrl: 'https://example.com/oct.jpg',
          createdAt: '2026-10-15T12:00:00Z', // Tháng 10 hợp lệ
        },
      ];

      const result = aggregateCalendarData({
        myPhotos: photos,
        targetDate,
      });

      expect(Object.keys(result.dayCalendarData)).toEqual(['15']);
      expect(result.dayCalendarData[15].latestImageUrl).toBe('https://example.com/oct.jpg');
      expect(result.dayCalendarData[15].postCount).toBe(1);
    });

    it('khử trùng lặp ảnh giữa myPhotos và expenseEntries theo id và url', () => {
      const photos: PhotoResponse[] = [
        {
          id: 'dup-1',
          imageUrl: 'https://example.com/same-bill.jpg',
          createdAt: '2026-10-10T08:00:00Z',
        },
      ];

      const entries: ExpenseItemResponse[] = [
        {
          photoId: 'dup-1', // Trùng photoId
          imageUrl: 'https://example.com/same-bill.jpg',
          createdAt: '2026-10-10T08:00:00Z',
        },
      ];

      const result = aggregateCalendarData({
        entries,
        myPhotos: photos,
        targetDate,
      });

      // Chỉ được tính 1 bài duy nhất
      expect(result.dayCalendarData[10].postCount).toBe(1);
    });

    it('sắp xếp và chọn ảnh mới nhất trong ngày khi có nhiều bài post', () => {
      const photos: PhotoResponse[] = [
        {
          id: 'p-morning',
          imageUrl: 'https://example.com/morning.jpg',
          createdAt: new Date(2026, 9, 20, 8, 0).toISOString(),
        },
        {
          id: 'p-evening',
          imageUrl: 'https://example.com/evening.jpg',
          createdAt: new Date(2026, 9, 20, 19, 30).toISOString(), // Mới hơn
        },
        {
          id: 'p-noon',
          imageUrl: 'https://example.com/noon.jpg',
          createdAt: new Date(2026, 9, 20, 12, 0).toISOString(),
        },
      ];

      const result = aggregateCalendarData({
        myPhotos: photos,
        targetDate,
      });

      expect(result.dayCalendarData[20].postCount).toBe(3);
      expect(result.dayCalendarData[20].latestImageUrl).toBe('https://example.com/evening.jpg');
    });

    it('tính đúng checkedCount và streakDays khi có bài post liên tiếp', () => {
      const photos: PhotoResponse[] = [
        {
          id: 'day-28',
          imageUrl: 'https://example.com/d28.jpg',
          createdAt: new Date(2026, 9, 28, 10, 0).toISOString(),
        },
        {
          id: 'day-29',
          imageUrl: 'https://example.com/d29.jpg',
          createdAt: new Date(2026, 9, 29, 10, 0).toISOString(),
        },
        {
          id: 'day-30',
          imageUrl: 'https://example.com/d30.jpg',
          createdAt: new Date(2026, 9, 30, 10, 0).toISOString(),
        },
      ];

      const result = aggregateCalendarData({
        myPhotos: photos,
        targetDate, // Ngày 30
      });

      expect(result.checkedCount).toBe(3);
      expect(result.streakDays).toBe(3);
    });
  });
});
