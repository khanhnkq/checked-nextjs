# 🧩 UI COMPONENTS & PRIMITIVES SPECIFICATION (ZERO BLUR, ZERO SHADOW)

> ⚠️ **NGUYÊN TẮC THIẾT KẾ PHẲNG & CƠ HỌC (FLAT & TACTILE DESIGN)**:  
> Tuyệt đối không dùng `box-shadow` hay `backdrop-filter: blur()`. Tất cả sự tách bạch giữa các lớp giao diện đều dựa trên **độ tương phản màu nền (Tonal Contrast)** và **đường viền đơn sắc sắc nét (Solid Crisp Borders)**.

---

## 1. NÚT CHỤP MATCHA GLOW (`CaptureButton`)

Thành phần trung tâm với phong cách cơ học tối giản:

```text
       ┌────────────────────────┐
       │   (Viền ngoài 80px)     │
       │   ┌────────────────┐   │
       │   │  (Matcha Glow) │   │
       │   │     70x70px    │   │
       │   └────────────────┘   │
       └────────────────────────┘
```

- **Kích thước ngoài**: Vòng tròn ngoài $80x80px$ với viền cơ học phẳng `border-2 border-primary` (không dùng bóng mờ tỏa sáng glow).
- **Kích thước trong**: Lõi tròn màu `#D4EB70` kích thước $70x70px$, viền mảnh sắc nét `border border-[#141613]/10`.
- **Hiệu ứng xúc giác (Haptic Feedback)**: Khi bấm kích hoạt `navigator.vibrate(25)`.
- **Hiệu ứng cơ học (Pressed Spring Animation)**:
  - Khi bắt đầu chạm: Lõi tròn co về `scale(0.90)` trong `100ms`.
  - Khi thả tay: Bật nảy về `scale(1.0)` với đường cong spring cơ học mượt mà.

---

## 2. NÚT BẤM TRÒN BIỂU TƯỢNG (`CircleIconButton`)

Được dùng cho: Nút Back, Nút lật Camera, Nút Flash, Nút Thêm bạn, Nút Tin nhắn.

- **Kích thước tiêu chuẩn**: `44x44px` (cho Header và Navigation) hoặc `52x52px` (cho thanh công cụ Bottom Bar).
- **Màu nền**: `#FFFFFF` hoặc `#DFDACD`.
- **Viền sắc nét**: `border border-[#141613]/10` (phẳng, không đổ bóng).
- **Biểu tượng (Icon)**: Lucide Icon, kích thước `20px`, màu `#141613`, nét đậm (`stroke-width: 2.2`).
- **Tương tác**: `active:scale-92 transition-transform duration-120`.
- **Badge thông báo đính kèm**: Vòng tròn đỏ hoặc matcha góc trên bên phải `18x18px`, viền trắng `border-2 border-white` sắc nét.

---

## 3. THANH ĐIỀU HƯỚNG TRÊN CÙNG & BỘ LỌC BẠN BÈ (`HomeTopBar` & `PillDropdown`)

Thanh Top Bar nổi với chiều cao `58px`, nền trong suốt, chia làm 3 cụm:

```text
[ Avatar Cá Nhân ]       [ Pill Dropdown Lọc Bạn Bè ▼ ]       [ Icon Chat + Badge ]
   (38x38px)                      (38px chiều cao)                 (44x44px)
```

### 3.1 Cụm Giữa - Pill Dropdown
- **Chiều cao**: `38px`, bo tròn hoàn toàn `rounded-full`, nền `#FFFFFF`, viền sắc nét `border border-[#141613]/12` (không blur, không shadow).
- **Nội dung hiển thị**:
  - Nếu chọn "Tất cả": Icon nhóm bạn `Users` + Chữ "Tất cả" + Mũi tên `ChevronDown`.
  - Nếu chọn "Bạn": Avatar của chính tôi + Chữ "Bạn" + Mũi tên `ChevronDown`.
  - Nếu chọn bạn bè cụ thể: Avatar bạn bè + Tên bạn bè hiển thị + Mũi tên `ChevronDown`.
- **Menu xổ xuống (Solid Popover Menu)**:
  - Xuất hiện dạng dropdown popover bo góc `24px`, nền `#FFFFFF`, viền đen mảnh sắc sảo `border border-[#141613]/15` (thay thế cho box-shadow).
  - Danh sách cuộn các bạn bè kèm avatar tròn, checkbox tích chọn màu Matcha Glow.
  - Mục cuối cùng cố định: "Thêm bạn mới" (Icon `Plus` màu đen).

---

## 4. THẺ BẠN BÈ XẾP CHỒNG 3D (`StackedFriendCardsView`)

Nằm ngay dưới khung camera 1:1 trên màn hình chính:

- **Ý tưởng thị giác**: Mô phỏng các thẻ ảnh phẳng xếp chồng lên nhau nghiêng nhẹ:
  - Thẻ 1 (trên cùng): Xoay góc `0deg`, hiển thị ảnh bạn bè mới nhất + viền mảnh `border border-white/20`.
  - Thẻ 2: Xoay góc `-3deg`, lệch nhẹ trục Y `+4px`, `scale(0.96)`.
  - Thẻ 3: Xoay góc `+3deg`, lệch nhẹ trục Y `+8px`, `scale(0.92)`.
- Không sử dụng drop-shadow; chiều sâu được thể hiện bằng góc nghiêng và viền tương phản.

---

## 5. ĐÁY KÉO SHEET NỀN TẢNG (`BaseBottomSheet`)

Dùng cho toàn bộ 5 Sheet chỉnh sửa và Modal cài đặt:

- **Cấu trúc phẳng hoàn toàn**:
  - Nền `#FFFFFF` thuần túy, viền trên `border-t border-[#141613]/10` (không đổ bóng hắt lên `shadow-sheet`).
  - **Drag Handle (Thanh kéo)**: Thanh pill xám nhỏ `36x4px`, bo tròn, cách mép trên `8px`.
  - **Header Sheet**: Tiêu đề trang trọng `headline`, nút "Xong" hoặc "Lưu" bên phải.
  - **Vùng nội dung cuộn**: `overflow-y-auto`, có tính năng chống lún bàn phím (`padding-bottom: max(env(safe-area-inset-bottom), 16px)`).
- **Tương tác vuốt (Framer Motion Drag)**:
  - Kéo xuống để đóng sheet (`drag="y"`, `dragConstraints={{ top: 0 }}`).

---

## 6. KHUNG XƯƠNG TẢI DỮ LIỆU (`SkeletonBone`)

- **Bản chất**: Hiệu ứng chuyển màu phẳng đơn sắc nhịp nhàng (Flat pulse) giữa `#DFDACD` và `#E9E5DB` (không dùng ánh sáng mờ lóa).
- **Biến thể**:
  - `SkeletonCircle`: Avatar tròn (`40px`, `48px`, `64px`).
  - `SkeletonLine`: Dòng chữ giả lập (chiều cao `14px`, chiều rộng linh hoạt `40%`, `70%`, `100%`).
  - `SkeletonCard`: Thẻ chi tiêu, thẻ calo, thẻ bài đăng ảnh.
