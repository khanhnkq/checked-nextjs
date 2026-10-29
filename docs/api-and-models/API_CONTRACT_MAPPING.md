# 🔌 API CONTRACT MAPPING SPECIFICATION

Tài liệu này đối chiếu toàn bộ các API Endpoints giữa ứng dụng **Next.js Client** và **`checked-backend` (Spring Boot 3.3)**, bao gồm phương thức HTTP, headers, query params và định dạng dữ liệu trả về.

---

## 1. PHÂN HỆ XÁC THỰC (AUTHENTICATION)

| Next.js Client Action | HTTP & Endpoint Backend | Headers / Body | Trả về |
| :--- | :--- | :--- | :--- |
| Đăng nhập | `POST /api/v1/auth/login` | `{ email, password }` | `AuthResponse` (tokens, user) |
| Đăng ký | `POST /api/v1/auth/register` | `{ email, username, password }` | `{ message: string }` |
| Xác thực OTP | `POST /api/v1/auth/verify-otp` | `{ email, otpCode }` | `AuthResponse` |
| Gửi lại mã OTP | `POST /api/v1/auth/resend-otp` | `{ email }` | `{ message: string }` |
| Làm mới Token | `POST /api/v1/auth/refresh` | Cookie `refresh_token` | `{ accessToken, expiresIn }` |
| Đăng xuất | `POST /api/v1/auth/logout` | `Authorization: Bearer <token>` | `204 No Content` |

---

## 2. PHÂN HỆ NGƯỜI DÙNG & HỒ SƠ (USERS & PROFILE)

| Next.js Client Action | HTTP & Endpoint Backend | Headers / Body | Trả về |
| :--- | :--- | :--- | :--- |
| Lấy user hiện tại | `GET /api/v1/users/me` | Bearer Token | `UserResponse` |
| Cập nhật hồ sơ | `PATCH /api/v1/users/me/profile` | `{ displayName, bio }` | `UserResponse` |
| Tải ảnh đại diện | `POST /api/v1/users/me/avatar` | `multipart/form-data (file)` | `{ avatarUrl: string }` |
| Xem hồ sơ người khác | `GET /api/v1/users/by-username/{u}` | Bearer Token | `UserProfileResponse` |
| Đổi mật khẩu | `POST /api/v1/users/me/change-password` | `{ oldPassword, newPassword }`| `200 OK` |

---

## 3. PHÂN HỆ KHOẢNH KHẮC & ẢNH CHỤP (PHOTOS & FEED)

| Next.js Client Action | HTTP & Endpoint Backend | Headers / Body | Trả về |
| :--- | :--- | :--- | :--- |
| Đăng ảnh mới | `POST /api/v1/photos` | Multipart: `photo`, `caption`, `amount`, `categoryId`, `note`, `recipientScope` | `PhotoResponse` |
| Lấy Feed trang chủ | `GET /api/v1/photos/feed` | Query: `page`, `size` | `Page<PhotoResponse>` |
| Lấy lịch sử theo bạn | `GET /api/v1/photos/history` | Query: `senderId?`, `page`, `size` | `Page<PhotoResponse>` |
| Xóa bài đăng | `DELETE /api/v1/photos/{id}` | Bearer Token | `204 No Content` |
| Thả cảm xúc Emoji | `POST /api/v1/photos/{id}/reactions`| `{ emoji: string }` | `PhotoReactionResponse` |
| Gỡ cảm xúc | `DELETE /api/v1/photos/{id}/reactions` | Bearer Token | `204 No Content` |

---

## 4. PHÂN HỆ CHI TIÊU & TÀI CHÍNH (EXPENSES)

| Next.js Client Action | HTTP & Endpoint Backend | Headers / Body | Trả về |
| :--- | :--- | :--- | :--- |
| Báo cáo dòng tiền tháng | `GET /api/v1/expenses/summary` | Query: `monthKey=2026-10` | `CashflowSummaryResponse` |
| Danh sách giao dịch | `GET /api/v1/expenses/entries` | Query: `monthKey`, `page`, `size` | `Page<ExpenseEntryResponse>` |
| Lấy hạn mức ngân sách | `GET /api/v1/expenses/budget` | Query: `monthKey` | `MonthlyBudgetResponse` |
| Cài đặt ngân sách tháng | `PUT /api/v1/expenses/budget` | `{ monthKey, amountLimit, alertThresholdPct }` | `MonthlyBudgetResponse` |
| Thêm chi tiêu thủ công | `POST /api/v1/expenses/entries` | `{ amount, note, categoryId, occurredAt }` | `ExpenseEntryResponse` |
| Danh mục chi tiêu | `GET /api/v1/expenses/categories` | Bearer Token | `ExpenseCategory[]` |

---

## 5. PHÂN HỆ DINH DƯỠNG & CALO (CALORIE & NUTRITION)

| Next.js Client Action | HTTP & Endpoint Backend | Headers / Body | Trả về |
| :--- | :--- | :--- | :--- |
| Báo cáo calo theo ngày | `GET /api/v1/nutrition/daily` | Query: `date=2026-10-29` | `CalorieDailyLogResponse` |
| Thiết lập mục tiêu calo | `PUT /api/v1/nutrition/goal` | `{ dailyTargetCalories }` | `CalorieGoalResponse` |
| Thêm nhanh món ăn | `POST /api/v1/nutrition/entries` | `{ dishName, calories, mealType, loggedAt }` | `MealEntryResponse` |

---

## 6. PHÂN HỆ BẠN BÈ & KẾT NỐI (FRIENDSHIP)

| Next.js Client Action | HTTP & Endpoint Backend | Headers / Body | Trả về |
| :--- | :--- | :--- | :--- |
| Danh sách bạn bè | `GET /api/v1/friends` | Bearer Token | `Friend[]` |
| Hạn mức bạn thân (Quota)| `GET /api/v1/friends/quota` | Bearer Token | `FriendshipQuotaInfo` |
| Tạo mã mời / Link mời | `POST /api/v1/friends/invites` | Bearer Token | `{ inviteToken, inviteUrl }` |
| Chấp nhận link mời | `POST /api/v1/friends/invites/accept`| `{ token }` | `Friend` |
| Lời mời kết bạn đang chờ | `GET /api/v1/friends/requests` | Query: `type=INCOMING/OUTGOING` | `FriendRequestItem[]` |
| Gửi lời mời kết bạn | `POST /api/v1/friends/requests` | `{ targetUserId }` | `FriendRequestItem` |
| Đồng ý lời mời | `POST /api/v1/friends/requests/{id}/accept` | Bearer Token | `200 OK` |
| Từ chối lời mời | `POST /api/v1/friends/requests/{id}/decline`| Bearer Token | `200 OK` |
| Hủy kết bạn | `DELETE /api/v1/friends/{id}` | Bearer Token | `204 No Content` |
| Danh sách bạn chung | `GET /api/v1/friends/{id}/mutual` | Bearer Token | `Friend[]` |
| Chặn người dùng | `POST /api/v1/friends/{id}/block` | Bearer Token | `200 OK` |
| Danh sách chặn | `GET /api/v1/friends/blocked` | Bearer Token | `Friend[]` |
| Bỏ chặn | `DELETE /api/v1/friends/blocked/{id}` | Bearer Token | `204 No Content` |

---

## 7. PHÂN HỆ CHAT & HỘI THOẠI (CONVERSATIONS)

| Next.js Client Action | HTTP & Endpoint Backend | Headers / Body | Trả về |
| :--- | :--- | :--- | :--- |
| Danh sách hội thoại | `GET /api/v1/chat/conversations` | Bearer Token | `Conversation[]` |
| Chi tiết tin nhắn phòng | `GET /api/v1/chat/conversations/{id}/messages` | Query: `beforeMessageId?`, `limit=30` | `ChatMessage[]` |
| Tổng số tin chưa đọc | `GET /api/v1/chat/unread-count` | Bearer Token | `{ totalUnreadCount: number }` |
| Xóa tin nhắn phía tôi | `DELETE /api/v1/chat/messages/{id}/for-me` | Bearer Token | `204 No Content` |
| Thu hồi tin nhắn | `POST /api/v1/chat/messages/{id}/revoke` | Bearer Token | `200 OK` |

