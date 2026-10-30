# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 4
## Hệ Thống 5 Bottom Sheets Chỉnh Sửa Phẳng (Chuẩn 1:1 iOS)

> **Mục tiêu**: Tái hiện trọn vẹn 5 Bottom Sheets kéo trượt từ `checked-ios` để người dùng có thể tùy chỉnh chính xác các siêu dữ liệu ảnh chụp (Giá tiền, Địa điểm, Món ăn, Lượng Calo, Chi tiết Hóa đơn) trước khi đăng.
> **Quy tắc thiết kế nghiêm ngặt**:
> - **Zero Border, Zero Blur, Zero Shadow**: Không sử dụng `border-*`, `blur-*`, `shadow-*`. Chỉ dùng độ tương phản tông màu phẳng (Flat Tonal Contrast) giữa Oat Milk (`#EDE9DF`), Surface White (`#FFFFFF`), Matcha Glow (`#D4EB70`), Dark Surface (`#141613`).
> - **Max 700 lines/file**: Tách nhỏ từng Sheet dưới 200 dòng, tái sử dụng `BaseBottomSheet`.
> - **Microcopy**: $\le 3$ từ mỗi nhãn/nút bấm.
> - **Keyboard & Touch-safe**: Trượt mượt mà, hỗ trợ đóng khi chạm nền mờ hoặc kéo grabber.

---

### Bảng Đối Chiếu Kiến Trúc (iOS vs Next.js)

| Thành phần trên iOS (`checked-ios`) | Thành phần Web Next.js (`checked-nextjs`) | Đặc tả & Giao diện |
| :--- | :--- | :--- |
| `BaseBottomSheet.swift` | `src/components/sheets/BaseBottomSheet.tsx` | Khung Modal nền Oat Milk, thanh kéo grabber `38x5px`, Header tiêu đề + nút đóng, thẻ `BottomSheetCard` nền trắng bo tròn 22px |
| `PriceEditSheet.swift` | `src/components/sheets/PriceEditSheet.tsx` | Ô nhập tiền lớn 34px, cuộn ngang các mức giá nhanh (20k, 35k, 50k, 75k, 100k, 150k, 200k) |
| `LocationEditSheet.swift` | `src/components/sheets/LocationEditSheet.tsx` | Ô nhập tên địa điểm, nút chọn nhanh vị trí GPS hiện tại kèm nút làm mới GPS |
| `FoodEditSheet.swift` | `src/components/sheets/FoodEditSheet.tsx` | Ô nhập tên món ăn tiếng Việt (không emoji), chọn danh mục ẩm thực (Món ăn, Món nước, Đồ uống, v.v.) |
| `CalorieEditSheet.swift` | `src/components/sheets/CalorieEditSheet.tsx` | Ô nhập calo lớn 34px, cuộn ngang mức calo nhanh (~250, ~400, ~550, ~700, ~850, ~1000 kcal) |
| `BillDetailSheet.swift` | `src/components/sheets/BillDetailSheet.tsx` | Chỉnh sửa tổng tiền hóa đơn, tên cửa hàng, danh mục và danh sách món bóc tách kèm số lượng & đơn giá |

---

### Danh Sách Công Việc (Tasks)

- [x] **Task 1: Xây dựng `BaseBottomSheet.tsx` & `BottomSheetCard`**
  - **File**: `src/components/sheets/BaseBottomSheet.tsx`
  - **Mô tả**: Modal trượt lên từ đáy màn hình, backdrop đen mờ `bg-black/40`, grabber capsule `38x5px bg-black/20`, Header icon + tiêu đề + nút đóng `X`, nút hành động Matcha Glow 52px ở đáy.
  - **Verifiable**: Unit test kiểm tra mở/đóng, render content và nút hành động (Đã hoàn thành, 7/7 tests pass).

- [x] **Task 2: Xây dựng `PriceEditSheet.tsx`**
  - **File**: `src/components/sheets/PriceEditSheet.tsx`
  - **Mô tả**: Nhập số tiền lớn với bàn phím số, dải chip chọn nhanh mức giá (20k - 200k), cập nhật callback `onConfirm(amount)`.
  - **Verifiable**: Unit test kiểm tra gõ số tiền, chọn chip nhanh và xác nhận (Đã hoàn thành, 6/6 tests pass).

- [ ] **Task 3: Xây dựng `LocationEditSheet.tsx`**
  - **File**: `src/components/sheets/LocationEditSheet.tsx`
  - **Mô tả**: Nhập tên địa điểm, gợi ý vị trí GPS với nút "Dùng" nhanh và nút "Cập nhật lại GPS".
  - **Verifiable**: Unit test kiểm tra nhập địa điểm, áp dụng gợi ý GPS và refresh.

- [ ] **Task 4: Xây dựng `FoodEditSheet.tsx` & `CalorieEditSheet.tsx`**
  - **Files**: `src/components/sheets/FoodEditSheet.tsx`, `src/components/sheets/CalorieEditSheet.tsx`
  - **Mô tả**: 
    - `FoodEditSheet`: Nhập tên món và chọn 6 danh mục ẩm thực.
    - `CalorieEditSheet`: Nhập calo lớn và chọn nhanh 6 mức calo phổ biến.
  - **Verifiable**: Unit test kiểm tra nhập liệu và callback của 2 sheet.

- [ ] **Task 5: Xây dựng `BillDetailSheet.tsx`**
  - **File**: `src/components/sheets/BillDetailSheet.tsx`
  - **Mô tả**: Chỉnh sửa tổng tiền thanh toán, tên cửa hàng/quán, danh mục chi tiêu, và hiển thị danh sách các món đã bóc tách từ hóa đơn.
  - **Verifiable**: Unit test kiểm tra sửa bill, danh sách món và sinh caption tự động.

- [ ] **Task 6: Ghép nối 5 Sheets vào `ImagePreviewView.tsx`**
  - **File**: `src/components/home/ImagePreviewView.tsx`
  - **Mô tả**: Khi người dùng nhấn vào các Pinned Tags trên ảnh hoặc các nút Action Pills, tự động mở Bottom Sheet tương ứng. Dữ liệu sau khi xác nhận được đồng bộ ngược lại vào Preview tags và caption.
  - **Verifiable**: Test tương tác mở từng sheet từ Preview tags và pills.

- [ ] **Task 7: Kiểm thử toàn diện & Verification**
  - **Lệnh**: `npm test` và `npm run build`.
  - **Tiêu chí**: 100% test suites pass, không vi phạm Zero Border/Blur/Shadow, Next.js build thành công.
