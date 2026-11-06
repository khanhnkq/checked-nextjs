/**
 * Post Aggregator & Streak Engine
 * Chuẩn parity 1:1 với ProfileView.swift trong checked-ios
 */

import type { ExpenseItemResponse, PhotoResponse } from '@/types/api.generated.ts';
import type { DayCalendarData, UnifiedPostItem } from '@/types/profile';
import { getDaysInMonth } from '@/lib/utils/formatters';

export interface CalendarAggregationResult {
  /** Map chứa bài đăng mới nhất và số lượng bài theo từng ngày trong tháng (key là ngày 1..31) */
  dayCalendarData: Record<number, DayCalendarData>;
  /** Tổng số Checked đã đăng */
  checkedCount: number;
  /** Chuỗi ngày check-in liên tiếp */
  streakDays: number;
}

/**
 * Thuật toán tính chuỗi ngày liên tiếp (Streak)
 * Đối chiếu 1:1 với hàm calculateStreak trong ProfileView.swift
 *
 * Quy tắc:
 * 1. Bắt đầu từ ngày hôm nay (todayDayNumber).
 * 2. Nếu hôm nay chưa có bài post, bắt đầu xét từ ngày hôm qua (todayDayNumber - 1).
 * 3. Đếm lùi liên tiếp: chừng nào ngày đó có bài post thì tăng streak.
 * 4. Dừng ngay khi gặp ngày đầu tiên không có bài post.
 * 5. Giá trị trả về tối thiểu là 1 nếu đã có dữ liệu.
 */
export function calculateStreakDays(
  dayCalendarData: Record<number, DayCalendarData>,
  todayDayNumber: number
): number {
  let streak = 0;
  let currentDay = todayDayNumber;

  // Nếu hôm nay chưa check-in, kiểm tra xem hôm qua có giữ chuỗi không
  if (!dayCalendarData[todayDayNumber]) {
    currentDay = todayDayNumber - 1;
  }

  while (currentDay >= 1 && dayCalendarData[currentDay]) {
    streak += 1;
    currentDay -= 1;
  }

  return Math.max(streak, 1);
}

/**
 * Gom nhóm bài đăng từ ảnh cá nhân và ảnh hóa đơn giao dịch theo ngày trong tháng
 * Đối chiếu 1:1 với hàm updateCalendarData trong ProfileView.swift
 */
export function aggregateCalendarData(params: {
  entries?: ExpenseItemResponse[];
  myPhotos?: PhotoResponse[];
  targetDate?: Date;
}): CalendarAggregationResult {
  const { entries = [], myPhotos = [], targetDate = new Date() } = params;

  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth(); // 0-based
  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth + 1);

  const allPosts: UnifiedPostItem[] = [];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();

  // 1. Thu thập từ myPhotos (PhotoRepository - Ảnh khoảnh khắc cá nhân)
  for (const photo of myPhotos) {
    const id = photo.id;
    const img = photo.thumbnailUrl || photo.imageUrl;
    if (!id || !img) continue;

    const rawDate = photo.takenAt || photo.createdAt;
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || isNaN(date.getTime())) continue;

    if (!seenIds.has(id) && !seenUrls.has(img)) {
      seenIds.add(id);
      seenUrls.add(img);
      allPosts.push({ id, date, imageUrl: img });
    }
  }

  // 2. Thu thập từ entries (ExpenseRepository - Giao dịch có ảnh hóa đơn)
  for (const entry of entries) {
    const id = entry.photoId;
    const img = entry.thumbnailUrl || entry.imageUrl;
    if (!id || !img) continue;

    const rawDate = entry.takenAt || entry.createdAt;
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || isNaN(date.getTime())) continue;

    if (!seenIds.has(id) && !seenUrls.has(img)) {
      seenIds.add(id);
      seenUrls.add(img);
      allPosts.push({ id, date, imageUrl: img });
    }
  }

  // 3. Lọc bài đăng thuộc đúng tháng và năm hiện tại, nhóm theo ngày (1..daysInCurrentMonth)
  const groupedByDay: Record<number, UnifiedPostItem[]> = {};

  for (const post of allPosts) {
    const postYear = post.date.getFullYear();
    const postMonth = post.date.getMonth();

    if (postYear === currentYear && postMonth === currentMonth) {
      const day = post.date.getDate();
      if (day >= 1 && day <= daysInCurrentMonth) {
        if (!groupedByDay[day]) {
          groupedByDay[day] = [];
        }
        groupedByDay[day].push(post);
      }
    }
  }

  // 4. Tìm bài post MỚI NHẤT trong ngày và đếm tổng số bài post trong ngày
  const calculatedData: Record<number, DayCalendarData> = {};

  for (const [dayStr, posts] of Object.entries(groupedByDay)) {
    const day = Number(dayStr);
    // Sắp xếp bài post theo thời gian giảm dần (mới nhất lên đầu)
    const sorted = [...posts].sort((a, b) => b.date.getTime() - a.date.getTime());
    const latest = sorted[0];

    if (latest) {
      calculatedData[day] = {
        latestImageUrl: latest.imageUrl,
        latestDate: latest.date,
        postCount: posts.length,
      };
    }
  }

  // 5. Cập nhật tổng số Checked thực tế
  const totalMonthPosts = Object.values(calculatedData).reduce(
    (acc, curr) => acc + curr.postCount,
    0
  );
  const checkedCount = Math.max(totalMonthPosts, myPhotos.length);

  // 6. Tính chuỗi ngày streak
  const todayDayNumber = targetDate.getDate();
  const streakDays = calculateStreakDays(calculatedData, todayDayNumber);

  return {
    dayCalendarData: calculatedData,
    checkedCount,
    streakDays,
  };
}
