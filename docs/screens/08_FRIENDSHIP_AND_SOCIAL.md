# 🤝 PHÂN HỆ BẠN BÈ, QR CODE & DEEP LINKS (`/invite` & `/friends` - LOW TEXT SPEC)

> 💡 **NGUYÊN TẮC GIAO DIỆN ÍT CHỮ (LOW-TEXT UI)**:  
> Sử dụng mã QR trực quan, nút sao chép link và bảng chia sẻ native. Mọi nút duyệt lời mời đều chỉ gồm 1 - 2 từ ngắn gọn.

---

## 1. MÀN HÌNH MỜI BẠN BÈ & MÃ QR CÁ NHÂN (`/invite`)

```text
┌────────────────────────────────────────────────────────┐
│ [←]                  Mời Bạn                           │ (HeaderBar)
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │           [Mã QR Checked Sắc Nét]                │  │
│  │                                                  │  │
│  │           @khanhnkq · Nguyễn Kim Quốc Khánh       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [📋 Sao chép link]             [📤 Chia sẻ]           │
└────────────────────────────────────────────────────────┘
```

- **Mã QR Vector**: Tạo bằng SVG chất lượng cao không bị nhòe vỡ hạt.
- **2 Nút Thao Tác Ngắn Gọn**:
  - `Sao chép link`: Lưu `https://checked.app/invite?token={inviteToken}` vào clipboard.
  - `Chia sẻ`: Mở native Web Share API (`navigator.share`).

---

## 2. TRANG TIẾP NHẬN LINK MỜI (`/invite/[token]`)
- Thẻ thông tin người mời: Avatar, Tên đầy đủ, Username.
- Nếu đã đăng nhập: Nút to duy nhất **`Đồng ý kết bạn`**.
- Nếu chưa đăng nhập: **`Đăng nhập để kết bạn`** hoặc **`Tạo tài khoản`**.

---

## 3. QUẢN LÝ LỜI MỜI KẾT BẠN (`/friends/requests`)
- **2 Tab Ngắn Gọn**: **`Đã nhận`** (Incoming) & **`Đã gửi`** (Outgoing).
- **Thao Tác Nhanh**:
  - Tab `Đã nhận`: Nút **`Đồng ý`** (Matcha Glow) & **`Từ chối`** (Xám nhạt).
  - Tab `Đã gửi`: Nút **`Hủy`** (Hủy yêu cầu).

---

## 4. TRANG CÁ NHÂN NGƯỜI DÙNG KHÁC (`/u/[username]`)
- Header: Avatar, Tên hiển thị, Username, Huy hiệu `Gold`.
- Nút ngắn: **`Bạn chung`** (chạm vào mở Sheet danh sách bạn chung).
- Nút chính (theo trạng thái `FriendshipStatus`):
  - Nếu chưa kết bạn: **`Kết bạn`**
  - Nếu đang chờ duyệt: **`Đã gửi lời mời`**
  - Nếu là bạn bè: **`Nhắn tin`**
- Menu 3 chấm: `Hủy kết bạn`, `Chặn`.

---

## 5. QUÉT MÃ QR BẰNG CAMERA TRÌNH DUYỆT (`/scan`)
- Khung ngắm quét mã QR với 4 góc căn chỉnh cơ học (Corner markers).
- Nút đóng: `✕` góc trên.
- Quét trúng: Tự động điều hướng sang `/u/[username]` hoặc `/invite/[token]` không cần bấm thêm nút nào.
