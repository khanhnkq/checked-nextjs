/**
 * Types & Data Contracts cho phân hệ Expense Dashboard (/expense)
 * Chuẩn Parity 1:1 với ExpenseDashboardViewModel.swift và checked-backend
 */

/**
 * Lựa chọn bộ lọc danh sách giao dịch
 */
export type TransactionFilterOption = 'ALL' | 'EXPENSE' | 'INCOME';

/**
 * Dữ liệu giao dịch chi tiêu hoặc thu nhập hiển thị trên giao diện
 */
export interface ExpenseTransaction {
  /** Định danh duy nhất (photoId hoặc transaction id) */
  id: string;
  /** Số tiền giao dịch (dương) */
  amount: number;
  /** Cờ đánh dấu là thu nhập (+ tiền) hay chi tiêu (- tiền) */
  isIncome: boolean;
  /** Ghi chú hoặc mô tả ngắn gọn */
  note?: string;
  /** Mã danh mục chi tiêu */
  categoryId?: string;
  /** Tên hiển thị của danh mục (Ăn uống, Cafe, Mua sắm, v.v.) */
  categoryName?: string;
  /** URL ảnh hóa đơn / khoảnh khắc gốc */
  imageUrl?: string;
  /** URL ảnh thumbnail thu nhỏ */
  thumbnailUrl?: string;
  /** Thời gian chụp ảnh */
  takenAt?: string;
  /** Thời gian tạo giao dịch (ISO string) */
  createdAt: string;
}

/**
 * Thống kê danh mục chi tiêu hàng đầu
 */
export interface TopCategorySpend {
  /** Mã danh mục */
  categoryId: string;
  /** Tên danh mục (ví dụ: Ăn uống, Cafe, Di chuyển) */
  categoryName: string;
  /** Tổng số tiền đã chi tiêu trong tháng */
  totalAmount: number;
  /** Tỷ lệ phần trăm trên tổng chi tiêu (0 - 100%) */
  percentage: number;
}

/**
 * Điểm dữ liệu dòng tiền từng tháng trên đồ thị năm (12 tháng: T1 - T12)
 */
export interface MonthlyCashflowPoint {
  /** Khóa tháng dạng chuỗi yyyyMM (ví dụ: "202610") */
  monthKey: string;
  /** Chỉ số tháng trong năm (1 - 12) */
  monthIndex: number;
  /** Tên viết tắt hiển thị trên trục hoành (ví dụ: "T1", "T10") */
  monthName: string;
  /** Tổng thu nhập trong tháng */
  income: number;
  /** Tổng chi tiêu trong tháng */
  expense: number;
  /** Dòng tiền ròng (Thu nhập - Chi tiêu) */
  net: number;
}

/**
 * Dữ liệu tổng hợp dòng tiền cả năm
 */
export interface YearlyCashflowData {
  /** Năm đang xem (ví dụ: 2026) */
  year: number;
  /** Tổng thu nhập cả năm */
  totalIncome: number;
  /** Tổng chi tiêu cả năm */
  totalExpense: number;
  /** Dòng tiền ròng cả năm */
  netCashflow: number;
  /** Danh sách 12 điểm tháng chuẩn từ T1 đến T12 */
  months: MonthlyCashflowPoint[];
}

/**
 * Trạng thái tổng hợp cho Hero Card và Mục tiêu tiết kiệm trên Dashboard Chi tiêu
 */
export interface ExpenseDashboardSummary {
  /** Khóa tháng đang xem (ví dụ: "202610") */
  monthKey: string;
  /** Tổng thu nhập trong tháng */
  totalIncome: number;
  /** Tổng chi tiêu trong tháng */
  totalExpense: number;
  /** Dòng tiền ròng trong tháng (totalIncome - totalExpense) */
  netCashflow: number;
  /** Hạn mức ngân sách tháng (null nếu chưa thiết lập) */
  budgetLimit: number | null;
  /** Tỷ lệ phần trăm ngân sách đã sử dụng (0 - 100+%) */
  budgetUsedPct: number;
  /** Số tiền còn lại trong ngân sách (âm nếu đã vượt) */
  budgetRemaining: number;
  /** Cờ báo hiệu đã vượt hạn mức ngân sách hay chưa */
  isBudgetExceeded: boolean;
  /** Ngưỡng cảnh báo chi tiêu (%) (mặc định 80%) */
  alertThresholdPct: number;
  /** Mục tiêu tiết kiệm trong tháng (null nếu chưa thiết lập) */
  savingsTarget: number | null;
  /** Số tiền đã tiết kiệm được hiện tại */
  currentSaved: number;
  /** Tiến độ tiết kiệm (%) (0 - 100+%) */
  savingsProgressPct: number;
}
