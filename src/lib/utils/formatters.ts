/**
 * Định dạng tiền tệ VND chuẩn Việt Nam (e.g. 50.000 ₫)
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Định dạng thời gian tương đối chuẩn iOS Locket (Vừa xong, 5 phút trước, v.v.)
 */
export function formatTimeAgo(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Vừa xong';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Vừa xong';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Định dạng tên tháng chuẩn hiển thị tiếng Việt trên màn hình Profile
 * Chuẩn parity 1:1 với ProfileView.swift: "Tháng 10 2026"
 */
export function formatCurrentMonthVi(dateInput?: Date | string | null): string {
  const date = dateInput
    ? typeof dateInput === 'string'
      ? new Date(dateInput)
      : dateInput
    : new Date();
  const validDate = isNaN(date.getTime()) ? new Date() : date;
  const month = validDate.getMonth() + 1;
  const year = validDate.getFullYear();
  return `Tháng ${month} ${year}`;
}

/**
 * Tạo monthKey định dạng yyyyMM phục vụ các query endpoint backend
 * Ví dụ: "202610"
 */
export function formatMonthKey(dateInput?: Date | string | null): string {
  const date = dateInput
    ? typeof dateInput === 'string'
      ? new Date(dateInput)
      : dateInput
    : new Date();
  const validDate = isNaN(date.getTime()) ? new Date() : date;
  const year = validDate.getFullYear();
  const month = String(validDate.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

/**
 * Tạo dateKey định dạng yyyy-MM-dd phục vụ các query endpoint backend
 * Ví dụ: "2026-10-30"
 */
export function formatDateKey(dateInput?: Date | string | null): string {
  const date = dateInput
    ? typeof dateInput === 'string'
      ? new Date(dateInput)
      : dateInput
    : new Date();
  const validDate = isNaN(date.getTime()) ? new Date() : date;
  const year = validDate.getFullYear();
  const month = String(validDate.getMonth() + 1).padStart(2, '0');
  const day = String(validDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Lấy tổng số ngày trong tháng (hỗ trợ cả năm nhuận)
 * @param year Năm (ví dụ: 2026)
 * @param month1Based Tháng từ 1 đến 12 (ví dụ: 10 cho Tháng 10)
 */
export function getDaysInMonth(year: number, month1Based: number): number {
  return new Date(year, month1Based, 0).getDate();
}
