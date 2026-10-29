# 🚀 DETAILED SPRINT PLAN - CHECKED NEXT.JS CLIENT UI

> **Dự án**: Checked Web Client UI (Next.js 15+ App Router)  
> **Phương pháp quản lý**: Agile/Scrum kết hợp Test-Driven Development (TDD)  
> **Quy chuẩn bắt buộc**:  
> - 🚫 **Zero Blur & Zero Shadow** (Chỉ dùng Tonal Contrast & Solid Crisp Borders).  
> - 📏 **Max 700 lines/file** (Refactor chủ động khi chạm 500 dòng).  
> - 🧩 **Chuẩn S.O.L.I.D & DRY** (Không code trùng, phân tách đơn trách nhiệm).  
> - ✍️ **Giao diện tối giản chữ (Low-Text UI, Microcopy $\le 3$ từ)**.  
> - 🧪 **Test Coverage $\ge 90\%$** cho toàn bộ logic cốt lõi.

---

## 📅 TỔNG QUAN LỘ TRÌNH 6 SPRINTS

```text
┌────────────────────────────────────────────────────────────────────────┐
│ SPRINT 1: Nền tảng, Design Tokens, Auth Flow & Primitives (Tuần 1)     │
├────────────────────────────────────────────────────────────────────────┤
│ SPRINT 2: Khung Camera 1:1, Lưới Lịch Sử & Vuốt Ảnh Dọc (Tuần 2)       │
├────────────────────────────────────────────────────────────────────────┤
│ SPRINT 3: Gemini AI Vision, Hệ Thống Tag & Thanos Snap (Tuần 3)       │
├────────────────────────────────────────────────────────────────────────┤
│ SPRINT 4: Dashboard Tài Chính & Năng Lượng Dinh Dưỡng (Tuần 4)         │
├────────────────────────────────────────────────────────────────────────┤
│ SPRINT 5: STOMP WebSocket Chat Realtime & Đồ Thị Bạn Bè (Tuần 5)       │
├────────────────────────────────────────────────────────────────────────┤
│ SPRINT 6: PWA Standalone, Tối Ưu Mobile, Audit & Quality Gates (Tuần 6)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏃 SPRINT 1: NỀN TẢNG, DESIGN TOKENS, AUTH FLOW & PRIMITIVES

### 🎯 Mục Tiêu Sprint (Sprint Goal)
Thiết lập toàn bộ khung dự án Next.js 15+, hệ thống Design Tokens phẳng (Zero Blur/Shadow), môi trường kiểm thử TDD (Vitest + MSW), các UI Primitives dùng chung và hoàn thiện 100% luồng xác thực (Login, Register, OTP 6 số, Complete Profile).

### 📋 Danh Sách User Stories & Tasks

#### US1.1: Khởi Tạo Dự Án & Cấu Hình Design Tokens
- **Task 1.1.1**: Khởi tạo Next.js 15 App Router với TypeScript, ESLint, PostCSS và Tailwind CSS v4.
- **Task 1.1.2**: Cài đặt các gói phụ thuộc: `zustand`, `@tanstack/react-query`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`, `idb-keyval`.
- **Task 1.1.3**: Thiết lập `@theme` trong Tailwind v4 chứa toàn bộ màu sắc Oat Milk (`#EDE9DF`), Matcha Glow (`#D4EB70`), Sand Dust (`#DFDACD`), Obsidian Black (`#141613`).
- **Task 1.1.4**: Cấu hình Typography rounded (`Plus Jakarta Sans`) và clean body (`Inter`).

#### US1.2: Thiết Lập Môi Trường Kiểm Thử TDD
- **Task 1.2.1**: Cài đặt `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`.
- **Task 1.2.2**: Cấu hình Vitest runner và MSW handlers để mock API auth.

#### US1.3: Xây Dựng UI Primitives Phẳng (Zero Blur, Zero Shadow)
- **Task 1.3.1**: `PrimaryButton`: Nút chính màu Matcha Glow `#D4EB70`, bo tròn, viền `border border-[#141613]/10`, hiệu ứng `active:scale-95`.
- **Task 1.3.2**: `CircleIconButton`: Nút tròn 44x44px và 52x52px, nền `#FFFFFF` hoặc `#DFDACD`, viền sắc nét, icon màu đen.
- **Task 1.3.3**: `CustomTextField`: Ô nhập văn bản nền `#F2F2F4`, viền `border border-[#141613]/10`, focus viền Matcha `border-[#D4EB70]`.
- **Task 1.3.4**: `SkeletonBone`: Khung xương nhấp nháy phẳng đơn sắc (Flat pulse).
- **Task 1.3.5**: `BaseBottomSheet`: Đáy kéo phẳng nền trắng, viền trên `border-t border-[#141613]/10`, hỗ trợ vuốt xuống để đóng.

#### US1.4: Phân Hệ Xác Thực Chuẩn TDD (Auth Flow)
- **Task 1.4.1 (TDD Red)**: Viết test suite cho `useAuthStore` (login, logout, silent refresh, token storage).
- **Task 1.4.2 (TDD Green)**: Cài đặt `useAuthStore` bằng Zustand kết hợp cookie an toàn và IndexedDB.
- **Task 1.4.3**: Màn hình `/login`: Tiêu đề `Đăng nhập`, ô email/password, nút `Đăng nhập`, liên kết `Tạo tài khoản`.
- **Task 1.4.4**: Màn hình `/register`: Tiêu đề `Đăng ký`, 3 ô nhập, nút `Tiếp tục`.
- **Task 1.4.5**: Màn hình `/verify-otp`: Tiêu đề `Nhập mã 6 số`, 6 ô tự nhảy focus và hỗ trợ paste, nút `Gửi lại mã`.
- **Task 1.4.6**: Màn hình `/complete-profile`: Tiêu đề `Hồ sơ của bạn`, upload avatar, nhập `displayName`, nút `Bắt đầu`.
- **Task 1.4.7**: Middleware Route Guard: Bảo vệ các trang private, tự động chuyển hướng người dùng chưa đăng nhập.

### 🧪 Kịch Bản TDD Bắt Buộc
- Test đăng nhập thành công lưu token vào RAM và cookie.
- Test tự động chuyển sang `/verify-otp` nếu `isVerified = false`.
- Test tự động chuyển sang `/complete-profile` nếu `profileCompleted = false`.
- Test 6 ô OTP tự nhảy focus khi gõ số và khi paste chuỗi 6 ký tự.

### 🏁 Tiêu Chí Hoàn Thành (Definition of Done - DoD)
- Toàn bộ test pass 100% (`npm run test`).
- Không có bất kỳ class `shadow-*` hay `blur-*` nào.
- Mọi file code $< 700$ dòng.
- Đăng ký $\rightarrow$ Nhập OTP $\rightarrow$ Tạo Profile $\rightarrow$ Vào Home thành công.

---

## 🏃 SPRINT 2: KHUNG CAMERA 1:1, LƯỚI LỊCH SỬ & VUỐT ẢNH DỌC

### 🎯 Mục Tiêu Sprint (Sprint Goal)
Tái hiện trải nghiệm chụp ảnh ống kính vuông 1:1 chuẩn Locket, nút chụp Matcha Glow, bộ lọc bạn bè Pill Dropdown, thẻ bạn bè xếp chồng 3D và lưới lịch sử ảnh 3 cột có trình xem ảnh vuốt dọc.

### 📋 Danh Sách User Stories & Tasks

#### US2.1: Camera WebRTC Ống Kính Vuông 1:1 (`CameraViewfinder`)
- **Task 2.1.1 (TDD Red)**: Viết test cho hàm cắt ảnh vuông `cropToSquare` và tính toán constraints zoom.
- **Task 2.1.2 (TDD Green)**: Cài đặt hook `useCamera` quản lý `MediaStream`, `facingMode`, `torch` và `zoom`.
- **Task 2.1.3**: Xây dựng khung camera vuông 1:1 (`aspect-square`), bo góc `rounded-[32px]`, viền cơ học `border-2 border-[#141613]`.
- **Task 2.1.4**: Nút Flash/Torch góc trên bên trái: Bật/tắt đèn trợ sáng (nếu thiết bị hỗ trợ).
- **Task 2.1.5**: Nút Zoom góc trên bên phải: Chuyển đổi $0.5x \leftrightarrow 1.0x$ kèm cử chỉ chụm 2 ngón tay pinch-to-zoom.

#### US2.2: Cụm Điều Khiển Dưới (Bottom Controls)
- **Task 2.2.1**: Nút Chụp Matcha Glow $80x80px$: Lõi trong $70x70px$ `#D4EB70`, co nảy cơ học `scale-90`, rung haptic `vibrate(25)`.
- **Task 2.2.2**: Xuất frame hiện tại từ video sang Canvas thành ảnh JPEG 1080x1080.
- **Task 2.2.3**: Nút Thư viện Ảnh: Mở chọn file từ máy, tự động cắt vuông `cropToSquare`.
- **Task 2.2.4**: Nút Lật Camera: Chuyển đổi mượt mà camera trước/sau.
- **Task 2.2.5**: Nhãn mở Lịch sử: `Lịch sử` kèm icon mũi tên xuống `ChevronDown`.

#### US2.3: Thanh Điều Hướng Nổi Top Bar & Pill Dropdown (`HomeTopBar`)
- **Task 2.3.1**: Avatar tròn bên trái $38x38px$, bấm mở `/profile`.
- **Task 2.3.2**: Nút Chat bên phải $44x44px$ kèm huy hiệu số tin chưa đọc, bấm mở `/messages`.
- **Task 2.3.3**: Cụm giữa Pill Dropdown: Hiển thị `Tất cả` / `Bạn` / Tên bạn bè.
- **Task 2.3.4**: Floating Popover Menu phẳng: Danh sách bạn bè kèm avatar, mục cố định `+ Thêm bạn`.

#### US2.4: Thẻ Bạn Bè Xếp Chồng 3D (`StackedFriendCardsView`)
- **Task 2.4.1**: 3 thẻ ảnh nghiêng theo góc $0^\circ, -3^\circ, +3^\circ$ viền cơ học, bấm vào mở `/history`.

#### US2.5: Lưới Lịch Sử Ảnh Locket & Xem Ảnh Vuốt Dọc
- **Task 2.5.1**: Màn hình `/history`: Lưới ảnh 3 cột đều nhau, khoảng cách $6px$, cuộn vô tận.
- **Task 2.5.2**: Bộ lọc theo người gửi (Tất cả, Bạn, Từng bạn bè).
- **Task 2.5.3**: `PhotoDetailView`: Vuốt dọc chuyển ảnh (Snap vertical scroll), hiển thị thông tin người gửi và thời gian.

### 🧪 Kịch Bản TDD Bắt Buộc
- Test hàm `cropToSquare` cắt chính xác ảnh tỷ lệ 1:1 từ ảnh chữ nhật ngang và dọc.
- Test toggle camera chuyển đổi đúng giữa `'user'` và `'environment'`.
- Test lọc ảnh lịch sử trả về chính xác danh sách bài đăng theo `senderId`.

### 🏁 Tiêu Chí Hoàn Thành (DoD)
- Khung camera hiển thị sắc nét trên Safari iOS / Chrome Android.
- Bấm chụp hoặc chọn ảnh từ máy tạo ra ảnh vuông chính xác.
- Vuốt dọc chuyển ảnh trong PhotoDetailView hoạt động mượt mà $60fps$.

---

## 🏃 SPRINT 3: GEMINI AI VISION, HỆ THỐNG TAG & THANOS SNAP

### 🎯 Mục Tiêu Sprint (Sprint Goal)
Tích hợp Google Gemini Flash nhận diện hóa đơn và món ăn Việt Nam, bóc tách sticker món ăn, hiệu ứng phân rã hạt bụi Thanos Snap, 5 Sheet chỉnh sửa và tính năng thả Emoji Reactions nổ hạt.

### 📋 Danh Sách User Stories & Tasks

#### US3.1: Màn Hình Xem Trước Ảnh (`ImagePreviewView`)
- **Task 3.1.1**: Khung ảnh vuông 1:1 trùng khít hoàn toàn với camera vừa chụp.
- **Task 3.1.2**: Gemini Brand Pill: Thanh con nhộng phẳng viền gradient 4 màu xoay tròn nhịp nhàng.
- **Task 3.1.3**: Tự động kích hoạt Geolocation HTML5 để lấy tên quán ăn / địa chỉ.

#### US3.2: Tích Hợp Google Gemini Flash API (`/api/ai/vision-analyze`)
- **Task 3.2.1 (TDD Red)**: Viết test mock cho API Route Gemini với 3 kịch bản: Hóa đơn (BILL), Món ăn (FOOD), và Ảnh thường (NORMAL).
- **Task 3.2.2 (TDD Green)**: Triển khai Route Handler Next.js gọi Google GenAI SDK với System Prompt tiếng Việt chuẩn.
- **Task 3.2.3**: Xử lý nén ảnh về kích thước $800 \times 800$ trước khi gửi lên AI để phản hồi $< 1.5s$.

#### US3.3: Hệ Thống 5 Bottom Sheets Chỉnh Sửa Phẳng
- **Task 3.3.1**: `BillDetailSheet`: Tên quán, số tiền lớn, danh sách món, tính năng chia tiền (`splitBill`).
- **Task 3.3.2**: `FoodEditSheet`: Tên món ăn Việt Nam, nhóm danh mục (Cơm, Phở, Đồ uống...).
- **Task 3.3.3**: `CalorieEditSheet`: Số calo, 3 chỉ số Đạm/Đường bột/Chất béo.
- **Task 3.3.4**: `PriceEditSheet`: Bàn phím số lớn gắn thẻ giá tiền nhanh (VNĐ).
- **Task 3.3.5**: `LocationEditSheet`: Làm mới vị trí GPS hoặc tìm kiếm quán ăn.

#### US3.4: Bóc Tách Sticker & Hiệu Ứng Thanos Snap Canvas
- **Task 3.4.1**: Tách nền vật thể món ăn tạo viền trắng sticker.
- **Task 3.4.2**: `ThanosSnapEngine`: Canvas 2D lấy pixel món ăn, phân tán thành các hạt bụi bay mờ dần trong $1.2s$.
- **Task 3.4.3**: Nút hoàn tác Time Stone xanh ngọc bảo khôi phục lại món ăn nếu xóa nhầm.

#### US3.5: Đăng Ảnh & Thả Cảm Xúc Emoji Nổ Hạt (`EmojiBurstEngine`)
- **Task 3.5.1**: Tích hợp `POST /api/v1/photos` (Multipart) gửi ảnh kèm số tiền chi tiêu lên máy chủ.
- **Task 3.5.2**: `EmojiBurstEngine`: Khi bấm thả tim/haha, 20 hạt emoji bay tung tóe theo đường parabol.
- **Task 3.5.3**: Tích hợp API thả và đếm reactions thời gian thực.

### 🧪 Kịch Bản TDD Bắt Buộc
- Test parser JSON phản hồi từ Gemini trích xuất chính xác `merchantName`, `totalAmount`, `calories`.
- Test thuật toán chia tiền `splitBill` chia đều và chia lẻ không lệch 1 đồng.
- Test API upload multipart gửi đúng boundary và metadata.

### 🏁 Tiêu Chí Hoàn Thành (DoD)
- Chụp hóa đơn cà phê $\rightarrow$ Tự động bóc tách số tiền và tên quán $\rightarrow$ Gửi lên backend thành công.
- Hiệu ứng Thanos Snap và Emoji Burst chạy mượt không tụt FPS.

---

## 🏃 SPRINT 4: DASHBOARD TÀI CHÍNH & NĂNG LƯỢNG DINH DƯỠNG

### 🎯 Mục Tiêu Sprint (Sprint Goal)
Xây dựng Dashboard Chi tiêu & Dòng tiền tháng và Dashboard Dinh dưỡng Calo theo 4 khung giờ thực tế, với phong cách tối giản chữ, số liệu trực quan và zero blur/shadow.

### 📋 Danh Sách User Stories & Tasks

#### US4.1: Dashboard Chi Tiêu & Dòng Tiền (`/expense`)
- **Task 4.1.1 (TDD Red)**: Viết test cho logic tính dòng tiền `calculateCashflowSummary` và kiểm tra ngưỡng vượt ngân sách.
- **Task 4.1.2 (TDD Green)**: Xây dựng service tính toán chi tiêu và tích hợp API `GET /api/v1/expenses/summary`.
- **Task 4.1.3**: Bộ chuyển tháng: `< Tháng 10, 2026 >`, đồng bộ `monthKey: "YYYY-MM"`.
- **Task 4.1.4**: Thẻ Dòng tiền phẳng: Thu nhập xanh lá `#4E8752`, Chi tiêu đen đậm `#141613`, Dòng tiền ròng con số lớn.
- **Task 4.1.5**: Vòng ngân sách phẳng: Đổi màu Cam khi đạt $80\%$, Đỏ khi vượt hạn mức.
- **Task 4.1.6**: Danh mục chi tiêu: Tỷ lệ phần trăm và icon đặc trưng.
- **Task 4.1.7**: Danh sách giao dịch: Thumbnail bill vuông, bấm vào phóng to đối soát.
- **Task 4.1.8**: `BudgetSettingSheet`: Cài đặt hạn mức tháng và mục tiêu tiết kiệm.

#### US4.2: Dashboard Năng Lượng & Calo (`/calorie`)
- **Task 4.2.1 (TDD Red)**: Viết test cho `MealType.current()` xác định chính xác bữa ăn theo đồng hồ máy.
- **Task 4.2.2 (TDD Green)**: Cài đặt logic phân loại 4 bữa ăn: Sáng (`05:00 - 10:30`), Trưa (`10:30 - 14:30`), Phụ (`14:30 - 17:00`), Tối (`17:00 - 21:30`).
- **Task 4.2.3**: Vòng năng lượng ngày: Số calo nạp vào vs Mục tiêu ngày (kcal).
- **Task 4.2.4**: Thanh đo 3 chỉ số đa lượng: Đạm (Protein), Đường bột (Carbs), Chất béo (Fat).
- **Task 4.2.5**: Phân nhóm bữa ăn theo thời gian thực: Tự động gắn tag bữa ăn cho ảnh chụp.
- **Task 4.2.6**: `CalorieGoalSettingSheet`: Điều chỉnh mục tiêu calo ngày.
- **Task 4.2.7**: `QuickAddCalorieSheet`: Thêm nhanh món ăn thủ công không cần chụp ảnh.

### 🧪 Kịch Bản TDD Bắt Buộc
- Test `MealType.current()` với các mốc giờ: 07:00 (Breakfast), 12:30 (Lunch), 15:30 (Snack), 19:00 (Dinner), 23:00 (Snack).
- Test vòng ngân sách tính toán chính xác phần trăm và cờ `budgetExceeded`.

### 🏁 Tiêu Chí Hoàn Thành (DoD)
- Dữ liệu chi tiêu và calo cập nhật tự động ngay khi có ảnh mới.
- Giao diện đạt chuẩn Low-Text: Chỉ con số to, nhãn 1-2 từ, không có đoạn văn giải thích.

---

## 🏃 SPRINT 5: STOMP WEBSOCKET CHAT REALTIME & ĐỒ THỊ BẠN BÈ

### 🎯 Mục Tiêu Sprint (Sprint Goal)
Tích hợp STOMP WebSocket chat 1-1 thời gian thực với Spring Boot broker, chỉ báo typing, phản hồi trích dẫn, thu hồi tin nhắn, mã QR cá nhân, deep link mời kết bạn và quét mã QR.

### 📋 Danh Sách User Stories & Tasks

#### US5.1: Kết Nối STOMP WebSocket & Danh Sách Hội Thoại (`/messages`)
- **Task 5.1.1 (TDD Red)**: Viết test cho STOMP Client (connect, subscribe, reconnect backoff).
- **Task 5.1.2 (TDD Green)**: Cài đặt `StompWebSocketService` bọc `@stomp/stompjs` và SockJS endpoint `/ws-chat`.
- **Task 5.1.3**: Xây dựng `/messages`: Thanh quota bạn thân `12/20 Bạn thân`, thẻ lời mời mới `2 Lời mời mới →`, danh sách cuộc trò chuyện.
- **Task 5.1.4**: Cập nhật badge số tin nhắn chưa đọc trên Top Bar thời gian thực.

#### US5.2: Phòng Chat 1-1 Thời Gian Thực (`/messages/[id]`)
- **Task 5.2.1**: Bong bóng tin nhắn phẳng (Mine màu Matcha Glow, Partner màu xám `#F2F2F4`).
- **Task 5.2.2**: Bong bóng ảnh hóa đơn / món ăn vuông $18px$, chạm vào phóng to.
- **Task 5.2.3**: Chỉ báo đang soạn thảo (`isPartnerTyping`): 3 chấm nhấp nháy động dạng sóng.
- **Task 5.2.4**: Trích dẫn trả lời (Quote reply).
- **Task 5.2.5**: Thu hồi tin nhắn (`Revoke for everyone`) và Xóa phía tôi (`Delete for me`).

#### US5.3: Mời Bạn Bè, Mã QR & Deep Links (`/invite`)
- **Task 5.3.1**: Màn hình `/invite`: Mã QR vector sắc nét, nút `Sao chép link` và nút `Chia sẻ`.
- **Task 5.3.2**: Trang tiếp nhận deep link `/invite/[token]`: Xem trước hồ sơ người mời, nút `Đồng ý kết bạn`.
- **Task 5.3.3**: Màn hình `/friends/requests`: 2 Tab `Đã nhận` (Đồng ý/Từ chối) & `Đã gửi` (Hủy).
- **Task 5.3.4**: Trang cá nhân người khác `/u/[username]` & `MutualFriendsSheet` (bạn chung).
- **Task 5.3.5**: Quét mã QR `/scan`: Dùng camera quét mã QR tự động mở trang kết bạn.

### 🧪 Kịch Bản TDD Bắt Buộc
- Test nhận tin nhắn qua kênh `/user/queue/messages` cập nhật ngay vào danh sách tin nhắn.
- Test chỉ báo typing tự động tắt sau 3 giây không gõ tiếp.
- Test deep link token giải mã chính xác và gọi API accept friendship.

### 🏁 Tiêu Chí Hoàn Thành (DoD)
- Chat qua lại giữa 2 trình duyệt không có độ trễ ($< 200ms$).
- Quét mã QR từ điện thoại này sang điện thoại khác kết bạn thành công.

---

## 🏃 SPRINT 6: PWA STANDALONE, TỐI ƯU MOBILE, AUDIT & QUALITY GATES

### 🎯 Mục Tiêu Sprint (Sprint Goal)
Hoàn thiện trải nghiệm PWA Standalone không thanh URL, cấu hình Service Worker, khóa zoom ngoài ý muốn, audit toàn bộ code tuân thủ 5 Quality Gates (Zero Blur/Shadow, Max 700 lines, SOLID, DRY, TDD).

### 📋 Danh Sách User Stories & Tasks

#### US6.1: Cấu Hình PWA & Mobile Web Experience
- **Task 6.1.1**: Tạo `manifest.json` đầy đủ icons, `display: standalone`, `theme_color: #EDE9DF`, `background_color: #EDE9DF`.
- **Task 6.1.2**: Cấu hình Service Worker cache tài nguyên tĩnh và IndexedDB offline cache.
- **Task 6.1.3**: Khóa zoom layout ngoài ý muốn: `user-scalable=no, viewport-fit=cover`.
- **Task 6.1.4**: Căn chỉnh chuẩn an toàn theo `env(safe-area-inset-top)` và `env(safe-area-inset-bottom)`.
- **Task 6.1.5**: Tích hợp rung phản hồi haptic `navigator.vibrate` cho nút chụp và các nút chính.

#### US6.2: Hồ Sơ Cá Nhân & Cài Đặt (`/profile` & `/settings`)
- **Task 6.2.1**: Màn hình `/profile`: 3 con số lớn (`18 Bạn thân`, `14 Ngày streak`, `3.4M Đã chi`), lưới ảnh cá nhân.
- **Task 6.2.2**: Màn hình `/settings`: Chỉnh sửa tên hiển thị, đổi mật khẩu, danh sách chặn `/settings/blocked`.
- **Task 6.2.3**: Nút `Đăng xuất` màu đỏ san hô: Xóa session, cookie, IndexedDB và điều hướng về `/login`.

#### US6.3: Audit Chất Lượng & Kiểm Định Nghiêm Ngặt (Quality Gates)
- **Task 6.3.1 (Linter & Line Check Script)**: Chạy script kiểm tra 100% file code không có file nào $> 700$ dòng.
- **Task 6.3.2 (Visual Check)**: Quét toàn bộ codebase đảm bảo 0 class `blur-*` và 0 class `shadow-*`.
- **Task 6.3.3 (Test Coverage)**: Chạy toàn bộ test suites đạt độ bao phủ $\ge 90\%$.
- **Task 6.3.4 (Lighthouse Audit)**: Điểm Performance $> 90$, Accessibility $> 95$, PWA Passed.

### 🏁 Tiêu Chí Nghiệm Thu Tổng Thể (Final Project DoD)
- Toàn bộ 23 màn hình và sheet hoạt động mượt mà, đồng bộ context tuyệt đối với Backend.
- Đạt chuẩn giao diện Low-Text: ít chữ, dễ hiểu, trực quan.
- Ứng dụng cài đặt được lên màn hình chính điện thoại như Native App.

