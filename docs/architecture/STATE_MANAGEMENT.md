# 📊 STATE MANAGEMENT SPECIFICATION

Hệ thống quản lý trạng thái của Checked Web kết hợp hoàn hảo giữa **Zustand** (trạng thái tương tác UI cục bộ) và **TanStack Query v5** (trạng thái dữ liệu máy chủ từ Backend).

---

## 1. PHÂN BỔ PHẠM VI QUẢN LÝ TRẠNG THÁI

```text
┌────────────────────────────────────────────────────────┐
│                      ỨNG DỤNG                          │
├───────────────────────────┬────────────────────────────┤
│   ZUSTAND STORES (Client) │  TANSTACK QUERY V5 (Server)│
│  - Trạng thái Auth (User) │  - Danh sách Feed ảnh      │
│  - Thiết lập Camera 1:1   │  - Dữ liệu Chi tiêu tháng  │
│  - Lọc bạn bè đang chọn   │  - Dữ liệu Calo & Bữa ăn   │
│  - Quản lý Bottom Sheets  │  - Danh sách Bạn bè & Chat │
│  - WebSocket STOMP status │  - Tin nhắn hội thoại      │
└───────────────────────────┴────────────────────────────┘
```

---

## 2. ĐẶC TẢ CHI TIẾT CÁC ZUSTAND STORES

### 2.1 `useAuthStore`
Quản lý danh tính và phiên làm việc của người dùng hiện tại:
- **State**:
  - `user: User | null`: Thông tin tài khoản người dùng đăng nhập.
  - `isAuthenticated: boolean`: Cờ xác nhận đã đăng nhập.
  - `accessToken: string | null`: Token truy cập trong bộ nhớ RAM.
- **Actions**:
  - `setSession(user, token)`: Khởi tạo phiên, lưu vào IndexedDB.
  - `updateUser(partialUser)`: Cập nhật thông tin nhanh không cần tải lại trang.
  - `logout()`: Xóa token, xóa cache và điều hướng về trang Login.

### 2.2 `useCameraStore`
Quản lý trạng thái phần cứng camera trên trình duyệt:
- **State**:
  - `stream: MediaStream | null`: Luồng video trực tiếp từ thiết bị.
  - `facingMode: 'user' | 'environment'`: Chế độ camera trước hoặc sau.
  - `isFlashOn: boolean`: Bật/tắt đèn trợ sáng (nếu thiết bị hỗ trợ).
  - `zoomFactor: number`: Tỷ lệ thu phóng (mặc định $1.0$, hỗ trợ $0.5x$ đến $3.0x$).
  - `capturedImage: Blob | null`: Ảnh vừa chụp đang chờ xem trước và gửi.
- **Actions**:
  - `toggleCamera()`: Đổi giữa camera selfie và camera chính.
  - `toggleFlash()`: Kích hoạt torch constraint trên video track.
  - `setZoom(factor)`: Điều chỉnh zoom camera.
  - `clearCaptured()`: Hủy ảnh đã chụp, quay lại ống kính live.

### 2.3 `useUIStore`
Quản lý các sheet, popup và bộ lọc nổi:
- **State**:
  - `selectedFriendFilter: Friend | 'all' | 'me'`: Bộ lọc xem ảnh khoảnh khắc.
  - `isFriendDropdownOpen: boolean`: Trạng thái mở menu chọn bạn bè.
  - `activeBottomSheet: 'bill' | 'food' | 'calorie' | 'location' | 'price' | null`.
  - `previewImageUrl: string | null`: URL ảnh đang phóng to toàn màn hình.

---

## 3. TANSTACK QUERY V5 & CẬP NHẬT LẠC QUAN (OPTIMISTIC UPDATES)

### 3.1 Cấu Hình Query Keys Chuẩn
- `['photos', 'feed', filterId]`: Danh sách ảnh khoảnh khắc trên trang chủ.
- `['photos', 'history', friendId]`: Danh sách ảnh trong trang lịch sử.
- `['expenses', 'monthly', monthKey]`: Báo cáo chi tiêu và ngân sách tháng.
- `['calorie', 'daily', dateKey]`: Thống kê calo và các bữa ăn trong ngày.
- `['chat', 'conversations']`: Danh sách các cuộc trò chuyện.
- `['chat', 'messages', conversationId]`: Lịch sử tin nhắn theo từng phòng chat.
- `['friends', 'list']`: Danh sách bạn bè chính thức.
- `['friends', 'requests']`: Lời mời kết bạn đang chờ.

### 3.2 Ví Dụ Cập Nhật Lạc Quan (Optimistic Message Sending)
Khi người dùng bấm Gửi tin nhắn trong phòng chat:
1. Tin nhắn lập tức được tạo với ID tạm thời và chèn ngay vào danh sách tin nhắn hiển thị với biểu tượng đồng hồ đang gửi.
2. Gửi frame tin nhắn qua WebSocket STOMP tới backend.
3. Khi backend phản hồi ACK thành công, thay thế ID tạm bằng ID thật từ máy chủ.
4. Nếu kết nối mạng lỗi, đổi biểu tượng thành dấu chấm than đỏ cho phép người dùng click "Thử lại".

