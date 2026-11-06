/**
 * Formatters và Helpers cho phân hệ Expense Dashboard (/expense)
 * Chuẩn Parity 1:1 với ExpenseDashboardViewModel.swift (iOS)
 */

import type { MonthlyCashflowPoint } from '@/types/expense';
import type { MonthlyCashflowItemResponse } from '@/types/api.generated.ts/monthlyCashflowItemResponse';

/**
 * Định dạng số tiền VNĐ đầy đủ: "1.250.000 đ"
 * Phân cách hàng nghìn bằng dấu chấm ".", thêm hậu tố " đ"
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '0 đ';
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}${formatted} đ`;
}

/**
 * Định dạng số tiền VNĐ rút gọn: "560k", "1.2tr", "1.5 tỷ"
 * Tự động loại bỏ phần thập phân ".0" (ví dụ: "1.0tr" -> "1tr")
 */
export function formatShortCurrency(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0đ';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const sign = isNegative ? '-' : '';

  if (absAmount >= 1_000_000_000) {
    const val = absAmount / 1_000_000_000;
    const formatted = val.toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted} tỷ`;
  } else if (absAmount >= 1_000_000) {
    const val = absAmount / 1_000_000;
    const formatted = val.toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}tr`;
  } else if (absAmount >= 1_000) {
    const val = Math.round(absAmount / 1_000);
    return `${sign}${val}k`;
  } else {
    return `${sign}${Math.round(absAmount)}đ`;
  }
}

/**
 * Chuẩn hóa monthKey về dạng 6 ký tự "yyyyMM"
 * Hỗ trợ cả "202610" và "2026-10"
 */
export function normalizeMonthKey(monthKey: string): { year: number; month: number; normalizedKey: string } | null {
  if (!monthKey) return null;
  const cleaned = monthKey.replace(/-/g, '').trim();
  if (cleaned.length !== 6) return null;

  const year = parseInt(cleaned.substring(0, 4), 10);
  const month = parseInt(cleaned.substring(4, 6), 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return null;
  }

  const normalizedKey = `${year}${month.toString().padStart(2, '0')}`;
  return { year, month, normalizedKey };
}

/**
 * Định dạng tiêu đề tháng: "Tháng 10, 2026"
 */
export function formatMonthTitle(monthKey: string): string {
  const parsed = normalizeMonthKey(monthKey);
  if (!parsed) return monthKey;
  return `Tháng ${parsed.month}, ${parsed.year}`;
}

/**
 * Định dạng nhãn capsule tháng: "Tháng 10"
 */
export function formatMonthCapsule(monthKey: string): string {
  const parsed = normalizeMonthKey(monthKey);
  if (!parsed) return monthKey;
  return `Tháng ${parsed.month}`;
}

/**
 * Định dạng ngày giờ giao dịch theo chuẩn iOS:
 * - Trong ngày hôm nay: "Hôm nay, HH:mm"
 * - Ngày hôm qua: "Hôm qua, HH:mm"
 * - Ngày khác: "dd/MM, HH:mm"
 */
export function formatTransactionDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (isToday) {
    return `Hôm nay, ${timeStr}`;
  }
  if (isYesterday) {
    return `Hôm qua, ${timeStr}`;
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}, ${timeStr}`;
}

/**
 * Ánh xạ tên danh mục tiếng Việt sang tên Lucide Icon tương ứng
 * Chuẩn parity với categoryIconName() trên iOS
 */
export function getCategoryIconName(categoryName?: string | null): string {
  if (!categoryName) return 'CreditCard';
  const name = categoryName.toLowerCase().trim();

  if (name.includes('ăn') || name.includes('food') || name.includes('phở') || name.includes('cơm')) {
    return 'Utensils';
  } else if (
    name.includes('cafe') ||
    name.includes('coffee') ||
    name.includes('cà phê') ||
    name.includes('uống') ||
    name.includes('trà')
  ) {
    return 'Coffee';
  } else if (name.includes('mua') || name.includes('shop') || name.includes('chợ') || name.includes('siêu thị')) {
    return 'ShoppingBag';
  } else if (name.includes('xe') || name.includes('xăng') || name.includes('grab') || name.includes('di chuyển')) {
    return 'Car';
  } else if (name.includes('lương') || name.includes('thưởng') || name.includes('tiền') || name.includes('thu nhập')) {
    return 'Banknote';
  } else {
    return 'CreditCard';
  }
}

/**
 * Tạo danh sách các tháng lân cận (5 tháng trước + hiện tại + 1 tháng sau = 7 tháng)
 */
export function generateAvailableMonths(currentMonthKey: string): string[] {
  const parsed = normalizeMonthKey(currentMonthKey);
  const baseDate = parsed ? new Date(parsed.year, parsed.month - 1, 1) : new Date();

  const results: string[] = [];
  for (let offset = -5; offset <= 1; offset++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    results.push(`${y}${m}`);
  }
  return results;
}

/**
 * Tạo danh sách 12 điểm tháng chuẩn từ T1 đến T12 cho biểu đồ cả năm
 * Ghép nối dữ liệu thực tế từ backend (nếu có), mặc định 0 nếu tháng chưa có dữ liệu
 */
export function generate12MonthsCashflowPoints(
  year: number,
  backendMonths?: MonthlyCashflowItemResponse[]
): MonthlyCashflowPoint[] {
  const map = new Map<string, MonthlyCashflowItemResponse>();

  if (backendMonths && Array.isArray(backendMonths)) {
    for (const item of backendMonths) {
      if (item.monthKey) {
        const cleaned = item.monthKey.replace(/-/g, '');
        map.set(cleaned, item);
      }
    }
  }

  const points: MonthlyCashflowPoint[] = [];

  for (let m = 1; m <= 12; m++) {
    const monthStr = m.toString().padStart(2, '0');
    const monthKey = `${year}${monthStr}`;
    const found = map.get(monthKey);

    points.push({
      monthKey,
      monthIndex: m,
      monthName: `T${m}`,
      income: found?.income ?? 0,
      expense: found?.expense ?? 0,
      net: found?.net ?? (found?.income ?? 0) - (found?.expense ?? 0),
    });
  }

  return points;
}
