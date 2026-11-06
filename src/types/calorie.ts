/**
 * Types & Data Contracts cho màn hình Calorie Dashboard (/calorie)
 * Chuẩn Parity 1:1 với CalorieModels.swift trên iOS và CalorieController.java trên Spring Boot
 */

/**
 * 4 Khung Bữa Ăn Trong Ngày
 */
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

/**
 * Bản ghi món ăn / bài đăng calo trong ngày
 */
export interface CalorieMealItem {
  id: string;
  photoId?: string | null;
  calories: number;
  mealType: MealType;
  dishName?: string | null;
  note?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  loggedAt: string | Date;
}

/**
 * Tổng quan Calo trong ngày (DailyCalorieSummaryDTO)
 */
export interface DailyCalorieSummary {
  dateString?: string;
  dailyTargetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  isExceeded: boolean;
  percentage: number;
  meals: CalorieMealItem[];
}

/**
 * Điểm dữ liệu calo của 1 ngày trong tháng (MonthlyCaloriePointDTO)
 */
export interface MonthlyCaloriePoint {
  day: number;
  calories: number;
}

/**
 * Báo cáo xu hướng Calo theo tháng (MonthlyCalorieSummaryDTO)
 */
export interface MonthlyCalorieSummary {
  monthKey: string;
  dailyTargetCalories: number;
  averageDailyCalories: number;
  daysOnTrack: number;
  days: MonthlyCaloriePoint[];
}

/**
 * DTO yêu cầu ghi nhận calo thủ công (CreateCalorieLogRequestDTO)
 */
export interface CreateCalorieLogRequest {
  calories: number;
  mealType: MealType;
  dishName?: string;
  note?: string;
}

/**
 * DTO yêu cầu cập nhật mục tiêu calo (CalorieGoalRequestDTO)
 */
export interface CalorieGoalRequest {
  dailyTargetCalories: number;
}

/**
 * DTO phản hồi mục tiêu calo (CalorieGoalResponseDTO)
 */
export interface CalorieGoalResponse {
  dailyTargetCalories: number;
}

/**
 * Metadata thông tin hiển thị của từng bữa ăn
 */
export interface MealTypeMeta {
  type: MealType;
  displayName: string;
  timeRangeDescription: string;
  iconName: string;
}
