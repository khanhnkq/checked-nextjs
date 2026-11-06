/**
 * Calorie Formatters & Helper Utilities
 * Chuẩn Parity 1:1 với CalorieModels.swift và CalorieDashboardViewModel.swift
 */

import type { MealType, MealTypeMeta } from '@/types/calorie';

/**
 * Tự động nhận diện bữa ăn theo thời gian thực tế (Real-time clock)
 * - Bữa sáng: 05:00 - 10:30
 * - Bữa trưa: 10:30 - 14:30
 * - Bữa phụ chiều: 14:30 - 17:00
 * - Bữa tối: 17:00 - 21:30
 * - Bữa phụ đêm: 21:30 - 05:00
 */
export function getCurrentMealType(date: Date = new Date()): MealType {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 5 * 60 && totalMinutes < 10 * 60 + 30) {
    return 'BREAKFAST';
  } else if (totalMinutes >= 10 * 60 + 30 && totalMinutes < 14 * 60 + 30) {
    return 'LUNCH';
  } else if (totalMinutes >= 14 * 60 + 30 && totalMinutes < 17 * 60) {
    return 'SNACK';
  } else if (totalMinutes >= 17 * 60 && totalMinutes < 21 * 60 + 30) {
    return 'DINNER';
  } else {
    return 'SNACK';
  }
}

/**
 * Trả về thông tin metadata hiển thị của từng bữa ăn
 */
export function getMealTypeMeta(type: MealType): MealTypeMeta {
  switch (type) {
    case 'BREAKFAST':
      return {
        type: 'BREAKFAST',
        displayName: 'Bữa sáng',
        timeRangeDescription: '05:00 - 10:30',
        iconName: 'coffee',
      };
    case 'LUNCH':
      return {
        type: 'LUNCH',
        displayName: 'Bữa trưa',
        timeRangeDescription: '10:30 - 14:30',
        iconName: 'sun',
      };
    case 'DINNER':
      return {
        type: 'DINNER',
        displayName: 'Bữa tối',
        timeRangeDescription: '17:00 - 21:30',
        iconName: 'moon',
      };
    case 'SNACK':
    default:
      return {
        type: 'SNACK',
        displayName: 'Bữa phụ',
        timeRangeDescription: '14:30 - 17:00 & Đêm',
        iconName: 'utensils',
      };
  }
}

/**
 * Định dạng phân cách hàng nghìn kiểu Việt Nam (ví dụ 1.650)
 */
export function formatCalorieNumber(num: number): string {
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('vi-VN');
}

/**
 * Định dạng ngày hiển thị (Hôm nay / Hôm qua / Thứ X, dd/MM)
 */
export function formatDisplayCalorieDate(inputDate: Date | string): string {
  const date = typeof inputDate === 'string' ? new Date(inputDate) : inputDate;
  if (isNaN(date.getTime())) return '';

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) {
    return 'Hôm nay';
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Hôm qua';
  }

  const daysOfWeek = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  const dayName = daysOfWeek[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');

  return `${dayName}, ${dd}/${mm}`;
}

/**
 * Chuyển đổi Date sang dateKey định dạng yyyy-MM-dd
 */
export function formatDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Chuyển đổi Date sang monthKey định dạng yyyyMM (ví dụ 202610)
 */
export function formatMonthKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}${mm}`;
}
