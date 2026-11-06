# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 4
## Categories Carousel, Filter Tabs & Transaction List (kèm Receipt Photo Modal)
### Phân Hệ: Expense Dashboard (`/expense`) — Checked Next.js
### Chuẩn Parity 1:1 với `ExpenseDashboardView.swift` (Sections 7, 8, 9 & Photo Preview Overlay)

> **Mục tiêu**: Xây dựng 4 thành phần giao dịch và phân tích danh mục của Dashboard Chi tiêu đạt độ chuẩn xác 100% so với iOS:
> 1. **`TopCategoriesSection.tsx`**: Thẻ cuộn ngang Top danh mục chi tiêu nhiều nhất, tỷ lệ %, icon filled tròn $32\text{px}$, kích thước $124 \times 96\text{px}$. Ẩn đi khi không có dữ liệu.
> 2. **`TransactionFilterTabs.tsx`**: 3 Tabs dạng Capsule Pills ("Tất cả", "Chi tiêu", "Thu nhập"), highlight xanh Matcha Glow `#D4EB70` khi active, hiệu ứng bấm nhún và haptics.
> 3. **`TransactionListSection.tsx`**: Danh sách thẻ giao dịch phẳng độc lập (Zero Border, Zero Divider), thumbnail ảnh bill $44\text{px}$ bo góc $12\text{px}$, ngày giờ định dạng tiếng Việt ("Hôm nay, 14:30"), số tiền xanh lá nếu là thu nhập và infinite scroll tải thêm.
> 4. **`ReceiptPhotoModal.tsx`**: Modal xem ảnh hóa đơn phóng to sắc nét, nền tối `bg-black/85` (Zero Blur), bo góc $24\text{px}$, nút đóng góc trên và phím Esc.
> 5. **Kiểm thử tự động TDD**: Viết unit test suites bao phủ toàn bộ các kịch bản tương tác, empty state, infinite scroll, và 0 regression trên toàn bộ test suite dự án.

---

### Bảng Đối Chiếu Thành Phần (iOS vs Next.js)

| Thành phần iOS (`ExpenseDashboardView.swift`) | Component Next.js (`checked-nextjs`) | Chi tiết đặc tả & CSS tokens |
| :--- | :--- | :--- |
| `topCategoriesSection` | `TopCategoriesSection.tsx` | Carousel cuộn ngang `w-[124px] h-[96px] p-3 rounded-[18px] bg-surface`, icon tròn $32\text{px}$ `bg-graySubtle`, % chi tiêu |
| `filterTabsSection` | `TransactionFilterTabs.tsx` | HStack capsule pills: `ALL`, `EXPENSE`, `INCOME`. Active `bg-primary text-text-primary`, Inactive `bg-surface text-text-secondary` |
| `transactionListSection` & `transactionCard` | `TransactionListSection.tsx` | Header "Giao dịch" + số lượng. Cards phẳng `rounded-[20px] bg-surface px-4 py-3`, thumb $44\text{px}$ `rounded-[12px]`, ngày giờ, tiền +/- |
| Empty State | Empty State trong `TransactionListSection` | Card `rounded-[20px] bg-surface py-6`, icon `CreditCard` $28\text{px}$, chữ "Chưa có giao dịch" |
| `photoPreviewOverlay` | `ReceiptPhotoModal.tsx` | Fixed overlay `bg-black/85` (Zero Blur), ảnh `rounded-[24px] max-h-[75vh]`, nút đóng trắng tròn $28\text{px}$ |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 4

```
src/
└── components/
    └── expense/
        ├── TopCategoriesSection.tsx                 # Thẻ cuộn ngang Top danh mục chi tiêu
        ├── TransactionFilterTabs.tsx                # Bộ 3 tabs lọc giao dịch (Tất cả / Chi tiêu / Thu nhập)
        ├── TransactionListSection.tsx               # Danh sách thẻ giao dịch phẳng độc lập
        ├── ReceiptPhotoModal.tsx                    # Modal xem ảnh biên lai / hóa đơn phóng to
        └── __tests__/
            ├── top-categories-section.test.tsx      # Unit tests cho TopCategoriesSection
            ├── transaction-filter-tabs.test.tsx     # Unit tests cho TransactionFilterTabs
            ├── transaction-list-section.test.tsx    # Unit tests cho TransactionListSection
            └── receipt-photo-modal.test.tsx         # Unit tests cho ReceiptPhotoModal
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

#### 🔹 Task 1: Xây Dựng Thẻ Cuộn Top Danh Mục `TopCategoriesSection.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/TopCategoriesSection.tsx`
- **Mô tả chi tiết**:
  - Container ngoài: `flex flex-col gap-2.5 w-full select-none`.
  - Header: Tiêu đề `"Danh mục"` (`text-[14px] font-bold font-display text-text-secondary px-1`).
  - Container cuộn ngang: `w-full flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth`.
  - Item Card:
    - Kích thước cố định: `w-[124px] h-[96px] shrink-0 p-3 bg-surface rounded-[18px] flex flex-col justify-between`.
    - Hàng trên:
      - Icon danh mục tròn $32 \times 32\text{px}$ nền `bg-graySubtle rounded-full flex items-center justify-center`: Icon đen $15\text{px}$ tương ứng với tên danh mục (sử dụng mapper `getCategoryIconName`).
      - Tỷ lệ phần trăm: `${category.percentage}%` (`text-[12px] font-bold font-display text-text-secondary`).
    - Hàng dưới:
      - Tên danh mục: `category.categoryName` (`text-[13px] font-bold font-display text-text-primary truncate w-full`).
      - Số tiền: `formatShortCurrency(category.totalAmount)` (`text-[12px] font-bold font-display text-text-secondary`).
  - Logic điều kiện: Nếu mảng `categories` rỗng (`length === 0`), component trả về `null` (ẩn hoàn toàn như iOS).
  - Props:
    - `categories?: TopCategorySpend[]`
- **Kết quả nghiệm thu**: `TopCategoriesSection.tsx` (103 dòng, < 700 dòng), 4/4 unit tests trong `top-categories-section.test.tsx` passed 100%. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Đáp ứng 1:1 chuẩn thiết kế iOS.

---

#### 🔹 Task 2: Xây Dựng Bộ Lọc Giao Dịch `TransactionFilterTabs.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/TransactionFilterTabs.tsx`
- **Mô tả chi tiết**:
  - Container: `flex items-center gap-2 py-0.5 select-none w-full overflow-x-auto no-scrollbar` (role `tablist`).
  - 3 Tabs lọc định nghĩa theo `TransactionFilterOption`:
    - `ALL`: Nhãn `"Tất cả"`
    - `EXPENSE`: Nhãn `"Chi tiêu"`
    - `INCOME`: Nhãn `"Thu nhập"`
  - Thiết kế Capsule Pill:
    - Nút bấm bo tròn `px-4 py-2 rounded-full text-[13px] font-display transition-all active:scale-95 duration-150` (role `tab`).
    - Trạng thái Active (`isSelected`): Nền `bg-primary` (Matcha Glow `#D4EB70`), chữ `font-bold text-text-primary`, `aria-selected="true"`.
    - Trạng thái Inactive: Nền `bg-surface` (`#FFFFFF`), chữ `font-medium text-text-secondary hover:text-text-primary`, `aria-selected="false"`.
  - Tương tác: Bấm vào tab kích hoạt `haptics.light()` và gọi `onSelectFilter(filter)`. Tránh gọi lại khi bấm trúng tab đang chọn.
  - Props:
    - `selectedFilter: TransactionFilterOption`
    - `onSelectFilter: (filter: TransactionFilterOption) => void`
- **Kết quả nghiệm thu**: `TransactionFilterTabs.tsx` (64 dòng, < 700 dòng), 4/4 unit tests trong `transaction-filter-tabs.test.tsx` passed 100%. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Chuẩn thiết kế iOS capsule pill.

---

#### 🔹 Task 3: Xây Dựng Danh Sách Giao Dịch `TransactionListSection.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/TransactionListSection.tsx`
- **Mô tả chi tiết**:
  - Container ngoài: `flex flex-col gap-2.5 w-full select-none text-text-primary`.
  - Header:
    - Trái: `"Giao dịch"` ($15\text{px}$ `font-bold font-display text-text-primary`).
    - Phải: Số lượng giao dịch `${transactions.length}` ($13\text{px}$ `font-bold font-display text-text-secondary`).
  - Empty State (khi `transactions.length === 0`):
    - Khung trắng `w-full py-8 flex flex-col items-center justify-center gap-2 bg-surface rounded-[20px] select-none`.
    - Icon `CreditCard` $28\text{px}$ màu đen.
    - Dòng chữ `"Chưa có giao dịch"` ($13\text{px}$ `font-bold font-display text-text-secondary`).
  - Danh sách giao dịch (`transactions.length > 0`):
    - Container danh sách: `flex flex-col gap-2 w-full`.
    - Từng Transaction Card:
      - Thiết kế phẳng: `flex items-center gap-3 px-4 py-3 bg-surface rounded-[20px] select-none text-left border-0 transition-transform`.
      - Khối bên trái ($44 \times 44\text{px}$):
        - Nếu có ảnh bill (`thumbnailUrl` hoặc `imageUrl`): Render `<img>` bo góc `rounded-[12px] object-cover w-11 h-11 shrink-0 bg-graySubtle`.
        - Nếu không có ảnh: Ô vuông tròn $44 \times 44\text{px}$ `bg-graySubtle rounded-[12px] flex items-center justify-center shrink-0` chứa icon filled đen $18\text{px}$ (Icon `ArrowDownLeft` nếu `isIncome`, hoặc icon theo category).
      - Khối ở giữa (Nội dung & Thời gian):
        - Dòng 1: Ghi chú hoặc Tên danh mục: `item.note || item.categoryName || (item.isIncome ? 'Thu nhập' : 'Chi tiêu')` ($15\text{px}$ `font-bold font-display text-text-primary truncate`).
        - Dòng 2: Ngày giờ: `formatTransactionDate(item.createdAt)` ($12\text{px}$ `font-medium font-display text-text-secondary`).
      - Khối bên phải (Số tiền):
        - Định dạng: `${item.isIncome ? '+' : '-'}${formatCurrency(item.amount)}`.
        - Màu sắc: `text-success` (`#4E8752`) nếu `item.isIncome`, `text-text-primary` nếu `!item.isIncome`.
        - Font: $15\text{px}$ `font-bold font-display shrink-0 text-right`.
      - Tương tác: Bấm vào giao dịch (nếu có ảnh) sẽ gọi `onSelectReceiptPhoto(url)` kèm `haptics.light()`.
  - Infinite Scroll / Tải thêm:
    - Tự động quan sát phần tử cuối cùng (`IntersectionObserver` callback) khi `hasMore === true`, hiển thị "Đang tải thêm..." khi `isLoadingMore === true`.
  - Props:
    - `transactions: ExpenseTransaction[]`
    - `hasMore?: boolean`
    - `isLoadingMore?: boolean`
    - `onLoadMore?: () => void`
    - `onSelectReceiptPhoto?: (imageUrl: string) => void`
- **Kết quả nghiệm thu**: `TransactionListSection.tsx` (192 dòng, < 700 dòng), 7/7 unit tests trong `transaction-list-section.test.tsx` passed 100%. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Chuẩn thiết kế iOS transaction card.

---

#### 🔹 Task 4: Xây Dựng Modal Xem Ảnh Phóng To `ReceiptPhotoModal.tsx` [x] (ĐÃ HOÀN THÀNH)
- **File**: `src/components/expense/ReceiptPhotoModal.tsx`
- **Mô tả chi tiết**:
  - Container: `fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-black/85 select-none` (Zero Blur, độ trong suốt thuần `#000000` với opacity 85% giống iOS).
  - Nút đóng góc trên bên phải:
    - Nút tròn nền trong suốt `bg-white/10 hover:bg-white/20 active:scale-95 transition-all`, icon `X` trắng $28\text{px}$.
    - Bấm nút gọi `onClose()` kèm `haptics.light()`.
  - Vùng hiển thị ảnh trung tâm:
    - Ảnh phóng to: `max-w-full max-h-[75vh] object-contain rounded-[24px]` (khớp iOS `clipShape(RoundedRectangle(cornerRadius: 24))`).
    - Click vào ảnh không bị đóng modal (`e.stopPropagation()`).
    - Click vào vùng nền đen bên ngoài tự động đóng modal.
  - Phím tắt tiện ích: Lắng nghe phím `Escape` để đóng modal. Khóa cuộn trang `document.body.style.overflow = 'hidden'` khi mở modal và phục hồi khi unmount.
  - Props:
    - `imageUrl: string | null`
    - `onClose: () => void`
- **Kết quả nghiệm thu**: `ReceiptPhotoModal.tsx` (95 dòng, < 700 dòng), 7/7 unit tests trong `receipt-photo-modal.test.tsx` passed 100%. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit`). Chuẩn thiết kế iOS photo preview overlay.

---

#### 🔹 Task 5: Bộ Unit Test Suite cho Phase 4 & Kiểm Tra Toàn Dự Án [x] (ĐÃ HOÀN THÀNH)
- **Files**:
  - `src/components/expense/__tests__/top-categories-section.test.tsx` (4 tests)
  - `src/components/expense/__tests__/transaction-filter-tabs.test.tsx` (4 tests)
  - `src/components/expense/__tests__/transaction-list-section.test.tsx` (7 tests)
  - `src/components/expense/__tests__/receipt-photo-modal.test.tsx` (7 tests)
- **Mô tả chi tiết**:
  - `top-categories-section.test.tsx`: Render tiêu đề, các thẻ danh mục kèm số tiền rút gọn, tỷ lệ %, ẩn khi rỗng.
  - `transaction-filter-tabs.test.tsx`: Render 3 tabs lọc, highlight xanh Matcha Glow, click chuyển tab & haptics.
  - `transaction-list-section.test.tsx`: Render empty state, danh sách thẻ giao dịch, thumbnail ảnh, số tiền xanh/đen, click xem ảnh bill và infinite scroll.
  - `receipt-photo-modal.test.tsx`: Render ảnh phóng to, đóng modal qua nút X, backdrop click, phím Esc và khoá cuộn màn hình.
- **Kết quả nghiệm thu**: 22/22 unit tests của Phase 4 passed 100%. Toàn bộ test suite dự án đạt **60 test files, 402/402 tests passed (100%)**, 0 regression. TypeScript biên dịch 0 lỗi (`npx tsc --noEmit` pass 100%). Hoàn thành 100% Phase 4!

---

### Quy Trình Thực Hiện Nghiêm Ngặt
- **Mỗi lượt chỉ làm ĐÚNG 1 task** theo yêu cầu của người dùng.
- **Tuân thủ TDD & Strict Constraints**: Zero Border, Zero Blur, Zero Shadow, File < 700 dòng.
