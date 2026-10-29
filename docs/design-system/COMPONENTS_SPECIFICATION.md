# 🧩 UI COMPONENTS & PRIMITIVES SPECIFICATION (ZERO BORDER, ZERO BLUR, ZERO SHADOW)

> ⚠️ **NGUYÊN TẮC THIẾT KẾ PHẲNG & CƠ HỌC (FLAT & TACTILE TONAL DESIGN)**:  
> Tuyệt đối không dùng `border`, `box-shadow` hay `backdrop-filter: blur()`. Tất cả sự tách bạch giữa các lớp giao diện đều dựa trên **độ tương phản màu nền (Tonal Contrast)** và **hình khối bo cong hình học (Rounded Geometry)**.

---

## 1. NÚT CHỤP MATCHA GLOW (`CaptureButton`)

Thành phần trung tâm với phong cách cơ học tối giản:

```text
       ┌────────────────────────┐
       │   (Vòng ngoài 80px)    │
       │   ┌────────────────┐   │
       │   │  (Matcha Glow) │   │
       │   │     70x70px    │   │
       │   └────────────────┘   │
       └────────────────────────┘
```

- **Kích thước ngoài**: Vòng tròn ngoài $80x80px$ màu `#D4EB70`/20 (không dùng border, không dùng bóng mờ).
- **Kích thước trong**: Lõi tròn màu `#D4EB70` kích thước $70x70px$ (phẳng hoàn toàn).
- **Hiệu ứng xúc giác (Haptic Feedback)**: Khi bấm kích hoạt `navigator.vibrate(25)`.
- **Hiệu ứng cơ học (Pressed Spring Animation)**:
  - Khi bắt đầu chạm: Lõi tròn co về `scale(0.90)` trong `100ms`.
  - Khi thả tay: Bật nảy về `scale(1.0)` với đường cong spring cơ học mượt mà.

---

## 2. NÚT BẤM TRÒN BIỂU TƯỢNG (`CircleIconButton`)

Được dùng cho: Nút Back, Nút lật Camera, Nút Flash, Nút Thêm bạn, Nút Tin nhắn.

- **Kích thước tiêu chuẩn**: `44x44px` (cho Header và Navigation) hoặc `52x52px` (cho thanh công cụ Bottom Bar).
- **Màu nền**: `#FFFFFF` hoặc `#DFDACD` (không dùng border).
- **Biểu tượng (Icon)**: Lucide Icon, kích thước `20px`, màu `#141613`, nét đậm (`stroke-width: 2.2`).
- **Tương tác**: `active:scale-92 transition-transform duration-120`.
- **Badge thông báo đính kèm**: Vòng tròn đỏ hoặc matcha góc trên bên phải `18x18px`, chữ in đậm sắc nét.

---

## 3. THANH ĐIỀU HƯỚNG TRÊN CÙNG & BỘ LỌC BẠN BÈ (`HomeTopBar` & `PillDropdown`)

Thanh Top Bar nổi với chiều cao `58px`, nền trong suốt, chia làm 3 cụm:

```text
[ Avatar Cá Nhân ]       [ Pill Dropdown Lọc Bạn Bè ▼ ]       [ Icon Chat + Badge ]
   (38x38px)                      (38px chiều cao)                 (44x44px)
```

### 3.1 Cụm Giữa - Pill Dropdown
- **Chiều cao**: `38px`, bo tròn hoàn toàn `rounded-full`, nền `#FFFFFF` (không border, không blur, không shadow).
- **Nội dung hiển thị**:
  - Nếu chọn "Tất cả": Icon nhóm bạn `Users` + Chữ "Tất cả" + Mũi tên `ChevronDown`.
  - Nếu chọn "Bạn": Avatar của chính tôi + Chữ "Bạn" + Mũi tên `ChevronDown`.
  - Nếu chọn bạn bè cụ thể: Avatar bạn bè + Tên bạn bè hiển thị + Mũi tên `ChevronDown`.

---

## 5. ĐÁY KÉO SHEET NỀN TẢNG (`BaseBottomSheet`)

Dùng cho toàn bộ 5 Sheet chỉnh sửa và Modal cài đặt:

- **Cấu trúc phẳng hoàn toàn**:
  - Nền `#FFFFFF` thuần túy (không border, không đổ bóng `shadow-sheet`).
  - **Drag Handle (Thanh kéo)**: Thanh pill xám nhỏ `36x4px`, bo tròn, cách mép trên `8px`.
  - **Header Sheet**: Tiêu đề trang trọng `headline`, nút "Xong" hoặc "Lưu" bên phải.
  - **Vùng nội dung cuộn**: `overflow-y-auto`, có tính năng chống lún bàn phím (`padding-bottom: max(env(safe-area-inset-bottom), 16px)`).
- **Tương tác vuốt (Framer Motion Drag)**:
  - Kéo xuống để đóng sheet (`drag="y"`, `dragConstraints={{ top: 0 }}`).

---

## 6. KHUNG XƯƠNG TẢI DỮ LIỆU (`SkeletonBone`)

- **Bản chất**: Hiệu ứng chuyển màu phẳng đơn sắc nhịp nhàng (Flat pulse) giữa `#DFDACD` và `#E9E5DB` (không border, không ánh sáng mờ lóa).
- **Biến thể**:
  - `SkeletonCircle`: Avatar tròn (`40px`, `48px`, `64px`).
  - `SkeletonLine`: Dòng chữ giả lập (chiều cao `14px`, chiều rộng linh hoạt `40%`, `70%`, `100%`).
  - `SkeletonCard`: Thẻ chi tiêu, thẻ calo, thẻ bài đăng ảnh.
