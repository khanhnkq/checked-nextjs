# 📱 PHÂN HỆ XÁC THỰC & ĐĂNG KÝ (AUTH FLOW - LOW TEXT SPEC)

> 💡 **NGUYÊN TẮC GIAO DIỆN ÍT CHỮ (LOW-TEXT UI)**:  
> Loại bỏ hoàn toàn các câu văn giải thích dài dòng. Sử dụng từ ngữ ngắn gọn (1 - 2 từ), trực quan và dễ hiểu.

---

## 1. MÀN HÌNH ĐĂNG NHẬP (`/login`)
- **Giao diện tối giản chữ**:
  - Biểu tượng Camera Checked Matcha Glow.
  - Tiêu đề ngắn gọn: **`Đăng nhập`** (font `display-lg`, không câu chào dài dòng).
  - Ô nhập: `Email` (placeholder: `email@domain.com`).
  - Ô nhập: `Mật khẩu` (icon mắt ẩn/hiện).
  - Nút chính: **`Đăng nhập`** (Nền `#D4EB70`, bo tròn, chữ in đậm).
  - Nút phụ: **`Tạo tài khoản`** (nhấn mở `/register`).
- **Đồng bộ Context & Logic**:
  - Gửi `POST /api/v1/auth/login` với `{ email, password }`.
  - Nếu `isVerified === false` $\rightarrow$ Chuyển tiếp `/verify-otp?email=...`.
  - Nếu `profileCompleted === false` $\rightarrow$ Chuyển tiếp `/complete-profile`.
  - Thành công $\rightarrow$ Lưu `User` vào Zustand/IndexedDB, chuyển vào `/`.

---

## 2. MÀN HÌNH ĐĂNG KÝ (`/register`)
- **Giao diện tối giản chữ**:
  - Tiêu đề ngắn gọn: **`Đăng ký`**.
  - 3 trường nhập: `Email`, `Username`, `Mật khẩu`.
  - Nút chính: **`Tiếp tục`**.
  - Nút phụ: **`Đã có tài khoản`** (nhấn mở `/login`).
- **Đồng bộ Context & Logic**:
  - Gửi `POST /api/v1/auth/register` với `{ email, username, password }`.
  - Thành công $\rightarrow$ Chuyển ngay sang `/verify-otp?email=...&username=...`.

---

## 3. MÀN HÌNH XÁC THỰC MÃ OTP (`/verify-otp`)
- **Giao diện tối giản chữ**:
  - Tiêu đề ngắn gọn: **`Nhập mã 6 số`**.
  - Dòng email nhỏ gọn: `gửi tới: user@email.com`.
  - 6 ô vuông nhập số rời rạc:
    - Tự động nhảy focus sang ô kế tiếp.
    - Hỗ trợ dán (paste) 6 số từ clipboard.
  - Đếm ngược: `Gửi lại sau 60s` $\rightarrow$ `Gửi lại mã`.
- **Đồng bộ Context & Logic**:
  - Nhập đủ 6 số tự động gửi `POST /api/v1/auth/verify-otp`.
  - Thành công $\rightarrow$ Chuyển sang `/complete-profile`.

---

## 4. MÀN HÌNH HOÀN THIỆN HỒ SƠ (`/complete-profile`)
- **Giao diện tối giản chữ**:
  - Tiêu đề ngắn gọn: **`Hồ sơ của bạn`**.
  - Vòng tròn Avatar lớn $120x120px$ có icon camera để chọn ảnh từ máy.
  - Ô nhập: `Tên hiển thị` (placeholder: `Tên của bạn`).
  - Nút chính: **`Bắt đầu`**.
- **Đồng bộ Context & Logic**:
  - Upload avatar đại diện: `POST /api/v1/users/me/avatar`.
  - Cập nhật `displayName`: `PATCH /api/v1/users/me/profile`.
  - Cập nhật `user.profileCompleted = true`, điều hướng vào `/`.
