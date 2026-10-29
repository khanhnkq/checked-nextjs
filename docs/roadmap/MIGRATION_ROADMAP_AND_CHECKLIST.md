# 🗺️ MIGRATION ROADMAP & IMPLEMENTATION CHECKLIST

Tài liệu này xác định lộ trình 10 giai đoạn triển khai chi tiết, tiêu chí kiểm thử từng giai đoạn (Acceptance Criteria) và các cổng chất lượng (Quality Gates) cho dự án Checked Web (`checked-nextjs`).

---

## 🛡️ CỔNG CHẤT LƯỢNG KỸ THUẬT BẮT BUỘC (MANDATORY QUALITY GATES)

Mọi dòng code được viết trong dự án phải vượt qua 5 cổng kiểm định sau:
1. **Zero Blur & Zero Shadow**: Tuyệt đối không dùng class `blur-*`, `backdrop-blur-*`, `shadow-*`, `drop-shadow-*`. Thay bằng Tonal Contrast và Crisp Solid Borders.
2. **SOLID Principles**: Tuân thủ triệt để Đơn trách nhiệm, Mở/Đóng, Khả năng thay thế Liskov, Phân tách giao diện và Đảo ngược phụ thuộc.
3. **Giới Hạn File Cứng $\le 700$ Dòng**: Không có bất kỳ file `.ts`, `.tsx`, `.css` nào được vượt quá 700 dòng code. Khi chạm 500 dòng phải chủ động chia nhỏ.
4. **DRY (Zero Duplication)**: Không trùng lặp code, gom chung logic vào `src/lib/utils/` và `src/components/common/`.
5. **TDD Flow & Test Coverage $\ge 90\%$**: Viết Unit Test trước (Red) $\rightarrow$ Viết code (Green) $\rightarrow$ Tối ưu (Refactor) cho mọi logic tài chính, calo, STOMP.

---

## 📋 MA TRẬN 10 GIAI ĐOẠN TRIỂN KHAI

```text
[Phase 1: Project Scaffolding & Design Tokens] 
       ↓
[Phase 2: Authentication & Route Guards] 
       ↓
[Phase 3: Web Camera 1:1 & Viewfinder Experience] 
       ↓
[Phase 4: Gemini AI Vision, Tags & Sticker Cutout] 
       ↓
[Phase 5: History Grid & Vertical Photo Swipe] 
       ↓
[Phase 6: Expense Dashboard & Cashflow Engine] 
       ↓
[Phase 7: Calorie Dashboard & Macronutrients] 
       ↓
[Phase 8: Realtime STOMP WebSocket Chat] 
       ↓
[Phase 9: Friendship, QR Scanner & Deep Links] 
       ↓
[Phase 10: PWA Standalone, Performance & Quality Gates]
```

---

## 1. CHI TIẾT TỪNG GIAI ĐOẠN

### Phase 1: Khởi Tạo Dự Án, Design Tokens & Cấu Trúc Khung
- [ ] Khởi tạo dự án Next.js 15+ App Router với TypeScript và ESLint tại `/Users/nguyenkimquockhanh/Desktop/checked-nextjs`.
- [ ] Cài đặt các gói cốt lõi: `tailwindcss`, `lucide-react`, `framer-motion`, `zustand`, `@tanstack/react-query`, `@stomp/stompjs`, `sockjs-client`, `clsx`, `tailwind-merge`, `idb-keyval`, `qrcode.react`.
- [ ] Thiết lập bảng màu `@theme` trong Tailwind v4: `canvas` (`#EDE9DF`), `primary` (`#D4EB70`), `dark-surface` (`#141613`), `surface` (`#FFFFFF`), `surface-subtle` (`#DFDACD`).
- [ ] Xây dựng các UI Primitives dùng chung (Zero Blur/Shadow): `PrimaryButton`, `CircleIconButton`, `CustomTextField`, `SkeletonBone`, `BaseBottomSheet`.
- [ ] Cài đặt môi trường kiểm thử TDD: `vitest`, `@testing-library/react`, `msw`.
- *Tiêu chuẩn hoàn thành*: `npm run test` và `npm run build` thành công; trang hiển thị đúng nền kem Oat Milk ấm áp.

### Phase 2: Xác Thực & Quản Lý Phiên Làm Việc (Auth Flow)
- [ ] TDD: Viết test case cho `useAuthStore` (login, logout, silent refresh, token expiry).
- [ ] Triển khai `useAuthStore` (Zustand) và logic lưu trữ token trong bộ nhớ RAM + Secure Cookie.
- [ ] Tạo 4 màn hình: `/login`, `/register`, `/verify-otp` (6 ô số tự động chuyển focus), `/complete-profile` (tải avatar).
- [ ] Cấu hình Route Guard / Middleware bảo vệ các trang protected.
- *Tiêu chuẩn hoàn thành*: Đăng ký tài khoản mới $\rightarrow$ Nhập OTP $\rightarrow$ Cập nhật tên và avatar $\rightarrow$ Vào Home.

### Phase 3: Camera WebRTC 1:1 & Khung Ngắm Locket
- [ ] TDD: Viết test case cho hàm cắt ảnh vuông `cropToSquare` và tính toán zoom constraint.
- [ ] Tạo `CameraViewfinder.tsx` với luồng video 1:1 bo góc `32px`, viền sắc sảo `border-2 border-[#141613]`.
- [ ] Nút chụp Matcha Glow $80x80px$ kèm hiệu ứng cơ học co nảy `scale-90` và rung xúc giác `vibrate(25)`.
- [ ] Nút lật camera trước/sau (`facingMode`) và nút chuyển đổi zoom $0.5x \leftrightarrow 1.0x$.
- [ ] Input tải ảnh từ thư viện thiết bị kèm cắt ảnh vuông.
- [ ] Thanh Top Bar nổi gồm Avatar cá nhân, Pill Dropdown chọn bộ lọc bạn bè, và icon Tin nhắn.
- *Tiêu chuẩn hoàn thành*: Hoạt động mượt mà trên Safari iOS và Android Chrome; chụp ra ảnh vuông chuẩn $1080 \times 1080$.

### Phase 4: Gemini AI Vision, Tag System & Sticker Cutout
- [ ] Tạo `ImagePreviewView.tsx` khớp hoàn toàn khung hình $1:1$ với camera vừa chụp.
- [ ] Thanh con nhộng Gemini Brand Pill với viền gradient phẳng 4 màu chuyển động xoay tròn.
- [ ] Tích hợp API Route `/api/ai/vision-analyze` gọi Google Gemini Flash nhận diện Hóa đơn hoặc Món ăn Việt Nam.
- [ ] Triển khai 5 Bottom Sheets phẳng (Solid borders): `BillDetailSheet`, `FoodEditSheet`, `CalorieEditSheet`, `PriceEditSheet`, `LocationEditSheet`.
- [ ] Triển khai hiệu ứng bóc tách vật thể món ăn Sticker cutout và hiệu ứng bụi phân rã Thanos Snap.
- [ ] Gọi API `POST /api/v1/photos` (Multipart) gửi bài đăng lên backend.
- *Tiêu chuẩn hoàn thành*: Chụp hóa đơn $\rightarrow$ Tự động bóc tách tổng tiền và tên quán $\rightarrow$ Bấm Gửi $\rightarrow$ Ảnh xuất hiện trong Feed.

### Phase 5: Lưới Lịch Sử & Xem Ảnh Chi Tiết Vuốt Dọc
- [ ] Xây dựng `HistoryPhotoGridView.tsx`: Lưới 3 cột Locket-style, khoảng cách $6px$, cuộn vô tận, lọc theo bạn bè.
- [ ] Xây dựng `PhotoDetailView.tsx`: Vuốt dọc chuyển ảnh mượt mà bằng Framer Motion.
- [ ] Triển khai `EmojiBurstEngine`: Thả biểu tượng cảm xúc bắn tung tóe hạt emoji lên màn hình.
- [ ] Khung chat phản hồi nhanh trực tiếp đến người gửi ảnh.
- *Tiêu chuẩn hoàn thành*: Vuốt mượt trên màn hình cảm ứng điện thoại, chạm emoji thấy hiệu ứng hạt bay sống động.

### Phase 6: Bảng Điều Khiển Chi Tiêu & Dòng Tiền (Expense Module)
- [ ] TDD: Viết test case cho `calculateCashflowSummary`, tính toán chi tiêu và phân chia tiền `splitBill`.
- [ ] Xây dựng `/expense`: Bộ chuyển tháng trước/sau, Thẻ dòng tiền (Thu, Chi, Net Cashflow).
- [ ] Vòng tròn tiến độ ngân sách tháng, đổi màu cam/đỏ khi vượt ngưỡng cảnh báo.
- [ ] Biểu đồ phân bổ tỷ lệ phần trăm theo danh mục chi tiêu.
- [ ] Danh sách giao dịch theo ngày, bấm vào phóng to ảnh hóa đơn gốc.
- [ ] Xây dựng `BudgetSettingSheet.tsx` cài đặt hạn mức và mục tiêu tiết kiệm.
- *Tiêu chuẩn hoàn thành*: Số liệu chi tiêu đồng bộ tức thì sau khi đăng ảnh hóa đơn mới.

### Phase 7: Bảng Điều Khiển Dinh Dưỡng & Năng Lượng (Calorie Module)
- [ ] TDD: Viết test case cho `MealType.current()` theo các mốc thời gian và tính toán tổng macros.
- [ ] Xây dựng `/calorie`: Vòng tiến trình calo nạp vào vs Mục tiêu ngày.
- [ ] Thanh đo 3 chỉ số đa lượng Protein (Đạm), Carbs (Đường bột), Fat (Chất béo).
- [ ] Danh mục 4 bữa ăn (Sáng, Trưa, Tối, Phụ) tự động nhận diện bữa ăn theo đồng hồ thực.
- [ ] Xây dựng `CalorieGoalSettingSheet.tsx` và `QuickAddCalorieSheet.tsx`.
- *Tiêu chuẩn hoàn thành*: Tự động cập nhật calo từ các món ăn đã chụp trong ngày; thêm nhanh món ăn thủ công thành công.

### Phase 8: Nhắn Tin Thời Gian Thực STOMP WebSocket
- [ ] TDD: Viết test case cho Stomp client connection, message serialize/deserialize, và typing timeout.
- [ ] Thiết lập kết nối STOMP Client qua SockJS đến endpoint backend `/ws-chat`.
- [ ] Xây dựng `/messages`: Danh sách cuộc trò chuyện, huy hiệu tin chưa đọc, thanh quota bạn thân.
- [ ] Xây dựng `/messages/[id]`: Gửi/nhận tin nhắn tức thì, hiển thị ảnh đính kèm, trích dẫn trả lời, thu hồi tin nhắn.
- [ ] Hiệu ứng đối phương đang soạn thảo `isPartnerTyping`.
- *Tiêu chuẩn hoàn thành*: Chat qua lại giữa 2 cửa sổ trình duyệt độ trễ $< 200ms$ không cần tải lại trang.

### Phase 9: Đồ Thị Xã Hội, Lời Mời Kết Bạn & Quét Mã QR
- [ ] Xây dựng `/invite`: Mã QR vector cá nhân, sao chép link mời, gọi Web Share API.
- [ ] Xây dựng `/invite/[token]`: Tiếp nhận link mời kết bạn từ bên ngoài, xem trước hồ sơ.
- [ ] Xây dựng `/friends/requests`: Duyệt lời mời đến và quản lý lời mời đã gửi đi.
- [ ] Xây dựng `/u/[username]`: Trang cá nhân người dùng, xem bạn chung, kết bạn, hủy bạn, chặn.
- [ ] Xây dựng `/scan`: Quét mã QR bằng camera để tự động mở kết bạn.
- *Tiêu chuẩn hoàn thành*: Quét mã QR từ điện thoại này sang điện thoại khác kết bạn thành công.

### Phase 10: Tối Ưu PWA, Cảm Ứng Di Động & Nghiệm Thu Toàn Diện
- [ ] Cấu hình Web App Manifest, Service Worker, hỗ trợ Standalone Mode không thanh URL.
- [ ] Khóa zoom màn hình ngoài ý muốn (`user-scalable=no, viewport-fit=cover`).
- [ ] Tích hợp safe-area insets cho notch tai thỏ và home indicator.
- [ ] Tích hợp rung xúc giác haptic feedback (`navigator.vibrate`).
- [ ] Linter & File Length Audit: Đảm bảo 100% file $\le 700$ dòng và không có blur/shadow.
- [ ] Audit Lighthouse (Hiệu năng $> 90$, Accessibility $> 95$, PWA passed).
- *Tiêu chuẩn hoàn thành*: Trải nghiệm trên thiết bị di động mượt mà, phản hồi cảm ứng như ứng dụng native.

---

## 2. CHẾ ĐỘ NGHIÊM NGẶT: "CHƯA ĐƯỢC CODE" (SPECIFICATION-FIRST GATE)

Theo chỉ thị của người dùng:
> **TUYỆT ĐỐI CHƯA ĐƯỢC TẠO FILE MÃ NGUỒN (`.ts`, `.tsx`, `.js`, `package.json`,...) TRONG DỰ ÁN CHO ĐẾN KHI NGƯỜI DÙNG DUYỆT XONG TÀI LIỆU VÀ YÊU CẦU TIẾN HÀNH.**
