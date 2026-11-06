# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 2
## Header Bar, 12-Month Cashflow Selector & Skeleton View
### Phân Hệ: Expense Dashboard (`/expense`) — Checked Next.js
### Chuẩn Parity 1:1 với `ExpenseDashboardView.swift` & `ExpenseDashboardSkeletonView.swift`

> **Mục tiêu**: Tái hiện toàn bộ tầng điều hướng trên cùng, bộ điều khiển trực quan 12 tháng cả năm và giao diện khung xương Skeleton Shimmer:
> 1. **`ExpenseHeaderBar.tsx`**: Thanh Header phẳng trong suốt, nút Back tròn $44 \times 44\text{px}$ nền trắng, icon `ChevronLeft` màu đen, tiêu đề `"Chi tiêu"` tròn trịa đậm nét $22\text{px}$.
> 2. **`YearlyCashflowChart.tsx`**: Bộ điều khiển dòng tiền 12 tháng cả năm ($T1 \dots T12$). Thiết kế mini dual-bars: thanh Thu (Matcha Glow) & thanh Chi (Đen) căn đáy, nút chuyển năm `< Dòng tiền YYYY >`, legend trực quan, chạm tháng để chuyển đổi tức thời kèm haptic feedback.
> 3. **`ExpenseDashboardSkeleton.tsx`**: Tái hiện 100% bố cục `ExpenseDashboardSkeletonView.swift` (Hero card, Thẻ tiết kiệm, 3 Tabs filter, 5 dòng giao dịch), đảm bảo Zero Layout Shift khi dữ liệu chưa có trong cache.
> 4. **Kiểm thử tự động TDD**: Đảm bảo 100% Unit Tests vượt qua trước khi chuyển sang Phase 3.

---

### Bảng Đối Chiếu Thành Phần & CSS Tokens (iOS vs Next.js)

| Thành phần iOS (`ExpenseDashboardView.swift`) | Component Next.js (`checked-nextjs`) | CSS Classes & Đặc tả kỹ thuật |
| :--- | :--- | :--- |
| `headerBar` | `ExpenseHeaderBar.tsx` | Nút tròn `w-11 h-11 bg-surface rounded-full flex items-center justify-center text-black` |
| `yearlyCashflowSection` | `YearlyCashflowChart.tsx` | Card `p-4 bg-surface rounded-[20px]`, mini bars kép `w-1 rounded-[2px]` (Thu `bg-primary`, Chi `bg-black`), active `bg-secondary` |
| Bộ chuyển năm | Nút chuyển năm `< Dòng tiền 2026 >` | Nút tròn 28x28 `bg-graySubtle text-black`, text 15px font-bold |
| `ExpenseDashboardSkeletonView` | `ExpenseDashboardSkeleton.tsx` | 4 block skeleton: Hero 24pt, Savings 20pt, Filter tabs, 5 Cards giao dịch 18pt |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 2

```
src/
└── components/
    └── expense/
        ├── ExpenseHeaderBar.tsx                    # Header bar phẳng với nút back tròn 44x44
        ├── YearlyCashflowChart.tsx                 # Bộ chọn 12 tháng mini dual-bars
        ├── ExpenseDashboardSkeleton.tsx            # Skeleton zero layout shift
        └── __tests__/
            ├── expense-header-bar.test.tsx         # Unit tests cho HeaderBar
            ├── yearly-cashflow-chart.test.tsx      # Unit tests cho 12-month selector
            └── expense-dashboard-skeleton.test.tsx # Unit tests cho Skeleton view
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

#### 🔹 Task 1: Xây Dựng Component `ExpenseHeaderBar.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/ExpenseHeaderBar.tsx`
- **Mô tả chi tiết**:
  - Container: `w-full h-14 flex items-center px-4 z-20 select-none bg-transparent`.
  - Bên trái: Nút tròn Back $44 \times 44\text{px}$ nền trắng (`bg-surface`), không viền, không bóng (`border-0 shadow-none`), hiệu ứng scale khi bấm (`active:scale-95 transition-transform`).
  - Icon bên trong: `ChevronLeft` (Lucide) kích thước $20\text{px}$, stroke đậm, màu đen `#141613`.
  - Tiêu đề: `"Chi tiêu"` nằm cạnh nút Back, cỡ chữ $22\text{px}$, font bo tròn (`font-display font-bold text-text-primary`).
  - Props:
    - `onBack?: () => void`: Hàm xử lý khi bấm nút Back (nếu không truyền mặc định `router.back()` hoặc `router.push('/profile')`).
  - Haptics: Gọi `haptics.light()` khi bấm nút.
- **Kết quả nghiệm thu**: `ExpenseHeaderBar.tsx` (53 dòng, < 700 dòng), 4/4 unit tests trong `expense-header-bar.test.tsx` passed 100%. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Đáp ứng 100% chuẩn Flat Design System (Zero Border, Zero Blur, Zero Shadow).

---

#### 🔹 Task 2: Xây Dựng Component Bộ Chọn 12 Tháng `YearlyCashflowChart.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/YearlyCashflowChart.tsx`
- **Mô tả chi tiết**:
  - Container card phẳng: `p-4 bg-surface rounded-[20px] select-none text-text-primary`.
  - **Hàng điều khiển năm & Legend**:
    - Trái: Cụm chuyển năm:
      - Nút `<` tròn $28 \times 28\text{px}$ nền `bg-graySubtle` (`#F2F2F4`).
      - Nhãn: `Dòng tiền ${currentYear}` ($15\text{px}$ `font-bold font-display`).
      - Nút `>` tròn $28 \times 28\text{px}$ nền `bg-graySubtle`.
    - Phải: Legend giải thích:
      - Chấm tròn $8\text{px}$ xanh Matcha Glow (`bg-primary`) + chữ `"Thu"` ($11\text{px}$ `font-bold text-black`).
      - Chấm tròn $8\text{px}$ màu Đen (`bg-black`) + chữ `"Chi"` ($11\text{px}$ `font-bold text-black`).
  - **Lưới 12 tháng Mini Dual-bars ($T1 \dots T12$)**:
    - Layout: `flex items-end justify-between gap-1 pt-3`.
    - Tính toán tỷ lệ: `safeMax = max(max(income, expense), 1)`. Chiều cao thanh tối đa $44\text{px}$, tối thiểu $3\text{px}$.
    - Mỗi tháng gồm:
      - 2 cột đứng sát nhau ($2\text{px}$ spacing):
        - Cột Thu: `w-1 rounded-[2px] bg-primary`.
        - Cột Chi: `w-1 rounded-[2px] bg-black`.
      - Nhãn tháng: `T1` $\dots$ `T12` ($10\text{px}$ `font-display`).
      - Trạng thái Active (tháng đang chọn): Nền capsule `bg-secondary` (`#DFDACD`), chữ màu đen đậm `font-bold`.
      - Chạm vào từng cột gọi `onSelectMonth(point.monthKey)` kèm `haptics.selection()`.
  - Props:
    - `currentYear: number`
    - `currentMonthKey: string`
    - `yearlyPoints: MonthlyCashflowPoint[]`
    - `onSelectMonth: (monthKey: string) => void`
    - `onChangeYear: (offset: number) => void`
- **Kết quả nghiệm thu**: `YearlyCashflowChart.tsx` (150 dòng, < 700 dòng), 6/6 unit tests trong `yearly-cashflow-chart.test.tsx` passed 100%. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Chuẩn Tonal Layering không border/shadow/blur.

---

#### 🔹 Task 3: Xây Dựng Giao Diện Skeleton Shimmer `ExpenseDashboardSkeleton.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/ExpenseDashboardSkeleton.tsx`
- **Mô tả chi tiết**:
  - Mô phỏng 1:1 cấu trúc của `ExpenseDashboardSkeletonView.swift`:
    - Đệm trên $56\text{px}$ (dưới Header bar cố định).
    - **1. Hero Summary Skeleton**: Card $24\text{pt}$ bo góc (`rounded-[24px] bg-surface p-5`), skeleton tiêu đề $150 \times 12$, tổng tiền $220 \times 36$, thanh tiến độ $8\text{px}$, và 3 cột tài chính $50 \times 11$ & $80 \times 16$.
    - **2. Savings Goal Skeleton**: Card $20\text{pt}$ (`rounded-[20px] bg-surface p-4`), cờ tròn $15\text{px}$, nhãn $130 \times 15$, nút $50 \times 24$, thanh bar $6\text{px}$.
    - **3. Filter Tabs Skeleton**: 3 pills bo tròn $70 \times 32$, $85 \times 32$, $85 \times 32$ (`rounded-full`).
    - **4. Transactions List Skeleton**: 5 cards trắng phẳng `rounded-[20px] p-3.5 bg-surface`, circle thumbnail $44\text{px}$, 2 dòng text $130 \times 15$ & $80 \times 12$, số tiền $80 \times 16$.
- **Kết quả nghiệm thu**: `ExpenseDashboardSkeleton.tsx` (107 dòng, < 700 dòng), 2/2 unit tests trong `expense-dashboard-skeleton.test.tsx` passed 100%. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Hiệu ứng Shimmer `animate-pulse` mượt mà, Zero Layout Shift.

---

#### 🔹 Task 4: Bộ Unit Test Suite cho Phase 2 [x] (ĐÃ HOÀN THÀNH)
- **Files**:
  - `src/components/expense/__tests__/expense-header-bar.test.tsx` (4 tests)
  - `src/components/expense/__tests__/yearly-cashflow-chart.test.tsx` (6 tests)
  - `src/components/expense/__tests__/expense-dashboard-skeleton.test.tsx` (2 tests)
- **Mô tả chi tiết**:
  - `expense-header-bar.test.tsx`:
    - Render đúng tiêu đề "Chi tiêu" và nút Back tròn.
    - Click nút Back gọi `onBack` và trigger `haptics.light()`.
  - `yearly-cashflow-chart.test.tsx`:
    - Render đúng tiêu đề "Dòng tiền 2026", legend Thu / Chi.
    - Render đủ 12 cột tháng $T1 \dots T12$.
    - Highlight đúng tháng đang chọn `bg-secondary`.
    - Click chuyển năm gọi `onChangeYear(-1)` và `onChangeYear(1)`.
    - Click vào tháng bất kỳ gọi `onSelectMonth(monthKey)`.
  - `expense-dashboard-skeleton.test.tsx`:
    - Render đầy đủ cấu trúc 4 khối skeleton.
- **Kết quả nghiệm thu**: 12/12 unit tests của Phase 2 passed 100%. Toàn bộ dự án đạt 54/54 test files, 368/368 tests passed 100% không regression. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Hoàn thành 100% Phase 2!

---

### Quy Trình Thực Hiện Nghiêm Ngặt
- **Mỗi lượt chỉ làm ĐÚNG 1 task** theo yêu cầu của người dùng.
- **Tuân thủ TDD & Strict Constraints**: Zero Border, Zero Blur, Zero Shadow, File < 700 dòng.
