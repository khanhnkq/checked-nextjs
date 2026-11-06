# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 3
## Financial & Nutritional Intelligence Cards (Màn Hình Profile)
### Dự án: Checked Next.js (`checked-nextjs`) — Chuẩn Parity 1:1 với `ProfileView.swift`

> **Mục tiêu**: Xây dựng 2 thẻ thông tin cốt lõi hiển thị trên trang Profile: Thẻ **Ngân sách tháng (`BudgetSummaryCard`)** và Thẻ **Năng lượng hôm nay (`CalorieSummaryCard`)**. Cả hai thẻ đều sở hữu thanh tiến độ thông minh (tự động đổi màu Matcha Glow $\leftrightarrow$ Đỏ cảnh báo), tính toán tỷ lệ %, hiển thị số dư còn lại hoặc số tiền/calo bị vượt, cùng trạng thái Skeleton Bone khi đang tải dữ liệu ban đầu.
>
> **Quy tắc thiết kế cốt lõi**:
> - **Zero Border, Zero Blur, Zero Shadow**: Tuyệt đối không dùng `border-*`, `blur-*`, `shadow-*`. Thẻ có nền trắng phẳng `bg-surface`, bo góc `rounded-card` (24px), đệm bên trong 20px (`p-5`).
> - **Tonal Layering**: Nền thẻ màu trắng (`#FFFFFF`) nổi bật trên nền canvas Oat Milk (`#EDE9DF`), thanh tiến độ có rãnh màu xám siêu nhẹ `bg-gray-subtle` (`#F2F2F4`).
> - **Visual Semantic Feedback**: Màu xanh Matcha Glow (`#D4EB70`) biểu thị trong hạn mức / an toàn; Màu đỏ (`#FF5252`) biểu thị vượt hạn mức chi tiêu hoặc vượt calo mục tiêu; Màu xanh lá (`#27AE60`) biểu thị mức tiền/calo còn lại.

---

### Bảng Đối Chiếu Kiến Trúc Chi Tiết (iOS vs Next.js)

| Thành phần trên iOS (`ProfileView.swift`) | Component Next.js (`checked-nextjs`) | Chi tiết đặc tả & CSS tokens |
| :--- | :--- | :--- |
| `budgetCard` (Button style: `PressedScaleButtonStyle`) | `BudgetSummaryCard.tsx` | Khối thẻ `bg-surface rounded-card p-5 select-none active:scale-[0.98] transition-transform` |
| Header thẻ ví tiền | `iconLabel` (`creditcard.fill` + "Chi tiêu tháng này") | Icon `CreditCard` tròn 26x26 xám mờ 5% + chữ 14px medium + `ChevronRight` xám 14px |
| Dòng 2: Số tiền đã chi & hạn mức | Số tiền (28pt bold rounded) + `/ {limit}` (14pt medium) | `formatCurrency(totalSpent)` 28px font-bold font-display + `/ {limit}` (hoặc `"/ Chưa đặt hạn mức"`) |
| Dòng 3: Linear progress bar (Cao 8px) | Capsule Progress Bar 8px | Chiều rộng fill `% = min(100, percentUsed)`. Màu xanh `bg-primary`, đổi sang `bg-error` (`#FF5252`) nếu vượt hạn mức |
| Dòng 4: Tiến độ & Số dư | Trái: `Tiến độ: X%`<br/>Phải: `Còn lại: X₫` (xanh `#27AE60`) hoặc `Vượt: X₫` (đỏ `#FF5252`) | Nếu chưa đặt: hiển thị gợi ý *"Chạm để xem chi tiết & thiết lập hạn mức"* |
| Dòng 5: Cờ mục tiêu tiết kiệm | Icon `flag.fill` 12pt + "Mục tiêu tiết kiệm: X₫" | Icon `Flag` 12px + text 12px medium rounded (chỉ hiển thị khi `savingsTarget > 0`) |
| Dòng 6: Cảnh báo ngưỡng chi tiêu | Icon `exclamationmark.triangle.fill` + "Đã chạm ngưỡng cảnh báo 80%" | Icon `AlertTriangle` 12px + text đỏ 12px semibold (chỉ hiển thị khi `percentUsed >= alertPct` và chưa vượt) |
| Skeleton Loading State | `SkeletonBone` cho 4 dòng | Hiển thị các khối giả lập khi `isLoading === true` và `totalSpent === 0` |
| `calorieCard` (Button style: `PressedScaleButtonStyle`) | `CalorieSummaryCard.tsx` | Khối thẻ `bg-surface rounded-card p-5 select-none active:scale-[0.98] transition-transform` |
| Header thẻ năng lượng | `iconLabel` (`flame.fill` + "Năng lượng hôm nay") | Icon `Flame` tròn 26x26 xám mờ 5% + chữ 14px medium + `ChevronRight` 14px |
| Dòng 2: Kcal nạp & mục tiêu | `{todayCalories} kcal` (28pt bold) + `/ {targetCalories} kcal` | Typography 28px font-bold font-display + 14px medium text-secondary |
| Dòng 3: Linear progress bar (Cao 8px) | Capsule Progress Bar 8px | Chiều rộng fill `min(100, caloriePercentage)%`. Màu xanh `bg-primary`, đổi sang `bg-error` nếu vượt calo |
| Dòng 4: Tiến độ & Mức nạp | Trái: `Tiến độ: X%`<br/>Phải: `Vượt: X kcal` (đỏ) hoặc `Còn lại: X kcal` (xanh) | Text 12px semibold / bold rounded |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 3

```
src/
└── components/
    └── profile/
        ├── BudgetSummaryCard.tsx          # Thẻ Ngân Sách Tháng & Dòng Tiền (Done)
        ├── CalorieSummaryCard.tsx         # Thẻ Năng Lượng Calo Hôm Nay (Done)
        ├── index.ts                       # Barrel export 4 components (Done)
        └── __tests__/
            ├── budget-summary-card.test.tsx   # Test suite cho BudgetSummaryCard (8 tests passed)
            └── calorie-summary-card.test.tsx  # Test suite cho CalorieSummaryCard (6 tests passed)
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

- [x] **Task 1: Xây dựng Component `BudgetSummaryCard.tsx`** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/BudgetSummaryCard.tsx`
  - **Mô tả**:
    - Nhận props:
      ```typescript
      export interface BudgetSummaryCardProps {
        totalSpent: number;
        budgetLimit: number | null;
        percentUsed: number;
        remaining: number;
        isBudgetExceeded: boolean;
        alertPct?: number;
        savingsTarget?: number | null;
        isLoading?: boolean;
        onClick?: () => void;
        className?: string;
      }
      ```
    - Bố cục:
      - Khối thẻ: `bg-surface rounded-card p-5 select-none active:scale-[0.98] transition-transform duration-100 ease-out cursor-pointer`.
      - Header: Circle 26x26 fill `bg-text-primary/5` chứa icon `CreditCard` size 13 + nhãn `"Chi tiêu tháng này"` (14px medium text-secondary) + `ChevronRight` size 14 xám bên phải.
      - Trạng thái Loading: Nếu `isLoading && totalSpent === 0 && budgetLimit === null`, render các khung `SkeletonBone` cho dòng số tiền, thanh progress và footer.
      - Dòng 2: Hiển thị `{formatCurrency(totalSpent)}` (28px font-bold font-display text-text-primary) + `/ {formatCurrency(budgetLimit)}` (hoặc `"/ Chưa đặt hạn mức"` 14px medium text-secondary).
      - Dòng 3: Progress track `h-2 bg-gray-subtle rounded-full overflow-hidden`. Thanh fill `h-full rounded-full transition-all duration-300` với màu `isBudgetExceeded ? 'bg-error' : 'bg-primary'`.
      - Dòng 4:
        - Nếu có `budgetLimit > 0`: Bên trái `Tiến độ: X%` (12px semibold text-secondary); Bên phải `Còn lại: X₫` (màu `#27AE60`) hoặc `Vượt: X₫` (màu `#FF5252`).
        - Nếu chưa có: `"Chạm để xem chi tiết & thiết lập hạn mức"` (13px medium text-secondary).
      - Dòng 5 (Nếu có `savingsTarget > 0`): Icon cờ `Flag` 12px + `"Mục tiêu tiết kiệm: {formatCurrency(savingsTarget)}"`.
      - Dòng 6 (Nếu `percentUsed >= alertPct && !isBudgetExceeded`): Icon cảnh báo `AlertTriangle` 12px + `"Đã chạm ngưỡng cảnh báo {alertPct}%"` (màu đỏ).
    - Tương tác: Gọi `haptics.click()` và callback `onClick` khi bấm vào card.
  - **Verifiable**: Kiểm tra render đúng mọi trạng thái dữ liệu (đủ hạn mức, vượt hạn mức, chưa đặt hạn mức, cảnh báo ngưỡng, skeleton loading).

- [x] **Task 2: Xây dựng Component `CalorieSummaryCard.tsx`** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/CalorieSummaryCard.tsx`
  - **Mô tả**:
    - Nhận props:
      ```typescript
      export interface CalorieSummaryCardProps {
        todayCalories: number;
        targetCalories?: number;
        caloriePercentage: number;
        calorieExceeded: boolean;
        isLoading?: boolean;
        onClick?: () => void;
        className?: string;
      }
      ```
    - Bố cục:
      - Khối thẻ: `bg-surface rounded-card p-5 select-none active:scale-[0.98] transition-transform duration-100 ease-out cursor-pointer`.
      - Header: Circle 26x26 fill `bg-text-primary/5` chứa icon `Flame` size 13 + nhãn `"Năng lượng hôm nay"` (14px medium text-secondary) + `ChevronRight` 14px xám bên phải.
      - Trạng thái Loading: Nếu `isLoading && todayCalories === 0`, render các khung `SkeletonBone`.
      - Dòng 2: Hiển thị `{todayCalories} kcal` (28px font-bold font-display text-text-primary) + `/ {targetCalories} kcal` (14px medium text-secondary).
      - Dòng 3: Progress track `h-2 bg-gray-subtle rounded-full overflow-hidden`. Thanh fill `h-full rounded-full transition-all duration-300` với màu `calorieExceeded ? 'bg-error' : 'bg-primary'`.
      - Dòng 4:
        - Bên trái: `Tiến độ: {caloriePercentage}%` (12px semibold text-secondary).
        - Bên phải: Nếu `calorieExceeded` thì hiển thị `Vượt: {todayCalories - targetCalories} kcal` (màu đỏ `#FF5252`), ngược lại hiển thị `Còn lại: {targetCalories - todayCalories} kcal` (màu xanh `#27AE60`).
    - Tương tác: Gọi `haptics.click()` và callback `onClick` khi bấm vào card.
  - **Verifiable**: Kiểm tra render đúng mọi trạng thái calo (bình thường, vượt calo, skeleton loading, callback onClick).

- [x] **Task 3: Cập nhật Barrel Export (`src/components/profile/index.ts`)** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/index.ts`
  - **Mô tả**:
    - Re-export `BudgetSummaryCard` và `CalorieSummaryCard` kèm các type props.
  - **Verifiable**: Có thể import trực tiếp cả 4 components (`ProfileTopBar`, `ProfileHeader`, `BudgetSummaryCard`, `CalorieSummaryCard`) từ `@/components/profile`.

- [x] **Task 4: Xây dựng Bộ Unit Test Suites cho Phase 3** (ĐÃ HOÀN THÀNH)
  - **Files**:
    - `src/components/profile/__tests__/budget-summary-card.test.tsx` (8 tests)
    - `src/components/profile/__tests__/calorie-summary-card.test.tsx` (6 tests)
  - **Mô tả**:
    - `budget-summary-card.test.tsx`:
      - Kiểm tra render skeleton loading khi `isLoading=true` và chưa có dữ liệu.
      - Kiểm tra render số tiền đã chi và hạn mức tháng.
      - Kiểm tra đổi màu thanh progress sang đỏ và hiển thị chữ "Vượt" khi `isBudgetExceeded=true`.
      - Kiểm tra hiển thị cờ mục tiêu tiết kiệm khi có `savingsTarget`.
      - Kiểm tra hiển thị cảnh báo ngưỡng khi đạt $\ge 80\%$.
      - Kiểm tra hiển thị hướng dẫn khi chưa đặt hạn mức.
      - Kiểm tra gọi `onClick` và rung haptic khi bấm vào thẻ.
    - `calorie-summary-card.test.tsx`:
      - Kiểm tra render skeleton loading khi `isLoading=true`.
      - Kiểm tra render số calo nạp và mục tiêu.
      - Kiểm tra đổi màu thanh progress sang đỏ và hiển thị chữ "Vượt" khi `calorieExceeded=true`.
      - Kiểm tra hiển thị mức còn lại (màu xanh) khi chưa vượt.
      - Kiểm tra gọi `onClick` và rung haptic khi bấm vào thẻ.
  - **Verifiable**: Toàn bộ unit tests của Phase 3 pass 100%.

- [x] **Task 5: Kiểm tra Tổng thể Phase 3 (Verification Phase)** (ĐÃ HOÀN THÀNH)
  - **Lệnh thực thi**:
    ```bash
    npx vitest run src/components/profile # 27/27 tests passed
    npx tsc --noEmit                     # 0 errors
    npm test                             # 43/43 test files, 285/285 tests passed
    ```
  - **Tiêu chuẩn hoàn thành**:
    - 100% tests của Phase 3 passed.
    - Toàn bộ test suites của toàn dự án passed (không có regression).
    - TypeScript kiểm tra 0 lỗi biên dịch.

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria cho Phase 3)
1. Thẻ Ngân Sách và Thẻ Năng Lượng tuân thủ tuyệt đối quy tắc **Zero Border, Zero Blur, Zero Shadow**, nền phẳng `bg-surface`, góc bo chuẩn `rounded-card` (24px).
2. Thanh tiến độ Linear Progress bar 8px đổi màu động chính xác (`bg-primary` khi trong ngưỡng, `bg-error` khi vượt ngưỡng).
3. Đầy đủ các micro-state: Skeleton Loading chống CLS, cảnh báo ngưỡng 80%, cờ mục tiêu tiết kiệm, và hướng dẫn khi chưa thiết lập.
4. Tương tác mượt mà: Có hiệu ứng co nhún `active:scale-[0.98]` và phản hồi rung xúc giác `haptics.click()` khi người dùng chạm vào thẻ.
5. 100% Unit Tests passed và TypeScript biên dịch 0 lỗi.
