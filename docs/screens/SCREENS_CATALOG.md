# 📱 SCREENS & MODALS CATALOG (23 VIEWS PARITY & LOW-TEXT SPEC)

> 💡 **NGUYÊN TẮC THỊ GIÁC & NGỮ NGHĨA (VISUAL & CONTEXT SYNC)**:  
> - **Ít chữ, trực quan (Low-Text)**: Tiêu đề và nút bấm chỉ từ 1 - 2 từ ngắn gọn.  
> - **Đồng bộ Context (Zero Drift)**: Tên trường trên UI khớp 100% với DTO và State của `checked-backend`.

---

## MA TRẬN 23 MÀN HÌNH & GIAO DIỆN (ĐỒNG BỘ CONTEXT & ÍT CHỮ)

| STT | Tên Màn hình / Modal | URL Tuyến đường | Tiêu đề tối giản (UI Copy) | Nút bấm chính (Action) | State / DTO đồng bộ |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **LoginView** | `/login` | `Đăng nhập` | `Tiếp tục` | `AuthCredentials` |
| **2** | **RegisterView** | `/register` | `Đăng ký` | `Tạo tài khoản` | `RegisterRequest` |
| **3** | **OTPVerifyView** | `/verify-otp` | `Nhập mã 6 số` | Tự động submit | `VerifyOtpRequest` |
| **4** | **CompleteProfileView**| `/complete-profile` | `Hồ sơ của bạn` | `Bắt đầu` | `User.profileCompleted` |
| **5** | **HomeView & Camera** | `/` | Dropdown: `Tất cả` / `Bạn` | Nút chụp Matcha Glow | `PhotoPost[]`, `Friend[]` |
| **6** | **ImagePreviewView** | Modal trên `/` | Gemini Pill: `Phân tích AI` | `Gửi` | `PhotoUploadPayload` |
| **7** | **BillDetailSheet** | Sheet | `Hóa đơn` | `Xong` | `BillData` (items, amount) |
| **8** | **FoodEditSheet** | Sheet | `Món ăn` | `Lưu` | `FoodRecognitionData` |
| **9** | **CalorieEditSheet** | Sheet | `Calo & Đa lượng` | `Xong` | `calories, protein, carbs` |
| **10**| **PriceEditSheet** | Sheet | `Gắn giá tiền` | `Xong` | `amount` (VNĐ) |
| **11**| **LocationEditSheet** | Sheet | `Địa điểm` | `Chọn` | `locationName` |
| **12**| **HistoryPhotoGridView**| `/history` | Dropdown: `Tất cả` | Đóng `✕` | `PhotoPost[]` (history) |
| **13**| **PhotoDetailView** | Modal/Overlay | Tên người gửi (`senderName`)| Emoji React / Chat | `PhotoReaction`, `Message` |
| **14**| **ExpenseDashboardView**| `/expense` | `Chi tiêu` | `< Tháng 10 >` | `CashflowSummary` |
| **15**| **BudgetSettingSheet**| Sheet | `Hạn mức tháng` | `Lưu hạn mức` | `MonthlyBudget` |
| **16**| **CalorieDashboardView**| `/calorie` | `Năng lượng` | `+ Thêm món` | `CalorieDailyLog` |
| **17**| **CalorieGoalSettingSheet**| Sheet | `Mục tiêu ngày` | `Lưu mục tiêu` | `dailyTargetCalories` |
| **18**| **QuickAddCalorieSheet**| Sheet | `Thêm món ăn` | `Thêm` | `MealEntry` |
| **19**| **FriendshipListView**| `/messages` | `Tin nhắn` | `+ Thêm bạn` | `FriendChatItem[]` |
| **20**| **ChatView** | `/messages/[id]` | Tên bạn bè (`partnerName`) | `Gửi` / `Thu hồi` | `ChatMessage[]` (STOMP) |
| **21**| **FriendInviteView** | `/invite` | `Mã kết bạn` | `Chia sẻ link` | `inviteToken, inviteUrl` |
| **22**| **FriendInviteAcceptView**| `/invite/[token]` | `Lời mời kết bạn` | `Đồng ý kết bạn`| `acceptInvite(token)` |
| **23**| **FriendRequestsView**| `/friends/requests` | `Lời mời` (Đến / Đi) | `Chấp nhận` / `Từ chối`| `FriendRequestItem[]` |
| **24**| **UserProfileView** | `/u/[username]` | `@username` | `Kết bạn` / `Nhắn tin` | `UserProfileResponse` |
| **25**| **MutualFriendsSheet**| Sheet | `Bạn chung` | Đóng `✕` | `mutualFriends: Friend[]` |
| **26**| **QrScannerView** | `/scan` | `Quét mã QR` | Đóng `✕` | Quét URL $\rightarrow$ Deep link |
| **27**| **BlockedUsersView** | `/settings/blocked` | `Đã chặn` | `Bỏ chặn` | `blockedUsers: Friend[]` |
| **28**| **ProfileView** | `/profile` | `Hồ sơ cá nhân` | `Cài đặt ⚙` | `User` profile & stats |
| **29**| **SettingsView** | `/settings` | `Cài đặt` | `Đăng xuất` | Cài đặt ứng dụng & Auth |
