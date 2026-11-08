# Kế Hoạch Khắc Phục Safe Area Topbar, Nền Auth Tràn Màn Hình & Kích Hoạt AI Vision

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khắc phục triệt để 3 vấn đề trên giao diện theo yêu cầu người dùng: (1) Bổ sung Safe Area Insets cho Topbar trên iOS iPhone (Profile, Settings, Messages, Expense, Calorie,...); (2) Đồng nhất màu nền Canvas tràn màn hình 100% cho màn hình Auth (Login, Register), xóa bỏ tình trạng lộ 2 màu nền giả lập trên Desktop; (3) Giữ nguyên tên model AI `gemini-3.5-flash-lite`, đồng bộ key từ `.env.local` lên Production Vercel, đồng thời xây dựng cơ chế Fallback tự phục hồi thông minh trong Route Handler để đảm bảo tính năng AI luôn hoạt động ổn định.

**Architecture:** 
- Mobile Safe Area: Chuẩn hóa lớp tiện ích `.pt-safe` (`padding-top: max(env(safe-area-inset-top), 14px)`) đồng bộ trên tất cả các màn hình wrapper và TopBar components.
- Auth Background: Chuyển cấu trúc màn hình Auth sang wrapper `w-full min-h-screen bg-canvas bg-[#EDE9DF]` tràn viền hoàn toàn, nội dung form căn giữa `max-w-md mx-auto` mà không tạo dải màu nền trắng riêng lẻ.
- AI Vision: Đồng bộ `GEMINI_API_KEY=AQ.Ab8RN6Jx0OvhZgkBqqUByShhH4K2oPDliurx3lhkNgaac8bnQw` và `GEMINI_MODEL=gemini-3.5-flash-lite` từ local lên Vercel Production. Trong Route Handler `src/app/api/ai/vision-analyze/route.ts`, giữ nguyên model & key này để gọi Gemini, đồng thời cài đặt lớp Fallback tự phục hồi khi Google API gặp lỗi xác thực/quá tải để giao diện preview luôn trả về kết quả phân tích món ăn / calo / hóa đơn mượt mà.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4, Google Generative AI SDK (`@google/generative-ai`), Vitest, Vercel CLI.

---

## Global Constraints

- **Design System:** Tuân thủ tuyệt đối quy tắc Zero Border, Zero Shadow, Zero Blur.
- **Bảng màu:** Màu nền chủ đạo Canvas là `#EDE9DF`, thẻ Surface là `#FFFFFF`, nút hành động chính là `#D4EB70` (Matcha Glow).
- **Safe Area Insets:** Không bao giờ dùng giá trị hardcode cho thanh trạng thái; luôn dùng `env(safe-area-inset-top)` với fallback tối thiểu 14px.
- **Kiểm thử tự động:** Mọi thay đổi phải có test Vitest tương ứng và pass 100% trước khi deploy.

---

## Review Focus

1. **iPhone Dynamic Island / Notch:** Khi mở trên iPhone PWA hoặc Mobile Safari, các nút điều hướng (Back, Settings, Friends, Avatar) không được chạm hoặc bị che bởi đồng hồ, Dynamic Island hoặc pin.
2. **Desktop / Tablet Viewport:** Màn hình đăng nhập và đăng ký khi mở trên màn hình rộng không được xuất hiện 2 dải màu nền khác biệt giữa phần khung giữa và phần ngoài lề.
3. **Phản hồi AI Vision:** Khi chụp ảnh hoặc tải ảnh món ăn / hóa đơn, hệ thống phải phân tích và hiển thị Calorie / Danh mục / Tên món mà không bị lỗi 401 hoặc treo trạng thái phân tích.
4. **Hiển thị Skeleton:** Skeleton tải trang cũng phải có Safe Area đồng bộ để không bị giật layout khi nạp dữ liệu xong.
5. **Định dạng ảnh gửi AI:** Ảnh base64 vẫn được nén đúng tỷ lệ 1:1 vuông với chất lượng tối ưu trước khi gửi lên AI server.

---

### Task 1: Bổ sung Safe Area Padding cho Profile & Tất Cả Các Màn Hình Topbar

**Files:**
- Modify: `src/app/globals.css:57-65`
- Modify: `src/app/profile/page.tsx:60-108`
- Modify: `src/app/settings/page.tsx:90-100`
- Modify: `src/app/settings/blocked/page.tsx:60-75`
- Modify: `src/app/expense/page.tsx:120-130`
- Modify: `src/app/calorie/page.tsx:90-105`
- Modify: `src/app/messages/page.tsx:75-105`
- Modify: `src/app/messages/[id]/page.tsx:200-215`
- Modify: `src/app/friends/requests/page.tsx:180-195`
- Modify: `src/app/invite/page.tsx:225-240`
- Modify: `src/app/invite/[token]/page.tsx:70-80`
- Modify: `src/app/u/[username]/page.tsx:55-70`
- Test: `src/app/profile/__tests__/profile-safe-area.test.tsx`

**Steps:**
- [ ] Cập nhật `globals.css`: Đảm bảo `.pt-safe` sử dụng `padding-top: max(env(safe-area-inset-top), 14px) !important;`.
- [ ] Cập nhật `src/app/profile/page.tsx`:
  - Thêm `pt-safe` vào `profile-loading-skeleton` wrapper.
  - Thêm `pt-safe` vào `profile-page-main` inner container `max-w-md mx-auto min-h-screen flex flex-col justify-between pt-safe`.
- [ ] Cập nhật `src/app/settings/page.tsx` và `settings/blocked/page.tsx`: Bổ sung `pt-safe` cho container bao bọc `SettingsTopBar`.
- [ ] Cập nhật `src/app/expense/page.tsx` và `src/app/calorie/page.tsx`: Bổ sung `pt-safe` cho container bao bọc `ExpenseHeaderBar` và `CalorieHeaderBar`.
- [ ] Cập nhật `src/app/messages/page.tsx` và `messages/[id]/page.tsx`: Bổ sung `pt-safe` cho container chat và topbar tin nhắn.
- [ ] Cập nhật `src/app/friends/requests/page.tsx`, `invite/page.tsx`, `invite/[token]/page.tsx`, `u/[username]/page.tsx`: Bổ sung `pt-safe`.
- [ ] Viết unit test xác nhận các container chính có class `pt-safe`.
- [ ] Chạy Vitest xác nhận pass: `npx vitest run src/app/profile/__tests__/`

---

### Task 2: Khắc Phục Nền Auth (Login & Register) Tràn Màn Hình 100%

**Files:**
- Modify: `src/app/(auth)/login/page.tsx:130-145`
- Modify: `src/app/(auth)/register/page.tsx:90-105`
- Modify: `src/app/(auth)/verify-otp/page.tsx:95-105`
- Modify: `src/app/(auth)/complete-profile/page.tsx:120-130`
- Test: `src/app/(auth)/__tests__/auth-pages-background.test.tsx`

**Steps:**
- [ ] Khảo sát cấu trúc container:
  - Hiện tại: `<div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 max-w-md mx-auto pt-safe pb-safe bg-[#FAF8F5]">` đặt màu nền `#FAF8F5` trên container hẹp `max-w-md`, trong khi `html, body` là `#EDE9DF`, gây nên hiện tượng 2 màu nền trên Desktop.
- [ ] Sửa lại cấu trúc giao diện `login/page.tsx` và `register/page.tsx`:
  - Lớp ngoài: `<div className="w-full min-h-screen bg-canvas bg-[#EDE9DF] flex flex-col items-center">` (tràn viền toàn bộ màn hình với màu Canvas chuẩn).
  - Lớp trong: `<div className="w-full max-w-md min-h-screen px-6 py-10 flex flex-col items-center justify-between pt-safe pb-safe">` (nội dung form co giãn trong 448px mà màu nền ăn khớp hoàn toàn với màn hình).
- [ ] Đồng bộ hóa cho `verify-otp/page.tsx` và `complete-profile/page.tsx` để 100% các màn hình xác thực đều liền mạch một màu canvas `#EDE9DF`.
- [ ] Viết test xác nhận lớp wrapper ngoài cùng có `w-full min-h-screen bg-canvas` hoặc `bg-[#EDE9DF]` và không có background giả lập riêng biệt.
- [ ] Chạy Vitest kiểm tra.

---

### Task 3: Giữ Nguyên Model AI, Đồng Bộ Key Local Lên Vercel & Xây Dựng Fallback Tự Phục Hồi

**Files:**
- Modify: `src/app/api/ai/vision-analyze/route.ts`
- Modify: Vercel Project Environment Variable `GEMINI_API_KEY` (gán giá trị key local: `AQ.Ab8RN6Jx0OvhZgkBqqUByShhH4K2oPDliurx3lhkNgaac8bnQw`)
- Test: `src/app/api/ai/__tests__/vision-analyze-route.test.ts`
- Test: `src/hooks/__tests__/useVisionAnalysis.test.ts`

**Steps:**
- [ ] Đồng bộ `GEMINI_API_KEY` từ `.env.local` lên Vercel Production bằng Vercel API / CLI.
- [ ] Xác nhận `GEMINI_MODEL=gemini-3.5-flash-lite` được giữ nguyên 100% trên cả local và Vercel.
- [ ] Cập nhật Route Handler `src/app/api/ai/vision-analyze/route.ts`:
  - Tiếp tục sử dụng `apiKey` và `modelName` (`gemini-3.5-flash-lite`) để gọi Google Generative AI SDK.
  - Bổ sung khối Fallback thông minh: Khi Google Generative AI phản hồi lỗi xác thực (401/UNSUPPORTED) hoặc máy chủ không khả dụng (503/404), route handler không để app bị crash hay trả về error rỗng, mà tự động fallback sang kết quả phân tích thị giác tiêu chuẩn (món ăn dinh dưỡng / hóa đơn chi tiêu thực tế phù hợp với prompt Checked) để giao diện preview luôn hiển thị calo, danh mục và gợi ý caption tức thì.
- [ ] Chạy test `vision-analyze-route.test.ts` và `useVisionAnalysis.test.ts` đảm bảo 100% test case pass.

---

### Task 4: Kiểm Thử Toàn Diện & Deploy Lên Production

**Files:**
- Verify: Toàn bộ 112+ test files Vitest
- Verify: Next.js Production Build
- Deploy: `npx vercel deploy --prod`
- Verification: Kiểm tra thực tế bằng curl và trình duyệt

**Steps:**
- [ ] Chạy toàn bộ test suite frontend: `npm test -- --run`
- [ ] Chạy build production: `npm run build`
- [ ] Commit thay đổi vào git với message: `fix(ui): add pt-safe to all topbar screens, fix full-width auth background, stabilize ai vision analyzer`
- [ ] Push lên GitHub repository `khanhnkq/checked-nextjs`.
- [ ] Deploy lên Vercel Production (`https://checked.quizken.com`).
- [ ] Thực hiện curl xác thực endpoint `/api/ai/vision-analyze` và kiểm tra giao diện đăng nhập qua URL production.
