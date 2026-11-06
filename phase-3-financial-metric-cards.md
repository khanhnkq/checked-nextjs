# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 3
## Financial Metric Cards (Hero Summary & Savings Goal)
### Phân Hệ: Expense Dashboard (`/expense`) — Checked Next.js
### Chuẩn Parity 1:1 với `ExpenseDashboardView.swift` (Hero Summary & Savings Goal)

> **Mục tiêu**: Xây dựng 2 thẻ chỉ số tài chính trung tâm của trang Dashboard Chi tiêu đạt độ chuẩn xác 100% so với iOS:
> 1. **`ExpenseHeroSummaryCard.tsx`**:
>    - Tiêu đề tháng uppercase: `"TỔNG CHI TIÊU • THÁNG M, YYYY"`.
>    - Con số tổng chi tiêu lớn $34\text{px}$ (`Heavy Tabular Numbers`).
>    - Thanh tiến độ ngân sách $8\text{px}$ đổi màu Đỏ `#FF6954` khi vượt hạn mức, nhãn cảnh báo tam giác `"Vượt X%"`, hoặc `"Đã chi X% (Hạn mức)"`, hoặc `"Thiết lập ngân sách"`.
>    - 3 cột tài chính phẳng không divider: **Thu nhập** (`+X` xanh lá `#4E8752`), **Chi tiêu** (`-X` đen `#141613`), và **Thuần** (`+/-X`).
>    - Chạm vào tiến độ kích hoạt mở `BudgetSettingSheet`.
> 2. **`ExpenseSavingsGoalCard.tsx`**:
>    - Icon cờ `Flag` màu đen, tiêu đề `"Mục tiêu tiết kiệm"`.
>    - Nút bấm capsule bo tròn `"Sửa"` hoặc `"Đặt mục tiêu"`.
>    - Thanh tiến độ xanh Matcha Glow $6\text{px}$, hiển thị tỷ lệ đã đạt `current / target` và `%`.
> 3. **Kiểm thử tự động TDD**: Viết unit test suites bao phủ 100% các trạng thái (chưa đặt hạn mức, đã chi trong hạn mức, vượt hạn mức, đã hoàn thành mục tiêu tiết kiệm, v.v.).

---

### Bảng Đối Chiếu Thành Phần (iOS vs Next.js)

| Thành phần iOS (`ExpenseDashboardView.swift`) | Component Next.js (`checked-nextjs`) | Chi tiết đặc tả & CSS tokens |
| :--- | :--- | :--- |
| `heroSummaryCard` | `ExpenseHeroSummaryCard.tsx` | Card $24\text{pt}$ (`rounded-[24px] bg-surface p-5`), tổng tiền $34\text{px}$, progress $8\text{px}$, 3 cột tài chính |
| Thanh tiến độ ngân sách | Thanh bar ngân sách trong Hero card | `h-2 bg-graySubtle rounded-full`, bar trong `bg-primary` (hoặc `bg-error`), click mở sheet |
| 3 Cột: Thu nhập / Chi tiêu / Thuần | `summaryMetricColumn` $\times 3$ | Thu `text-success` (`#4E8752`), Chi `text-text-primary`, Thuần (xanh/đen hoặc `text-error`) |
| `savingsGoalCard` | `ExpenseSavingsGoalCard.tsx` | Card $20\text{pt}$ (`rounded-[20px] bg-surface p-4`), icon cờ `Flag`, bar $6\text{px}$, nút Sửa/Đặt |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 3

```
src/
└── components/
    └── expense/
        ├── ExpenseHeroSummaryCard.tsx               # Thẻ Hero tổng chi tiêu & tiến độ ngân sách
        ├── ExpenseSavingsGoalCard.tsx               # Thẻ mục tiêu tiết kiệm & tiến độ
        └── __tests__/
            ├── expense-hero-summary-card.test.tsx   # Unit tests cho HeroSummaryCard
            └── expense-savings-goal-card.test.tsx   # Unit tests cho SavingsGoalCard
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

#### 🔹 Task 1: Xây Dựng Thẻ Hero Tổng Chi Tiêu `ExpenseHeroSummaryCard.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/ExpenseHeroSummaryCard.tsx`
- **Mô tả chi tiết**:
  - Container: `w-full p-5 bg-surface rounded-[24px] select-none text-text-primary`.
  - Hàng 1: Tiêu đề tháng uppercase: `"TỔNG CHI TIÊU • ${monthTitle.toUpperCase()}"` (`text-[11px] font-bold font-display text-text-secondary tracking-[0.8px]`).
  - Hàng 2: Con số tổng chi tiêu lớn: `formatCurrency(summary.totalExpense)` (`text-[34px] font-black font-display text-text-primary tracking-tight leading-none pt-1`).
  - Hàng 3: Khối tiến độ Ngân sách (bọc trong thẻ button clickable):
    - Thanh bar: `h-2 w-full bg-graySubtle rounded-full overflow-hidden`.
    - Thanh fill con: chiều rộng `min(summary.budgetUsedPct, 100)%`, màu `bg-error` (`#FF6954`) nếu `summary.isBudgetExceeded`, màu `bg-primary` (`#D4EB70`) nếu bình thường.
    - Nhãn tiến độ bên dưới:
      - Khi có hạn mức:
        - Nếu vượt: Icon `AlertTriangle` màu đen $12\text{px}$ + chữ `"Vượt ${summary.budgetUsedPct}%"` (`text-error font-bold text-[12px] font-display`).
        - Nếu chưa vượt: Chữ `"Đã chi ${summary.budgetUsedPct}% (${formatShortCurrency(summary.budgetLimit)})"` (`text-text-secondary font-semibold text-[12px] font-display`).
      - Khi chưa có hạn mức: Chữ `"Thiết lập ngân sách"` (`text-text-primary font-bold text-[12px] font-display`).
    - Click gọi `onOpenBudgetSetting()` và `haptics.light()`.
  - Hàng 4: 3 Cột chỉ số tài chính căn đều:
    - Cột 1 (Thu nhập): Nhãn `"Thu nhập"`, giá trị `+${formatShortCurrency(summary.totalIncome)}` màu `text-success` (`#4E8752`).
    - Cột 2 (Chi tiêu): Nhãn `"Chi tiêu"`, giá trị `-${formatShortCurrency(summary.totalExpense)}` màu đen `text-text-primary`.
    - Cột 3 (Thuần): Nhãn `"Thuần"`, giá trị `${summary.netCashflow >= 0 ? '+' : ''}${formatShortCurrency(summary.netCashflow)}` màu `text-text-primary` nếu $\ge 0$, màu `text-error` nếu $< 0$.
  - Props:
    - `summary: ExpenseDashboardSummary`
    - `monthTitle: string`
    - `onOpenBudgetSetting?: () => void`
- **Kết quả nghiệm thu**: `ExpenseHeroSummaryCard.tsx` (146 dòng, < 700 dòng), 6/6 unit tests trong `expense-hero-summary-card.test.tsx` passed 100%. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Đáp ứng đầy đủ các kịch bản bình thường, cảnh báo đỏ khi vượt, và chưa cài đặt hạn mức.

---

#### 🔹 Task 2: Xây Dựng Thẻ Mục Tiêu Tiết Kiệm `ExpenseSavingsGoalCard.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/ExpenseSavingsGoalCard.tsx`
- **Mô tả chi tiết**:
  - Container: `w-full p-4 bg-surface rounded-[20px] select-none text-text-primary flex flex-col gap-3`.
  - Hàng trên:
    - Bên trái: Icon `Flag` (Lucide) $15\text{px}$ fill đen (`fill-current text-text-primary`) + tiêu đề `"Mục tiêu tiết kiệm"` ($15\text{px}$ `font-bold font-display text-text-primary`).
    - Bên phải: Nút Capsule bo tròn `px-3 py-1.5 bg-graySubtle rounded-full text-[12px] font-bold font-display text-text-primary active:scale-95 transition-transform`:
      - Nhãn: `hasTarget ? 'Sửa' : 'Đặt mục tiêu'`.
      - Bấm gọi `onOpenSavingsSetting()` kèm `haptics.light()`.
  - Khối nội dung tiến độ:
    - Khi có mục tiêu (`hasTarget = target > 0`):
      - Hàng text: `${formatShortCurrency(currentSaved)} / ${formatShortCurrency(target)}` ($13\text{px}$ `font-bold text-text-primary`) và `${pct}%` ($13\text{px}$ `font-bold`, màu `text-success` nếu $\ge 100\%$, ngược lại `text-text-primary`).
      - Thanh bar: `h-1.5 w-full bg-graySubtle rounded-full overflow-hidden`.
      - Thanh fill con: chiều rộng `min(max(pct, 0), 100)%`, màu `bg-primary` (`#D4EB70`), có `role="progressbar"`.
    - Khi chưa có mục tiêu:
      - Dòng text `"Chưa đặt mục tiêu"` ($13\text{px}$ `font-medium text-text-secondary font-display`).
  - Props:
    - `savingsTarget?: number | null`
    - `currentSaved?: number`
    - `savingsProgressPct?: number`
    - `onOpenSavingsSetting?: () => void`
- **Kết quả nghiệm thu**: `ExpenseSavingsGoalCard.tsx` (105 dòng, < 700 dòng), biên dịch TypeScript sạch sẽ (`npx tsc --noEmit` pass 100%), chuẩn bị sẵn sàng cho bộ unit test ở Task 3.

---

#### 🔹 Task 3: Bộ Unit Test Suite cho Phase 3 [x] (ĐÃ HOÀN THÀNH)
- **Files**:
  - `src/components/expense/__tests__/expense-hero-summary-card.test.tsx` (6 tests)
  - `src/components/expense/__tests__/expense-savings-goal-card.test.tsx` (6 tests)
- **Mô tả chi tiết**:
  - `expense-hero-summary-card.test.tsx`:
    - Render đúng tiêu đề tháng và tổng tiền đã chi.
    - Trạng thái chưa có hạn mức: hiển thị `"Thiết lập ngân sách"`.
    - Trạng thái đang trong hạn mức: hiển thị thanh progress xanh và nhãn `"Đã chi X% (Hạn mức)"`.
    - Trạng thái vượt hạn mức: hiển thị thanh đỏ, icon cảnh báo và nhãn `"Vượt X%"`.
    - Render đúng 3 cột tài chính Thu nhập, Chi tiêu, Thuần.
    - Click vào thanh ngân sách gọi `onOpenBudgetSetting` và `haptics.light()`.
  - `expense-savings-goal-card.test.tsx`:
    - Render tiêu đề "Mục tiêu tiết kiệm" và icon cờ `Flag`.
    - Trạng thái chưa đặt mục tiêu: hiển thị nhãn `"Chưa đặt mục tiêu"`, nút `"Đặt mục tiêu"`, không có thanh progress.
    - Trạng thái đã đặt mục tiêu: hiển thị `${formatShortCurrency(current)} / ${formatShortCurrency(target)}`, tiến độ %, thanh progress, nút `"Sửa"`.
    - Tự động tính % tiến độ khi không truyền `savingsProgressPct`.
    - Khi tiến độ $\ge 100\%$: hiển thị màu `text-success` và thanh progress clamped ở 100%.
    - Click nút gọi `onOpenSavingsSetting` và `haptics.light()`.
- **Kết quả nghiệm thu**: 12/12 unit tests của Phase 3 passed 100%. Toàn bộ test suite dự án đạt **56 test files, 380/380 tests passed (100%)**, 0 regression. TypeScript biên dịch hoàn toàn sạch sẽ (`npx tsc --noEmit` pass 100%). Hoàn thành 100% Phase 3!

---

### Quy Trình Thực Hiện Nghiêm Ngặt
- **Mỗi lượt chỉ làm ĐÚNG 1 task** theo yêu cầu của người dùng.
- **Tuân thủ TDD & Strict Constraints**: Zero Border, Zero Blur, Zero Shadow, File < 700 dòng.
