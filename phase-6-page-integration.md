# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 6
## Page Integration, Route Guards & Final Build (Màn Hình Profile)
### Dự án: Checked Next.js (`checked-nextjs`) — Chuẩn Parity 1:1 với `ProfileView.swift`

> **Mục tiêu**: Hoàn thiện trang Profile hoàn chỉnh tại đường dẫn [`/profile`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/app/profile/page.tsx):
> 1. **Route Guard & Session Hydration**: Bảo vệ route bằng [`useAuthStore`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/stores/auth-store.ts), tự động chuyển hướng sang `/login?redirect=/profile` nếu chưa xác thực, hiển thị trạng thái loading mượt mà trong khi chờ hydration.
> 2. **Ghép Nối Toàn Bộ 8 Components Cốt Lõi**:
>    - [`ProfileTopBar`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/profile/ProfileTopBar.tsx) (Badge Checked GOLD, nút Friends, Settings, Back).
>    - [`ProfileHeader`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/profile/ProfileHeader.tsx) (Avatar viền xanh Matcha Glow 2px, Display Name, Username).
>    - [`BudgetSummaryCard`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/profile/BudgetSummaryCard.tsx) (Thẻ chi tiêu tháng, thanh tiến độ 8px, cảnh báo 80%, cờ tiết kiệm).
>    - [`CalorieSummaryCard`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/profile/CalorieSummaryCard.tsx) (Thẻ năng lượng nạp, thanh tiến độ 8px đổi màu đỏ khi vượt).
>    - [`CalendarHistoryCard`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/profile/CalendarHistoryCard.tsx) (Lưới lịch 7 cột, ô vuông 1:1, dot badge số lượng post).
>    - [`ProfileStatsFooter`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/profile/ProfileStatsFooter.tsx) (Capsule pill `❤️ X Checked | 🔥 Yd chuỗi`).
>    - [`BudgetSettingSheet`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/profile/BudgetSettingSheet.tsx) (Modal thiết lập hạn mức & slider ngưỡng cảnh báo).
>    - [`CalorieGoalSettingSheet`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/components/profile/CalorieGoalSettingSheet.tsx) (Modal thiết lập mục tiêu calo & 5 nút presets).
> 3. **Kết Nối Two-Tier Data Engine ([`useProfileData`](file:///Users/nguyenkimquockhanh/Desktop/checked-nextjs/src/hooks/useProfileData.ts))**:
>    - Tầng 1 (Critical First-paint): Tóm tắt chi tiêu, calo và chuỗi ngày.
>    - Tầng 2 (Lịch sử chi tiết): Lưới lịch tháng và danh sách bài đăng.
>    - Mutations: Cập nhật hạn mức `updateBudget` và mục tiêu calo `updateCalorieTarget`.
> 4. **Kiểm Thử & Build Hoàn Chỉnh**: Viết bộ Integration Test Suite và xác nhận `npm run build` thành công 100%.

---

### Bảng Đối Chiếu Kiến Trúc Chi Tiết (iOS vs Next.js)

| Thành phần trên iOS (`ProfileView.swift`) | Component Next.js (`checked-nextjs`) | Chi tiết đặc tả & CSS tokens |
| :--- | :--- | :--- |
| Nền toàn màn hình (`AppColors.background`) | `main` | `min-h-screen bg-[#EDE9DF] text-text-primary` (Canvas Oat Milk) |
| Container căn giữa | Container mobile-first | `max-w-md mx-auto min-h-screen flex flex-col justify-between` |
| `topBar` | `ProfileTopBar` | Header 44px, nút back, badge Checked GOLD, nút Friends & Settings |
| `header` | `ProfileHeader` | Avatar 80x80 viền xanh 2px, ảnh 70x70, Display Name 24px, Username 16px |
| `budgetCard` | `BudgetSummaryCard` | Đệm `px-4 mb-4`, click mở `BudgetSettingSheet` |
| `calorieCard` | `CalorieSummaryCard` | Đệm `px-4 mb-6`, click mở `CalorieGoalSettingSheet` |
| `sectionTitle("Lịch sử")` | Tiêu đề Lịch sử | `<h2 className="text-[14px] font-medium text-text-secondary px-1 pb-2.5">Lịch sử</h2>` |
| `calendarCard` | `CalendarHistoryCard` | Đệm `px-4 mb-7`, click thẻ mở `/history`, click ngày xem chi tiết ngày |
| `statsFooter` | `ProfileStatsFooter` | Căn giữa đáy `flex justify-center pb-8 pt-2` |
| Modal `BudgetSettingSheet` | `BudgetSettingSheet` | Sheet trượt từ đáy, lưu hạn mức & ngưỡng cảnh báo |
| Modal `CalorieGoalSettingSheet` | `CalorieGoalSettingSheet` | Sheet trượt từ đáy, chọn preset & lưu mục tiêu calo |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 6

```
src/
└── app/
    └── profile/
        ├── page.tsx                           # Trang Profile Next.js (/profile)
        └── __tests__/
            └── profile-page.test.tsx          # Integration test suite cho trang Profile
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

- [x] **Task 1: Xây dựng Trang Profile Page (`src/app/profile/page.tsx`)** (ĐÃ HOÀN THÀNH)
  - **File**: `src/app/profile/page.tsx`
  - **Mô tả**:
    - Route component Client (`'use client'`).
    - Kiểm tra trạng thái xác thực từ `useAuthStore`:
      - Nếu `!isHydrated`: render skeleton loading toàn trang chống layout shift (CLS).
      - Nếu `isHydrated && !isAuthenticated`: gọi `router.replace('/login?redirect=/profile')`.
    - Kết nối hook `useProfileData`:
      - Nhận `summaryState`, `dayCalendarData`, `isLoadingSummary`, `isLoadingCalendar`, `monthTitle`, `updateBudget`, `updateCalorieTarget`.
    - Tính toán số ngày trong tháng từ `getDaysInMonth(currentYear, currentMonth)`.
    - Quản lý state đóng/mở 2 sheets:
      - `showBudgetSheet` (boolean, mở khi click `BudgetSummaryCard`).
      - `showCalorieSheet` (boolean, mở khi click `CalorieSummaryCard`).
    - Điều hướng:
      - Close / Back: `router.push('/')`.
      - Friends: `router.push('/friends')`.
      - Settings: `router.push('/settings')`.
      - History: `router.push('/history')`.
    - Đảm bảo tuân thủ 100% quy tắc Design System: **Zero Border, Zero Blur, Zero Shadow**, Canvas Oat Milk `#EDE9DF`, font hiển thị bo tròn `font-display`.
  - **Verifiable**: Kiểm tra render mượt mà, chuyển hướng đúng khi chưa đăng nhập, mở/đóng đúng modal sheets, gọi đúng các API update. TypeScript biên dịch 0 lỗi.

- [x] **Task 2: Xây dựng Bộ Integration Test Suite (`src/app/profile/__tests__/profile-page.test.tsx`)** (ĐÃ HOÀN THÀNH)
  - **File**: `src/app/profile/__tests__/profile-page.test.tsx`
  - **Mô tả**:
    - Mock Next.js router (`useRouter`, `usePathname`).
    - Mock `useAuthStore` với các kịch bản:
      1. Chưa đăng nhập (`isAuthenticated = false`): Kiểm tra redirect sang `/login?redirect=/profile`.
      2. Đang hydrate: Kiểm tra hiển thị skeleton.
      3. Đã đăng nhập (`user = { displayName: 'Quoc Khanh', username: 'khanhnkq' }`): Kiểm tra render đầy đủ tên người dùng, avatar, và toàn bộ 6 thẻ hiển thị.
    - Mock `useProfileData`:
      - Kiểm tra hiển thị đúng số tiền ngân sách, số calo, số ngày streak.
      - Test click `BudgetSummaryCard` -> Mở `BudgetSettingSheet` và gọi `updateBudget`.
      - Test click `CalorieSummaryCard` -> Mở `CalorieGoalSettingSheet` và gọi `updateCalorieTarget`.
      - Test click nút Back/Close -> Gọi `router.push('/')`.
      - Test click nút Friends -> Gọi `router.push('/friends')`.
      - Test click nút Settings -> Gọi `router.push('/settings')`.
      - Test click `CalendarHistoryCard` -> Gọi `router.push('/history')`.
  - **Verifiable**: 100% integration tests của trang Profile pass (7/7 tests passed). TypeScript 0 lỗi.

- [x] **Task 3: Kiểm tra Tổng thể Toàn Dự Án & Build Production Cuối Cùng (Final Verification Phase)** (ĐÃ HOÀN THÀNH)
  - **Lệnh thực thi**:
    ```bash
    npx vitest run src/app/profile
    npx tsc --noEmit
    npm test
    npm run build
    ```
  - **Kết quả nghiệm thu**:
    - `npx vitest run src/app/profile src/components/profile`: 73/73 tests passed (100%).
    - `npx tsc --noEmit`: 0 errors (100% type safety).
    - `npm test`: 49/49 test files passed, 331/331 unit & integration tests passed (100%).
    - `npm run build`: Build production thành công 100%, route `○ /profile` được generate tối ưu (9.22 kB / 146 kB First Load JS).
