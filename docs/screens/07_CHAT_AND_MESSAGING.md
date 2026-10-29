# 💬 PHÂN HỆ NHẮN TIN THỜI GIAN THỰC & BẠN BÈ (`/messages` - LOW TEXT SPEC)

> 💡 **NGUYÊN TẮC GIAO DIỆN ÍT CHỮ (LOW-TEXT UI)**:  
> Tối giản hoàn toàn các banner thông báo rườm rà. Mọi thông tin bạn bè và tin nhắn được thể hiện cô đọng qua Avatar, Tên, Số đếm và Nhãn cực ngắn.

---

## 1. MÀN HÌNH DANH SÁCH HỘI THOẠI & BẠN THÂN (`FriendshipListView`)

```text
┌────────────────────────────────────────────────────────┐
│ [←]                  Tin Nhắn                  [+ Bạn] │ (HeaderBar)
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │ 12/20 Bạn thân                     [👑 Gold]     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [👥 2 Lời mời mới                                 →]  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Avatar] Linh Đan 🟢                              │  │
│  │          Hôm nay ăn phở ngon quá nè! · 12:45     │  │
│  │          [Badge: 2]                              │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ [Avatar] Hoàng Nam                                │  │
│  │          [Ảnh hóa đơn] · Hôm qua                 │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

- **Thanh Hạn Mức Bạn Thân**: Chỉ hiển thị `12/20 Bạn thân` kèm huy hiệu `Gold`.
- **Thẻ Lời Mời**: Thẻ ngắn gọn `2 Lời mời mới →` (chạm vào mở `/friends/requests`).
- **Danh sách Hội thoại**: Hiển thị avatar tròn, tên, nội dung tin nhắn cuối cùng thu gọn trên 1 dòng, và badge số tin chưa đọc.

---

## 2. PHÒNG CHAT 1-1 THỜI GIAN THỰC (`ChatView` - `/messages/[id]`)

### 2.1 Cấu Trúc Khung Chat (Zero Shadow)
- **Top Bar**: Nút Back `[←]`, Avatar tròn $38x38px$, Tên bạn bè, chấm xanh trực tuyến.
- **Vùng Cuộn Tin Nhắn (`ScrollViewReader`)**:
  - Tự động cuộn xuống đáy khi có tin nhắn mới.
  - Tải tin nhắn cũ khi cuộn lên đỉnh.
- **Chỉ Báo Đang Soạn Thảo (`isPartnerTyping`)**:
  - 3 chấm nhấp nháy động dạng sóng (không cần dòng chữ dài "Người dùng đang nhập tin nhắn...").

### 2.2 Các Kiểu Bong Bóng Tin Nhắn (`ChatBubble`)
- **Tin Nhắn Của Tôi (Mine)**: Bên phải, nền Matcha Glow `#D4EB70`, viền `border border-[#141613]/10`, chữ đen đậm.
- **Tin Nhắn Bạn Bè (Partner)**: Bên trái, nền xám `#F2F2F4`, viền `border border-[#141613]/8`, chữ đen.
- **Tin Nhắn Kèm Ảnh**: Ảnh vuông bo góc `18px`, chạm vào phóng to.
- **Phản Hồi Trích Dẫn (Quote Reply)**: Khối chữ nhỏ phía trên bong bóng tin nhắn.

### 2.3 Menu Tương Tác Tin Nhắn (Nhãn Ngắn Gọn)
- `Trả lời`
- `Sao chép`
- `Xóa` (`Delete for me`)
- `Thu hồi` (`Revoke for everyone` - nội dung chuyển thành `Đã thu hồi`)
