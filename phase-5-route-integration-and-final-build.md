# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 5
## Route Integration (`/expense`), Budget Sheet, Profile Linkage & Final Production Build
### Phân Hệ: Expense Dashboard (`/expense`) — Checked Next.js
### Chuẩn Parity 1:1 với `ExpenseDashboardView.swift` & `ProfileView.swift`

> **Mục tiêu**: Hoàn thiện tích hợp toàn diện phân hệ Quản lý Chi tiêu (`/expense`):
> 1. **Barrel Export (`src/components/expense/index.ts`)**: Xuất khẩu gọn gàng toàn bộ 9 components Expense đã xây dựng từ Phase 2 đến Phase 4.
> 2. **Trang Chính Dashboard Chi Tiêu (`src/app/expense/page.tsx`)**:
>    - Xác thực Route Guard với `useAuthStore` (tự động chuyển hướng `/login?redirect=/expense` nếu chưa đăng nhập).
>    - Tích hợp hook dữ liệu `useExpenseDashboard` (two-tier queries, filter tabs, pagination, mutation).
>    - Ghép nối 1:1: Header Bar $\to$ 12-Month Yearly Cashflow Chart $\to$ Hero Summary Card $\to$ Savings Goal Card $\to$ Top Categories Carousel $\to$ Filter Tabs $\to$ Transaction List.
>    - Tích hợp `BudgetSettingSheet` và `ReceiptPhotoModal` quản lý popup mượt mà.
> 3. **Liên Kết Điều Hướng Từ Trang Profile (`src/app/profile/page.tsx`)**:
>    - Chạm vào thẻ Chi tiêu trên trang Profile sẽ kích hoạt `router.push('/expense')` chuẩn 1:1 với `coordinator.openExpense()` của iOS.
> 4. **Integration Test Suite (`src/app/expense/__tests__/expense-page.test.tsx`)**:
>    - Bao phủ các kịch bản: Chưa đăng nhập (Redirect), Đang tải (Skeleton), Dữ liệu đầy đủ, Mở modal thiết lập ngân sách & xem ảnh hóa đơn, Chuyển đổi bộ lọc.
> 5. **Kiểm Tra Toàn Diện Cuối Cùng**: Chạy `npx tsc --noEmit`, `npm test` toàn dự án và `npm run build` kiểm chứng production build hoàn hảo.

---

### Bảng Đối Chiếu Kiến Trúc (iOS vs Next.js)

| Thành phần iOS | Thành phần Next.js | Chi tiết triển khai & Tương tác |
| :--- | :--- | :--- |
| `ExpenseDashboardView.swift` | `src/app/expense/page.tsx` | Next.js App Router Client Page, Canvas Oat Milk `#EDE9DF`, max-w-md |
| `ExpenseDashboardViewModel` | `useExpenseDashboard.ts` | Data Hook quản lý 5 endpoint queries, month/year selector, mutations |
| `BudgetSettingSheet` | `src/components/profile/BudgetSettingSheet.tsx` | Bottom sheet thiết lập hạn mức ngân sách, ngưỡng % cảnh báo, mục tiêu tiết kiệm |
| `coordinator.openExpense()` | `router.push('/expense')` | Gắn vào click thẻ ngân sách trên trang `/profile` |
| `photoPreviewOverlay` | `ReceiptPhotoModal.tsx` | Modal xem ảnh bill phóng to toàn màn hình, Zero Blur, bo góc 24px |
| `ExpenseDashboardSkeletonView` | `ExpenseDashboardSkeleton.tsx` | Hiển thị khi `isLoading && !summary` |

---

### Danh Sách Công Việc Chi Tiết (Tasks)

#### 🔹 Task 1: Tạo Barrel Export `src/components/expense/index.ts` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/index.ts`
- **Mô tả chi tiết**:
  - Export toàn bộ 9 components:
    - `ExpenseHeaderBar`
    - `YearlyCashflowChart`
    - `ExpenseDashboardSkeleton`
    - `ExpenseHeroSummaryCard`
    - `ExpenseSavingsGoalCard`
    - `TopCategoriesSection`
    - `TransactionFilterTabs`
    - `TransactionListSection`
    - `ReceiptPhotoModal`
  - Export types/interfaces tương ứng để các trang và module khác dễ dàng import.
- **Kết quả nghiệm thu**: `src/components/expense/index.ts` hoàn thành sạch sẽ, kèm unit test `src/components/expense/__tests__/index.test.ts` pass 100%, TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Chuẩn bị sẵn sàng cho trang chính `/expense/page.tsx`.

---

#### 🔹 Task 2: Xây Dựng Trang Chính Dashboard Chi Tiêu `src/app/expense/page.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/app/expense/page.tsx`
- **Mô tả chi tiết**:
  - Route Guard:
    - Kiểm tra `isHydrated` và `isAuthenticated` từ `useAuthStore`.
    - Chuyển hướng về `/login?redirect=/expense` nếu chưa đăng nhập.
  - Tích hợp Data Hook `useExpenseDashboard`:
    - Truyền `enabled: Boolean(isAuthenticated)`.
    - Lấy toàn bộ state & actions: `currentMonthKey`, `currentYear`, `yearlyPoints`, `summary`, `topCategories`, `transactions`, `selectedFilter`, `isLoading`, `isLoadingMore`, `hasMorePages`, `selectMonth`, `changeYear`, `selectFilter`, `loadMoreTransactions`, `saveBudget`, `saveSavingsGoal`.
  - State quản lý Modals:
    - `isBudgetSheetOpen`: Quản lý hiển thị `BudgetSettingSheet`.
    - `previewImageUrl`: Quản lý hiển thị `ReceiptPhotoModal`.
  - Bố cục trang (`min-h-screen bg-canvas text-text-primary select-none`):
    - Khung giao diện: `w-full max-w-md mx-auto flex flex-col min-h-screen relative`.
    - `ExpenseHeaderBar`: Nút back gọi `router.back()` hoặc chuyển về `/profile`.
    - Khi `isLoading && !summary`: Render `ExpenseDashboardSkeleton`.
    - Khi có dữ liệu:
      - `YearlyCashflowChart`: Selector 12 tháng dual-bar chart.
      - `ExpenseHeroSummaryCard`: Tổng chi tiêu lớn 34px, bar 8px, 3 cột Thu/Chi/Thuần. Click progress mở `BudgetSettingSheet`.
      - `ExpenseSavingsGoalCard`: Mục tiêu tiết kiệm, bar 6px, nút Sửa/Đặt. Click mở `BudgetSettingSheet`.
      - `TopCategoriesSection`: Carousel cuộn ngang các danh mục.
      - `TransactionFilterTabs`: 3 tabs Tất cả / Chi tiêu / Thu nhập.
      - `TransactionListSection`: Danh sách thẻ giao dịch phẳng, infinite scroll, click mở `ReceiptPhotoModal`.
    - Modals:
      - `BudgetSettingSheet`: Kết nối lưu cả hạn mức ngân sách và mục tiêu tiết kiệm.
      - `ReceiptPhotoModal`: Phóng to ảnh bill chất lượng cao.
- **Kết quả nghiệm thu**: `src/app/expense/page.tsx` hoàn thiện 1:1 với `ExpenseDashboardView.swift` (185 dòng, < 700 dòng), TypeScript kiểm tra 0 lỗi (`npx tsc --noEmit` pass 100%). Sẵn sàng cho cập nhật liên kết từ trang Profile ở Task 3.

---

#### 🔹 Task 3: Cập Nhật Điều Hướng Từ Trang Profile `src/app/profile/page.tsx` Sang `/expense` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/app/profile/page.tsx`
- **Mô tả chi tiết**:
  - Cập nhật `onClick` của `BudgetSummaryCard` trên trang Profile:
    - Thay vì mở sheet trực tiếp tại Profile, điều hướng người dùng sang trang `/expense` bằng `router.push('/expense')` kèm `haptics.light()`.
    - Người dùng xem dashboard chi tiết trên `/expense` và có thể mở `BudgetSettingSheet` trực tiếp tại đó.
- **Kết quả nghiệm thu**: `src/app/profile/page.tsx` cập nhật điều hướng chuẩn xác sang `/expense`, 7/7 unit & integration tests trong `src/app/profile/__tests__/profile-page.test.tsx` passed 100%, TypeScript biên dịch 0 lỗi (`npx tsc --noEmit` pass 100%). Sẵn sàng cho Task 4: Integration Test Suite cho trang `/expense`.

---

#### 🔹 Task 4: Xây Dựng Integration Test Suite `src/app/expense/__tests__/expense-page.test.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/app/expense/__tests__/expense-page.test.tsx`
- **Mô tả chi tiết**:
  - Test Suite bao phủ các trường hợp chính:
    1. Chưa hydrate: Hiển thị Skeleton loading.
    2. Chưa đăng nhập: Tự động redirect về `/login?redirect=/expense`.
    3. Đang tải: Hiển thị Skeleton View (`ExpenseDashboardSkeleton`).
    4. Tải xong: Hiển thị đúng Header, Biểu đồ 12 tháng, Hero card, Savings card, Danh mục, Filter tabs và Danh sách giao dịch.
    5. Mở `BudgetSettingSheet` khi click thanh tiến độ ngân sách hoặc nút sửa mục tiêu tiết kiệm.
    6. Mở `ReceiptPhotoModal` khi click vào giao dịch có ảnh hóa đơn.
    7. Chuyển tab bộ lọc và gọi `selectFilter`.
    8. Click nút Back quay về trang trước (`router.back` hoặc `router.push('/profile')`).
- **Kết quả nghiệm thu**: 12/12 integration tests trong `src/app/expense/__tests__/expense-page.test.tsx` passed 100%, TypeScript biên dịch 0 lỗi (`npx tsc --noEmit` pass 100%). Sẵn sàng cho Task 5: Kiểm tra tổng thể toàn bộ dự án và Production Build.

---

#### 🔹 Task 5: Kiểm Tra Tổng Thể Toàn Dự Án & Final Production Build [x] (ĐÃ HOÀN THÀNH)
- **Lệnh thực thi**:
  - `npx tsc --noEmit`: 0 lỗi, kiểm tra kiểu dữ liệu toàn diện passed.
  - `npm test`: 62 test files, 415/415 tests passed 100%, 0 regression.
  - `npm run build`: Next.js 15.5.28 production build thành công xuất sắc, route `/expense` đạt 10.2 kB (147 kB First Load JS), 17/17 trang static prerendered hoàn hảo.
- **Kết quả nghiệm thu**: Toàn bộ Master Plan phân hệ Dashboard Chi tiêu `/expense` gồm 5 Phases đã hoàn thành 100%, đạt chuẩn Parity 1:1 với iOS `ExpenseDashboardView.swift`.

---

### Quy Trình Thực Hiện Nghiêm Ngặt
- **Mỗi lượt chỉ làm ĐÚNG 1 task** theo yêu cầu của người dùng.
- **Tuân thủ TDD & Strict Constraints**: Zero Border, Zero Blur, Zero Shadow, File < 700 dòng.
