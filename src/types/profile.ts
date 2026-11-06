/**
 * Types & Data Contracts cho màn hình Profile và phân hệ Calorie
 * Chuẩn parity 1:1 với ProfileView.swift và checked-backend
 */

/**
 * Dữ liệu cho từng ô ngày trên lưới lịch 7 cột tháng
 */
export interface DayCalendarData {
  /** Đường dẫn ảnh của bài post mới nhất trong ngày */
  latestImageUrl: string;
  /** Thời gian đăng bài post mới nhất */
  latestDate: Date;
  /** Tổng số bài post / giao dịch chi tiêu trong ngày */
  postCount: number;
}

/**
 * Trạng thái tổng hợp cho màn hình Profile (Chi tiêu, Calo & Chuỗi ngày)
 */
export interface ProfileSummaryState {
  /** Tổng số tiền đã chi tiêu trong tháng */
  totalSpent: number;
  /** Hạn mức chi tiêu tháng (null nếu chưa thiết lập) */
  budgetLimit: number | null;
  /** Ngưỡng phần trăm cảnh báo chi tiêu (mặc định 80%) */
  alertPct: number;
  /** Mục tiêu tiết kiệm trong tháng (null nếu chưa thiết lập) */
  savingsTarget: number | null;
  /** Tỷ lệ phần trăm ngân sách đã sử dụng (0 - 100+%) */
  percentUsed: number;
  /** Số tiền còn lại trong hạn mức (âm nếu vượt) */
  remaining: number;
  /** Cờ báo hiệu đã vượt hạn mức ngân sách hay chưa */
  isBudgetExceeded: boolean;

  /** Số calo đã nạp hôm nay */
  todayCalories: number;
  /** Mục tiêu calo mỗi ngày (mặc định 2000 kcal) */
  targetCalories: number;
  /** Cờ báo hiệu calo nạp đã vượt mục tiêu hay chưa */
  calorieExceeded: boolean;
  /** Tỷ lệ phần trăm calo đã nạp so với mục tiêu */
  caloriePercentage: number;

  /** Tổng số bài post Checked của người dùng */
  checkedCount: number;
  /** Chuỗi ngày check-in liên tiếp (Streak) */
  streakDays: number;
}


/**
 * Đơn vị bài post hợp nhất trước khi gom nhóm lịch
 */
export interface UnifiedPostItem {
  id: string;
  date: Date;
  imageUrl: string;
}
