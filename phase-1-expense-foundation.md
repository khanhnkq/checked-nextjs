# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 1
## Foundation, Types, Formatters & Data Hook (`useExpenseDashboard`)
### Phân Hệ: Expense Dashboard (`/expense`) — Checked Next.js
### Chuẩn Parity 1:1 với `ExpenseDashboardViewModel.swift` & `checked-backend`

> **Mục tiêu**: Xây dựng tầng nền tảng vững chắc cho Bảng điều khiển Chi tiêu & Quản lý Tài chính:
> 1. **Data Contracts & Types**: Định nghĩa toàn bộ interfaces chuẩn cho Dòng tiền, Hạn mức, Mục tiêu tiết kiệm, Top danh mục, Điểm đồ thị 12 tháng và Giao dịch chi tiêu.
> 2. **Formatters & Utility Engine**: Triển khai các hàm tính toán, định dạng tiền tệ đầy đủ & rút gọn (`560k`, `1.2tr`), định dạng ngày giờ thông minh (`"Hôm nay, 14:30"`, `"Hôm qua, 09:15"`), ánh xạ icon danh mục (Lucide Icons filled) và thuật toán chuẩn hóa 12 cột tháng cho biểu đồ cả năm ($T1 \dots T12$).
> 3. **Data Hook `useExpenseDashboard.ts`**: Hook điều phối dữ liệu tích hợp TanStack Query (Stale-While-Revalidate), hỗ trợ chuyển tháng tức thì, chuyển năm, bộ lọc `[Tất cả | Chi tiêu | Thu nhập]`, phân trang vô tận (infinite scrolling), và các hàm mutations cập nhật ngân sách / mục tiêu tiết kiệm.
> 4. **Kiểm thử tự động TDD**: Đảm bảo 100% Unit Tests vượt qua trước khi chuyển sang Phase 2.

---

### Bảng Đối Chiếu Kiến Trúc Logic (iOS vs Next.js)

| Logic trên iOS (`ExpenseDashboardViewModel.swift`) | Triển khai trên Next.js (`checked-nextjs`) | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| `currentMonthKey` & `availableMonths` | State `currentMonthKey` & `availableMonths` | Format `yyyyMM` (ví dụ: `"202610"`), đồng bộ query backend |
| `yearlyMonthPoints: [MonthlyCashflowPoint]` | `generate12MonthsCashflowPoints(year, items)` | Luôn tạo đủ 12 cột $T1 \dots T12$ cho năm được chọn |
| `formatCurrency(Double)` | `formatCurrency(number)` | Định dạng chuẩn tiền tệ: `"1.250.000 đ"` |
| `formatShortCurrency(Double)` | `formatShortCurrency(number)` | Rút gọn: `560k`, `1.2tr`, `1.5 tỷ` |
| `formatMonthTitle(String)` | `formatMonthTitle(monthKey)` | Tiêu đề tháng: `"Tháng 10, 2026"` |
| `formatTransactionDate(Date)` | `formatTransactionDate(dateInput)` | `"Hôm nay, 14:30"`, `"Hôm qua, 09:15"`, `"25/10, 18:00"` |
| `categoryIconName(String)` | `getCategoryIconName(categoryName)` | Ánh xạ danh mục sang Lucide Icon tương ứng |
| `loadMonthData()` & `loadYearlyData()` | `useExpenseDashboard` | Kết nối TanStack Query endpoints song song |
| `selectFilter(TransactionFilterOption)` | `selectedFilter` & query params | Lọc danh sách: `ALL`, `EXPENSE`, `INCOME` |
| `loadMoreTransactions()` | `fetchNextPage()` / `loadMoreTransactions()` | Phân trang vô tận 20 items / trang |
| `saveBudget` & `saveSavingsGoal` | `updateBudget` & `updateSavingsGoal` | TanStack Query mutations kèm query invalidation |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 1

```
src/
├── types/
│   ├── expense.ts                                      # Interfaces & DTOs chuẩn cho phân hệ Expense
│   └── index.ts                                        # Re-export expense types
├── lib/
│   └── utils/
│       ├── expense-formatters.ts                       # Helpers format tiền, ngày tháng, map icon & 12 tháng
│       └── __tests__/
│           └── expense-formatters.test.ts              # Unit test suite cho formatters
└── hooks/
    ├── useExpenseDashboard.ts                          # Hook điều phối dữ liệu & state management
    └── __tests__/
        └── useExpenseDashboard.test.ts                 # Unit test suite cho hook useExpenseDashboard
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

#### 🔹 Task 1: Định Nghĩa Types & DTOs cho Phân Hệ Expense [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/types/expense.ts` và cập nhật `src/types/index.ts`
- **Mô tả chi tiết**:
  - `ExpenseTransaction`:
    - `id: string`
    - `amount: number`
    - `isIncome: boolean`
    - `note?: string`
    - `categoryId?: string`
    - `categoryName?: string`
    - `imageUrl?: string`
    - `thumbnailUrl?: string`
    - `takenAt?: string`
    - `createdAt: string`
  - `TransactionFilterOption`: Enum hoặc type `'ALL' | 'EXPENSE' | 'INCOME'`.
  - `TopCategorySpend`:
    - `categoryId: string`
    - `categoryName: string`
    - `totalAmount: number`
    - `percentage: number`
  - `MonthlyCashflowPoint`:
    - `monthKey: string` (e.g. `"202610"`)
    - `monthIndex: number` (1 đến 12)
    - `monthName: string` (e.g. `"T1"`, `"T10"`)
    - `income: number`
    - `expense: number`
    - `net: number`
  - `ExpenseDashboardSummary`:
    - `monthKey: string`
    - `totalIncome: number`
    - `totalExpense: number`
    - `netCashflow: number`
    - `budgetLimit: number | null`
    - `budgetUsedPct: number`
    - `budgetRemaining: number`
    - `isBudgetExceeded: boolean`
    - `savingsTarget: number | null`
    - `currentSaved: number`
    - `savingsProgressPct: number`
- **Kết quả nghiệm thu**: `src/types/expense.ts` được tạo đầy đủ types chuẩn, export đồng bộ qua `src/types/index.ts`. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`).

---

#### 🔹 Task 2: Xây Dựng Formatters & Category Icon Mappers [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/lib/utils/expense-formatters.ts`
- **Mô tả chi tiết**:
  - `formatCurrency(amount: number): string`: Định dạng chuẩn VNĐ phân cách dấu chấm: `"1.250.000 đ"`.
  - `formatShortCurrency(amount: number): string`: Rút gọn:
    - $\ge 1.000.000.000$: `"X.X tỷ"`
    - $\ge 1.000.000$: `"X.Xtr"` hoặc `"Xtr"` (khử `.0`)
    - $\ge 1.000$: `"Xk"`
    - $< 1.000$: `"Xđ"`
  - `formatMonthTitle(monthKey: string): string`: `"202610"` $\rightarrow$ `"Tháng 10, 2026"`.
  - `formatMonthCapsule(monthKey: string): string`: `"202610"` $\rightarrow$ `"Tháng 10"`.
  - `formatTransactionDate(dateInput: string | Date): string`:
    - Nếu là hôm nay: `"Hôm nay, HH:mm"`.
    - Nếu là hôm qua: `"Hôm qua, HH:mm"`.
    - Khác: `"dd/MM, HH:mm"`.
  - `getCategoryIconName(categoryName?: string): string`:
    - Ăn uống, phở, cơm, food $\rightarrow$ `"Utensils"`
    - Cafe, cà phê, uống, trà $\rightarrow$ `"Coffee"`
    - Mua sắm, shop, chợ $\rightarrow$ `"ShoppingBag"`
    - Xe, xăng, grab, di chuyển $\rightarrow$ `"Car"`
    - Lương, thưởng, tiền $\rightarrow$ `"Banknote"`
    - Mặc định khác $\rightarrow$ `"CreditCard"`
  - `generateAvailableMonths(currentMonthKey: string): string[]`: Trả về 7 tháng (5 tháng trước + tháng hiện tại + 1 tháng sau).
  - `generate12MonthsCashflowPoints(year: number, backendMonths?: MonthlyCashflowItemResponse[]): MonthlyCashflowPoint[]`: Lấp đầy 12 tháng từ 1 đến 12 để biểu đồ năm luôn hiển thị trọn vẹn 12 cột $T1 \dots T12$.
- **Kết quả nghiệm thu**: File `src/lib/utils/expense-formatters.ts` (209 dòng, < 700 dòng), 16/16 unit tests trong `expense-formatters.test.ts` passed 100%. Toàn bộ dự án đạt 347/347 tests passed.

---

#### 🔹 Task 3: Xây Dựng Data Hook `useExpenseDashboard.ts` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/hooks/useExpenseDashboard.ts`
- **Mô tả chi tiết**:
  - Nhận tham số tùy chọn: `{ initialMonthKey?: string }`.
  - Mặc định `currentMonthKey` là tháng hiện tại định dạng `yyyyMM` (ví dụ: `"202610"`).
  - Tích hợp TanStack Query với Stale-While-Revalidate:
    - `useGetCashflowSummary({ monthKey: currentMonthKey })`
    - `useGetBudget(currentMonthKey)`
    - `useGetSavingsGoal(currentMonthKey)`
    - `useGetTopCategories({ monthKey: currentMonthKey, type: 'EXPENSE', limit: 6 })`
    - `useGetYearlyCashflowSummary({ year: currentYear })`
    - `useGetExpenseEntries({ monthKey: currentMonthKey, type: filterParam, page, size: 20 })`
  - Quản lý state phân trang giao dịch:
    - `transactions: ExpenseTransaction[]`
    - `currentPage: number`
    - `hasMorePages: boolean`
    - `isLoadingMore: boolean`
    - `loadMoreTransactions(): Promise<void>`
  - Quản lý tương tác:
    - `selectMonth(monthKey: string)`: Chuyển tháng và nạp dữ liệu tháng mới.
    - `changeYear(offset: number)`: Chuyển năm (+1 hoặc -1).
    - `selectFilter(filter: TransactionFilterOption)`: Lọc theo Tất cả / Chi tiêu / Thu nhập.
    - `isBudgetSheetOpen`: boolean state mở sheet thiết lập ngân sách/tiết kiệm.
    - `previewImageUrl`: string | null state mở popup xem ảnh hóa đơn.
    - `refresh()`: Làm mới toàn bộ queries của tháng và năm hiện tại.
  - Mutations:
    - `saveBudget(limit: number, alertPct: number): Promise<boolean>`: Gọi mutation updateBudget và tự động làm mới `cashflowSummary` + `budget`.
    - `saveSavingsGoal(targetAmount: number): Promise<boolean>`: Gọi mutation updateSavingsGoal và tự động làm mới `savingsGoal`.
- **Kết quả nghiệm thu**: File `src/hooks/useExpenseDashboard.ts` (434 dòng, < 700 dòng), biên dịch TypeScript 0 lỗi (`npx tsc --noEmit`). Đáp ứng 100% hợp đồng dữ liệu của iOS ViewModel.

---

#### 🔹 Task 4: Unit Test Suite cho Phase 1 [x] (ĐÃ HOÀN THÀNH)
- **Files**:
  - `src/lib/utils/__tests__/expense-formatters.test.ts` (16 tests)
  - `src/hooks/__tests__/useExpenseDashboard.test.tsx` (9 tests)
- **Mô tả chi tiết**:
  - Test suite `expense-formatters.test.ts`:
    - Format tiền tệ chuẩn `1.250.000 đ`, số âm `-500.000 đ`, số 0.
    - Format rút gọn: `500đ`, `50k`, `1.5tr`, `2 tỷ`.
    - Format tiêu đề tháng và capsule.
    - Format ngày giao dịch (hôm nay, hôm qua, ngày thường).
    - Ánh xạ icon danh mục chính xác.
    - Thuật toán tạo 12 điểm tháng luôn đủ 12 phần tử có đúng `monthIndex` 1..12.
  - Test suite `useExpenseDashboard.test.tsx`:
    - Khởi tạo với tháng mặc định hoặc custom monthKey.
    - Chuyển tháng `selectMonth` cập nhật query state.
    - Chuyển năm `changeYear` cập nhật đúng year và tháng tương ứng.
    - Chuyển bộ lọc `selectFilter` reset page và gọi entries theo filter.
    - Load more pagination append transactions thành công.
    - Quản lý mở/đóng sheet ngân sách và preview ảnh hóa đơn.
    - Gọi `saveBudget` và `saveSavingsGoal` thành công.
    - Làm mới toàn diện `refresh()`.
- **Kết quả nghiệm thu**: 25/25 unit tests của Phase 1 passed 100%. Toàn bộ dự án đạt 51/51 test files, 356/356 tests passed 100% không regression. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Hoàn thành 100% Phase 1!

---

### Quy Trình Thực Hiện Nghiêm Ngặt
- **Mỗi lượt chỉ làm ĐÚNG 1 task** theo yêu cầu của người dùng.
- **Tuân thủ TDD**: Viết test và kiểm tra xanh trước khi báo cáo hoàn tất task.
