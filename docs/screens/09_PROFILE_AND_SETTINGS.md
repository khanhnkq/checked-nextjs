# 👤 TRANG CÁ NHÂN & CÀI ĐẶT (`/profile` & `/settings` - LOW TEXT SPEC)

> 💡 **NGUYÊN TẮC GIAO DIỆN ÍT CHỮ (LOW-TEXT UI)**:  
> Trang cá nhân tập trung vào 3 con số thống kê nổi bật (Bạn thân, Chuỗi ngày Streak, Chi tiêu) và lưới ảnh trực quan.

---

## 1. MÀN HÌNH HỒ SƠ CỦA TÔI (`/profile`)

```text
┌────────────────────────────────────────────────────────┐
│ [←]                   Hồ Sơ                     [⚙]    │ (HeaderBar)
├────────────────────────────────────────────────────────┤
│                                                        │
│                     [ AVATAR 84px ]                    │
│                Nguyễn Kim Quốc Khánh                   │
│                 @khanhnkq · 👑 Gold                    │
│                                                        │
│  ┌──────────────────┬──────────────────┬────────────┐  │
│  │    18 Bạn thân   │     🔥 14 Ngày   │    3.4M    │  │
│  │    Đang kết nối  │     Streak liên tục│  Đã chi   │  │
│  └──────────────────┴──────────────────┴────────────┘  │
│                                                        │
│  [🔳 Mã QR]                       [📤 Chia sẻ]         │
│                                                        │
│  Khoảnh khắc                                           │
│  [Ảnh 1]           [Ảnh 2]           [Ảnh 3]           │
│  [Ảnh 4]           [Ảnh 5]           [Ảnh 6]           │
└────────────────────────────────────────────────────────┘
```

- **3 Chỉ Số Con Số Lớn**:
  - `18` Bạn thân
  - `🔥 14 Ngày` Streak
  - `3.4M` Chi tiêu tháng
- **2 Nút Thao Tác Nhanh**: `Mã QR` và `Chia sẻ`.
- **Lưới Khoảnh Khắc**: Hiển thị ảnh của riêng tôi (3 cột).

---

## 2. MÀN HÌNH CÀI ĐẶT (`/settings`)

- **Tài khoản**:
  - Đổi ảnh đại diện
  - Sửa tên hiển thị (`displayName`)
  - Đổi mật khẩu
  - `Người dùng đã chặn →` (mở `/settings/blocked`)
- **Tùy chọn**:
  - `Thông báo` (Bật/Tắt)
  - `Rung xúc giác` (Bật/Tắt)
  - `Tự lưu ảnh chụp` (Bật/Tắt)
- **Hệ thống & Đăng xuất**:
  - `Phiên bản: 1.0.0`
  - **`Đăng xuất`** (Nút đỏ san hô `#FF6954`, viền cơ học phẳng).
