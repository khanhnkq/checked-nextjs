# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 5
## Interactive Setting Bottom Sheets (Màn Hình Profile)
### Dự án: Checked Next.js (`checked-nextjs`) — Chuẩn Parity 1:1 với `BudgetSettingSheet.swift` & `CalorieGoalSettingSheet.swift`

> **Mục tiêu**: Xây dựng 2 modal bottom sheet tương tác cho màn hình Profile:
> 1. **`BudgetSettingSheet.tsx`**: Cho phép người dùng thiết lập hạn mức chi tiêu tháng (`budgetLimit`), thanh trượt điều chỉnh ngưỡng cảnh báo (`alertPct` từ 50% đến 100%, bước nhảy 5%, mốc 80% khuyên dùng), và mục tiêu tiết kiệm tùy chọn (`savingsTarget`).
> 2. **`CalorieGoalSettingSheet.tsx`**: Cho phép người dùng tùy chỉnh mục tiêu năng lượng nạp hàng ngày (`targetCalories`), hỗ trợ 5 nút bấm chọn nhanh (Quick Presets: `1500`, `1800`, `2000`, `2200`, `2500` kcal) cùng ô nhập tự do.
>
> **Quy tắc thiết kế cốt lõi**:
> - **Zero Border, Zero Blur, Zero Shadow**: Tuyệt đối không dùng `border-*`, `blur-*`, `shadow-*`. Tái sử dụng [`BaseBottomSheet`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/sheets/BaseBottomSheet.tsx) và [`BottomSheetCard`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/sheets/BaseBottomSheet.tsx#L163) với nền Oat Milk `#EDE9DF`, thẻ trắng Surface `#FFFFFF` bo góc 22px, nút chính Matcha Glow `#D4EB70` cao 52px.
> - **Tonal Layering**: Nền modal Oat Milk, thẻ nội dung trắng phẳng, rãnh slider và các capsule preset chưa chọn mang màu xám nhẹ `bg-gray-subtle`.
> - **Phản Hồi Xúc Giác & Micro-Interactions**: Rung `haptics.light()` khi chọn preset / trượt slider, rung `haptics.medium()` khi bấm Lưu, hiển thị trạng thái `isSaving` ("Đang lưu...").

---

### Bảng Đối Chiếu Kiến Trúc Chi Tiết (iOS vs Next.js)

| Thành phần trên iOS (`BudgetSettingSheet.swift` & `CalorieGoalSettingSheet.swift`) | Component Next.js (`checked-nextjs`) | Chi tiết đặc tả & CSS tokens |
| :--- | :--- | :--- |
| `BaseBottomSheet` (detentHeight 490) | `BaseBottomSheet` | Modal trượt từ đáy, backdrop đen mờ 40% phẳng (Zero Blur), bo góc trên 32px |
| Section 1: Hạn mức chi tiêu | `BottomSheetCard(title: "HẠN MỨC CHI TIÊU THÁNG")` | Input text 28px font-bold font-display + ký hiệu `"₫"` 20px font-bold text-text-secondary |
| Section 2: Slider ngưỡng cảnh báo | `BottomSheetCard(title: "CẢNH BÁO KHI CHI TIÊU ĐẠT X%")` | `input[type="range"]` min 50 max 100 step 5 `accent-primary` + 3 nhãn `"50%"`, `"80% (Khuyên dùng)"`, `"100%"` |
| Section 3: Mục tiêu tiết kiệm | `BottomSheetCard(title: "MỤC TIÊU TIẾT KIỆM (TÙY CHỌN)")` | Input text 24px font-bold font-display + ký hiệu `"₫"` 18px font-bold text-text-secondary |
| Section 1 Calorie: Mục tiêu Kcal | `BottomSheetCard(title: "MỤC TIÊU NĂNG LƯỢNG (KCAL)")` | Input text 28px font-bold font-display + nhãn `"kcal / ngày"` 16px font-bold text-text-secondary |
| Section 2 Calorie: Quick Presets | `BottomSheetCard(title: "GỢI Ý PHỔ BIẾN")` | Dải capsule 5 nút: `1500`, `1800`, `2000`, `2200`, `2500`. Nút được chọn có nền `bg-primary text-black` |
| Nút hành động chính | Nút bấm Matcha Glow cao 52px | `h-[52px] bg-primary text-black font-bold rounded-full`, hiển thị `"Đang lưu..."` khi `isSaving = true` |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 5

```
src/
└── components/
    └── profile/
        ├── BudgetSettingSheet.tsx         # Modal Bottom Sheet thiết lập Ngân sách & Tiết kiệm
        ├── CalorieGoalSettingSheet.tsx    # Modal Bottom Sheet thiết lập Mục tiêu Calo & Presets
        ├── index.ts                       # Cập nhật re-export BudgetSettingSheet & CalorieGoalSettingSheet
        └── __tests__/
            ├── budget-setting-sheet.test.tsx      # Test suite cho BudgetSettingSheet
            └── calorie-goal-setting-sheet.test.tsx # Test suite cho CalorieGoalSettingSheet
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

- [x] **Task 1: Xây dựng Component `BudgetSettingSheet.tsx`** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/BudgetSettingSheet.tsx`
  - **Mô tả**:
    - Nhận props:
      ```typescript
      export interface BudgetSettingSheetProps {
        isOpen: boolean;
        onDismiss: () => void;
        monthTitle?: string;
        currentBudgetLimit?: number | null;
        currentAlertPct?: number;
        currentSavingsTarget?: number | null;
        onSave: (
          budgetLimit: number,
          alertPct: number,
          savingsTarget: number | null
        ) => Promise<boolean> | boolean;
        className?: string;
      }
      ```
    - State quản lý:
      - `budgetText`: Chuỗi nhập số hạn mức chi tiêu (tự động lọc chỉ giữ số nguyên dương).
      - `alertPct`: Giá trị phần trăm cảnh báo (50 - 100, bước 5, mặc định 80).
      - `goalText`: Chuỗi nhập mục tiêu tiết kiệm tùy chọn.
      - `isSaving`: Cờ trạng thái đang lưu dữ liệu bất đồng bộ.
    - Sử dụng [`BaseBottomSheet`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/sheets/BaseBottomSheet.tsx) với `title="Ngân sách & Tiết kiệm"`, icon `SlidersHorizontal`.
    - 3 thẻ [`BottomSheetCard`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/sheets/BaseBottomSheet.tsx#L163):
      1. `"HẠN MỨC CHI TIÊU THÁNG"`: Ô nhập số hạn mức lớn 28px + `"₫"`.
      2. `"CẢNH BÁO KHI CHI TIÊU ĐẠT {alertPct}%"`: Slider tùy chỉnh ngưỡng từ 50% đến 100% kèm 3 nhãn hướng dẫn.
      3. `"MỤC TIÊU TIẾT KIỆM (TÙY CHỌN)"`: Ô nhập mục tiêu tiết kiệm 24px + `"₫"`.
    - Xử lý submit: Validate hạn mức > 0, gọi `onSave`, kích hoạt `haptics.medium()` khi lưu thành công và tự động đóng sheet.
  - **Verifiable**: Kiểm tra render khi mở/đóng, validate nhập số, trượt slider cập nhật tiêu đề, gọi `onSave` và callback `onDismiss`. 7/7 unit tests passed.

- [x] **Task 2: Xây dựng Component `CalorieGoalSettingSheet.tsx`** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/CalorieGoalSettingSheet.tsx`
  - **Mô tả**:
    - Nhận props:
      ```typescript
      export interface CalorieGoalSettingSheetProps {
        isOpen: boolean;
        onDismiss: () => void;
        currentTarget?: number;
        onSave: (targetCalories: number) => Promise<boolean> | boolean;
        className?: string;
      }
      ```
    - State quản lý:
      - `targetInput`: Chuỗi nhập số calo mục tiêu (mặc định từ `currentTarget` hoặc `"2000"`).
      - `isSaving`: Cờ trạng thái đang lưu.
    - Sử dụng [`BaseBottomSheet`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/sheets/BaseBottomSheet.tsx) với `title="Mục tiêu năng lượng"`, icon `Flame`.
    - 2 thẻ [`BottomSheetCard`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/sheets/BaseBottomSheet.tsx#L163):
      1. `"MỤC TIÊU NĂNG LƯỢNG (KCAL)"`: Ô nhập số calo lớn 28px + `"kcal / ngày"`.
      2. `"GỢI Ý PHỔ BIẾN"`: Danh sách quick presets `[1500, 1800, 2000, 2200, 2500]` dạng capsule:
         - Nút đang chọn: `bg-primary text-black font-bold`.
         - Nút chưa chọn: `bg-gray-subtle text-text-secondary font-bold`.
         - Click preset: Gọi `haptics.light()` và gán giá trị vào `targetInput`.
    - Xử lý submit: Validate calo > 0, gọi `onSave`, rung `haptics.medium()` và đóng sheet khi thành công.
  - **Verifiable**: Kiểm tra render khi mở/đóng, chọn quick presets cập nhật input, validate nhập calo > 0, gọi `onSave` và `onDismiss`. 8/8 unit tests passed.

- [x] **Task 3: Cập nhật Barrel Export (`src/components/profile/index.ts`)** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/index.ts`
  - **Mô tả**: Re-export `BudgetSettingSheet` và `CalorieGoalSettingSheet` kèm các type props interfaces.
  - **Verifiable**: Cả 8 components của phân hệ Profile đều được export đầy đủ và đồng bộ. Test `index.test.ts` passed.

- [x] **Task 4: Xây dựng Bộ Unit Test Suites cho Phase 5** (ĐÃ HOÀN THÀNH)
  - **Files**:
    - `src/components/profile/__tests__/budget-setting-sheet.test.tsx` (11 tests passed)
    - `src/components/profile/__tests__/calorie-goal-setting-sheet.test.tsx` (12 tests passed)
  - **Mô tả**:
    - `budget-setting-sheet.test.tsx`:
      - Test không render khi `isOpen=false`, render đầy đủ khi `isOpen=true`.
      - Test điền giá trị khởi tạo `currentBudgetLimit`, `currentAlertPct`, `currentSavingsTarget`.
      - Test thay đổi slider cập nhật tiêu đề cảnh báo.
      - Test tự động lọc ký tự chữ và ký tự đặc biệt khi nhập số tiền.
      - Test không gọi `onSave` nếu để trống hoặc nhập số $\le 0$.
      - Test gọi `onSave` với các giá trị hợp lệ khi bấm "Lưu thiết lập".
      - Test không gọi `onDismiss` nếu `onSave` trả về `false`.
      - Test đóng sheet khi nhấn nút X, click backdrop, hoặc bấm phím Escape.
    - `calorie-goal-setting-sheet.test.tsx`:
      - Test không render khi `isOpen=false`, render đầy đủ khi `isOpen=true`.
      - Test hiển thị 5 nút quick presets và điền giá trị khởi tạo.
      - Test bấm vào một preset cập nhật giá trị trong ô input và đổi style nút được chọn.
      - Test tự động lọc ký tự chữ và ký tự đặc biệt trong ô nhập calo.
      - Test không gọi `onSave` nếu calo $\le 0$.
      - Test gọi `onSave` với số calo hợp lệ và lưu thành công.
      - Test không gọi `onDismiss` nếu `onSave` trả về `false`.
      - Test đóng sheet khi nhấn nút X, click backdrop, hoặc bấm phím Escape.
  - **Verifiable**: Toàn bộ 23/23 unit tests của Phase 5 pass 100%.

- [x] **Task 5: Kiểm tra Tổng thể Phase 5 (Verification Phase)** (ĐÃ HOÀN THÀNH)
  - **Lệnh thực thi**:
    ```bash
    npx vitest run src/components/profile # 9/9 test files, 66/66 tests passed
    npx tsc --noEmit                     # 0 errors
    npm test                             # 48/48 test files, 324/324 tests passed
    npm run build                        # 15/15 static pages compiled successfully
    ```
  - **Tiêu chuẩn hoàn thành**:
    - 100% tests của Phase 5 passed.
    - Toàn bộ test suites toàn dự án passed (không có regression).
    - TypeScript kiểm tra 0 lỗi biên dịch.
    - Build Next.js production thành công.
