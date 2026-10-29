# 🗂️ LƯỚI LỊCH SỬ KHOẢNH KHẮC & XEM ẢNH VUỐT DỌC (`/history`)

Phân hệ quản lý và xem lại toàn bộ các khoảnh khắc đã đăng và ảnh nhận được từ bạn bè theo chuẩn tương tác Locket.

---

## 1. MÀN HÌNH LƯỚI ẢNH LOCKET (`HistoryPhotoGridView`)

- **Bố cục Lưới 3 Cột Đối Xứng**:
  - Mỗi hàng gồm chính xác 3 ô ảnh vuông đều nhau (`aspect-square`).
  - Khoảng cách rãnh giữa các ảnh cố định `6px` (`gap-[6px]`).
  - Tải ảnh thu nhỏ độ phân giải cao (`thumbnailUrl` 320x320) giúp tải nhanh chóng không tốn băng thông.
- **Thanh Top Bar Lọc Động**:
  - Nút Back tròn trở về màn hình camera chính.
  - Menu Dropdown lọc người gửi:
    - "Tất cả": Xem dòng thời gian gộp chung của cả tôi và bạn bè.
    - "Bạn": Chỉ xem khoảnh khắc do chính tôi chụp và đăng.
    - Từng bạn bè cụ thể: Lọc ảnh riêng của người bạn đó.
- **Nhóm theo Ngày**:
  - Các khối ảnh được chia theo nhóm ngày (Hôm nay, Hôm qua, 24 Tháng 10...).
  - Badge nhỏ góc ảnh: Icon hóa đơn màu xanh nếu có chi tiêu, hoặc icon ngọn lửa nếu có dữ liệu calo.
- **Kéo để làm mới (Pull-to-Refresh)**: Hỗ trợ vuốt kéo đầu trang để tải dữ liệu mới nhất.

---

## 2. TRÌNH XEM ẢNH CHI TIẾT VUỐT DỌC (`PhotoDetailView`)

Mở khi người dùng chạm vào bất kỳ ảnh nào trong lưới lịch sử:

### 2.1 Cơ Chế Vuốt Dọc Chuyển Ảnh (Snap Vertical Swipe)
- Toàn màn hình với nền đen mờ sang trọng.
- Người dùng vuốt ngón tay lên trên để nhảy sang ảnh kế tiếp, vuốt xuống dưới để quay lại ảnh trước đó.
- Animation nảy vật lý mượt mà bằng Framer Motion (`drag="y"`).

### 2.2 Thông Tin Khoảnh Khắc Nổi Trên Ảnh
- Header nhỏ trên ảnh: Avatar người gửi, Tên người gửi, thời gian đăng (ví dụ: "2 giờ trước"), vị trí quán ăn.
- Thẻ tag giá tiền hoặc calo đính kèm góc dưới ảnh.

### 2.3 Thanh Thả Cảm Xúc Emoji & Phản Hồi Nhanh
- Hàng 6 biểu tượng Emoji cảm xúc nổi bật: ❤️, 🔥, 😂, 😮, 😢, 👏.
- Khi người dùng chạm vào một Emoji:
  - Gọi API lưu phản hồi: `POST /api/v1/photos/{id}/reactions`.
  - Kích hoạt engine hiệu ứng hạt `EmojiBurstEngine` bắn tung hàng chục emoji bay lượn trên màn hình.
  - Số lượng phản hồi đếm tăng ngay tức thì (Optimistic UI).
- Ô nhập phản hồi nhanh: "Nhắn tin cho @bạn_bè...":
  - Nhập lời nhắn và bấm Gửi $\rightarrow$ Hệ thống tự động tạo tin nhắn trong phòng chat 1-1 với người gửi kèm trích dẫn bức ảnh này.

### 2.4 Menu Tùy Chọn Khoảnh Khắc (Action Sheet)
- Tải ảnh về máy (Download image).
- Chia sẻ link khoảnh khắc.
- Nếu là ảnh của chính tôi: Có nút "Xóa khoảnh khắc này" (màu đỏ `#FF6954`) kèm xác nhận cảnh báo.

