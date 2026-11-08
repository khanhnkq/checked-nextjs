# Kế Hoạch Triển Khai Checked Next.js Lên Nền Tảng Vercel (Production & Preview)

> **Dành cho kỹ sư / Agentic Workers:** YÊU CẦU SUB-SKILL: Sử dụng `superpowers:subagent-driven-development` hoặc `superpowers:executing-plans` để thực thi kế hoạch theo từng nhiệm vụ (Task-by-Task). Các bước sử dụng cú pháp checkbox (`- [ ]`) để dễ dàng theo dõi tiến độ.

**Mục tiêu:** Triển khai hoàn chỉnh ứng dụng web `checked-nextjs` lên nền tảng **Vercel** cho cả môi trường Production và Preview, kết nối liền mạch với Spring Boot Backend trên Heroku (`https://heroku-7usd-5a73e86b5b14.herokuapp.com`), hệ thống STOMP WebSocket chat realtime, và Google Gemini Vision AI Serverless Route Handler.

**Kiến trúc:** 
- Frontend: Next.js 15 App Router (React 19) triển khai trên hạ tầng Vercel Fluid Compute / Edge Network.
- Backend Kết nối: REST API & WebSocket STOMP chạy trên Heroku dyno qua HTTPS/WSS.
- AI Vision Serverless: Route Handler `/api/ai/vision-analyze` bảo mật `GEMINI_API_KEY` phía server, timeout mở rộng 30-60s.
- Tự động hóa CI/CD: Vercel Git Integration liên kết với GitHub repository `khanhnkq/checked-nextjs`.

**Công nghệ sử dụng:** Next.js 15.1.7, React 19, Vercel Platform, Spring Boot 3.3 (Heroku), STOMP WebSocket, Google Generative AI SDK, Tailwind CSS v4, TanStack Query v5, Vitest.

---

## Ràng Buộc Toàn Cục (Global Constraints)

1. **Tuyệt đối không làm gãy Test Suite**: 100% kiểm thử hiện tại (112 test files, 869 tests) phải tiếp tục PASS.
2. **Bảo mật tuyệt đối biến môi trường bí mật**: `GEMINI_API_KEY`, `SESSION_COOKIE_SECRET` chỉ tồn tại ở Server-side environment variables trên Vercel Dashboard, tuyệt đối không prefix `NEXT_PUBLIC_` và không commit vào git.
3. **Chống Mixed Content**: 100% request từ client Vercel (`https://`) tới Backend và WebSocket đều phải chạy qua giao thức mã hóa an toàn (`https://` và `wss://`).
4. **CORS & WebSocket Origin Patterns**: Backend Heroku bắt buộc cho phép nguồn gốc (Allowed Origins) từ Vercel preview URLs (`https://*.vercel.app`) và production domain (`https://checked.app` hoặc subdomain chính).
5. **Ngôn ngữ thiết kế Checked**: Duy trì nghiêm ngặt tôn chỉ **Zero Border, Zero Shadow, Zero Blur**.

---

## Tiêu Điểm Rà Soát (Review Focus)

1. **CORS / Preflight Failure**: Client Vercel gọi API Heroku bị chặn do thiếu cấu hình `APP_CORS_ALLOWED_ORIGINS` trên Heroku.
2. **WebSocket WSS Handshake Failure**: STOMP over SockJS trên Vercel HTTPS không kết nối được tới `wss://heroku-7usd-5a73e86b5b14.herokuapp.com/ws-chat` do CORS hoặc cấu hình transport.
3. **Serverless Function Timeout**: Gemini Vision OCR xử lý ảnh lớn vượt quá thời gian mặc định 10s của Vercel Hobby plan (cần cấu hình `maxDuration = 30` hoặc `60`).
4. **Hydration & SSR Crash do LocalStorage / Cookie**: Token hoặc preferences đọc trước khi mounted gây mismatch SSR / Client.
5. **Image Remote Patterns**: Ảnh avatar, ảnh feed từ backend/S3 bị Next/Image chặn nếu chưa khai báo domain trong `next.config.ts`.

---

## Danh Sách Nhiệm Vụ Chi Tiết (Tasks Breakdown)

### Task 1: Chuẩn bị Cấu hình Dự án & Production Optimization
**Trọng tâm:** Thêm file `vercel.json` cấu hình security headers, caching, runtime functions, và tối ưu hóa `next.config.ts`.

**Files:**
- Tạo mới: `vercel.json`
- Chỉnh sửa: `next.config.ts`
- Chỉnh sửa: `src/app/api/ai/vision-analyze/route.ts` (bổ sung `export const maxDuration = 30;`)

- [ ] **Bước 1:** Tạo file `vercel.json` tại thư mục gốc `checked-nextjs` với các cấu hình:
  - Framework: `nextjs`
  - Clean URLs: `true`
  - Function memory & duration: `/api/ai/vision-analyze` gán `maxDuration: 30` (hoặc `60`)
  - Security Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), microphone=(), geolocation=(self)`.
- [ ] **Bước 2:** Cập nhật `next.config.ts`:
  - Khai báo đầy đủ `remotePatterns` cho ảnh đại diện và ảnh chụp từ Heroku, Cloudinary, AWS S3, Google User Content, và `*.herokuapp.com`.
  - Tối ưu `poweredByHeader: false` để tăng cường bảo mật.
- [ ] **Bước 3:** Cập nhật `src/app/api/ai/vision-analyze/route.ts` thêm `export const maxDuration = 30;` để hỗ trợ Vercel Serverless Function Fluid Compute.
- [ ] **Bước 4:** Chạy kiểm tra build cục bộ `npm run build` và `npm test` để xác nhận cấu hình không gây lỗi.
- [ ] **Bước 5:** Tạo commit git: `chore(vercel): add vercel.json, optimize next.config.ts and function maxDuration`.

---

### Task 2: Đồng bộ Cấu hình Backend Heroku (CORS & WebSocket Origins)
**Trọng tâm:** Đảm bảo Spring Boot backend trên Heroku chấp nhận các request REST và kết nối WebSocket từ domain Vercel.

**Files:**
- Tài liệu / Cấu hình Heroku Dyno (`checked-backend`)
- Tham chiếu: `checked-backend/src/main/java/com/codegym/locketclone/common/config/CorsConfig.java`
- Tham chiếu: `checked-backend/src/main/java/com/codegym/locketclone/common/config/WebSocketConfig.java`

- [ ] **Bước 1:** Kiểm tra cấu hình hiện tại của `app.cors.allowed-origins` trong backend:
  - Hiện tại: `@Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")`
  - Backend sử dụng `configuration.setAllowedOriginPatterns(origins)` -> Hỗ trợ wildcard `https://*.vercel.app`.
- [ ] **Bước 2:** Cập nhật biến môi trường trên Heroku qua Heroku CLI:
  ```bash
  heroku config:set APP_CORS_ALLOWED_ORIGINS="http://localhost:3000,https://*.vercel.app,https://checked.app,https://checked-nextjs.vercel.app" -a heroku-7usd-5a73e86b5b14
  ```
- [ ] **Bước 3:** Khởi động lại Heroku dyno để nạp biến môi trường mới:
  ```bash
  heroku restart -a heroku-7usd-5a73e86b5b14
  ```
- [ ] **Bước 4:** Kiểm tra preflight OPTIONS request tới `https://heroku-7usd-5a73e86b5b14.herokuapp.com/api/v1/health` hoặc auth endpoint với header `Origin: https://checked-nextjs.vercel.app` để xác nhận trả về `Access-Control-Allow-Origin`.

---

### Task 3: Chuẩn bị Bảng Biến Môi Trường (Vercel Environment Variables)
**Trọng tâm:** Đặc tả danh mục biến môi trường chuẩn xác cho 3 môi trường: Production, Preview, và Development trên Vercel.

**Files:**
- Chỉnh sửa: `.env.example`
- Chỉnh sửa: `.env.production`

- [ ] **Bước 1:** Rà soát và cập nhật `.env.example` với đầy đủ mô tả chi tiết từng biến môi trường.
- [ ] **Bước 2:** Bảng tra cứu thiết lập trên Vercel Dashboard (`Settings -> Environment Variables`):

| Tên biến | Giá trị Production | Giá trị Preview | Scope | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://heroku-7usd-5a73e86b5b14.herokuapp.com/api/v1` | `https://heroku-7usd-5a73e86b5b14.herokuapp.com/api/v1` | Production, Preview | REST API Backend |
| `NEXT_PUBLIC_WS_URL` | `wss://heroku-7usd-5a73e86b5b14.herokuapp.com/ws-chat` | `wss://heroku-7usd-5a73e86b5b14.herokuapp.com/ws-chat` | Production, Preview | WebSocket Chat Broker |
| `NEXT_PUBLIC_APP_URL` | `https://checked.app` (hoặc domain Vercel chính) | Tự động hoặc `https://${VERCEL_URL}` | Production, Preview | Domain Web App |
| `NEXT_PUBLIC_ENABLE_DEBUG_LOGS` | `false` | `true` | Production, Preview | Bật/tắt log console client |
| `GEMINI_API_KEY` | *(Khóa bí mật từ Google AI Studio)* | *(Khóa bí mật từ Google AI Studio)* | Production, Preview, Dev | **Server-only secret** |
| `GEMINI_MODEL` | `gemini-2.0-flash` (hoặc `gemini-1.5-flash`) | `gemini-2.0-flash` | Production, Preview | Model Vision OCR |
| `GEMINI_TEMPERATURE` | `0.2` | `0.2` | Production, Preview | Độ chính xác OCR cao |
| `AI_VISION_LANGUAGE` | `vi` | `vi` | Production, Preview | Ngôn ngữ phân tích |
| `COOKIE_REFRESH_TOKEN_NAME` | `checked_refresh_token_prod` | `checked_refresh_token_preview` | Production, Preview | Tên cookie phiên |

- [ ] **Bước 3:** Commit các cập nhật tài liệu mẫu `.env.example`: `docs(env): update environment variables template for Vercel deployment`.

---

### Task 4: Đẩy Toàn Bộ Commits Lên GitHub Remote (`origin/main`)
**Trọng tâm:** Đồng bộ hóa nhánh `main` địa phương lên GitHub repository `khanhnkq/checked-nextjs`.

- [ ] **Bước 1:** Kiểm tra trạng thái git local:
  ```bash
  cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs
  git status
  ```
  Xác nhận đang ở nhánh `main`, working tree sạch sẽ.
- [ ] **Bước 2:** Đẩy 20 commit tính năng mới (bao gồm Chat 1-1, Settings screen, Vision OCR, Friends hub) lên GitHub:
  ```bash
  git push origin main
  ```
- [ ] **Bước 3:** Kiểm tra giao diện GitHub (`https://github.com/khanhnkq/checked-nextjs`) để xác nhận mã nguồn và các commit mới nhất đã xuất hiện trên nhánh `main`.

---

### Task 5: Liên Kết Dự Án Với Vercel & Thực Hiện Triển Khai (Deployment)
**Trọng tâm:** Tạo Project mới trên Vercel, cấu hình build settings, nhập biến môi trường, và kích hoạt build.

**Quy trình thực hiện:**
- [ ] **Cách 1 (Khuyến nghị - Qua Vercel Dashboard trực quan):**
  1. Truy cập [vercel.com/new](https://vercel.com/new).
  2. Chọn kết nối tài khoản GitHub `khanhnkq`, tìm repository `checked-nextjs`.
  3. Chọn **Import**.
  4. Tại mục **Configure Project**:
     - **Project Name**: `checked-nextjs` (hoặc `checked-app`).
     - **Framework Preset**: `Next.js` (tự động nhận diện).
     - **Root Directory**: `./` (thư mục gốc).
     - **Build Command**: `next build` (mặc định).
     - **Output Directory**: `.next` (mặc định).
     - **Install Command**: `npm install` (mặc định).
  5. Mở mục **Environment Variables**: Thêm đầy đủ 9 biến môi trường đã lập ở Task 3 (đặc biệt là `GEMINI_API_KEY`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WS_URL`).
  6. Nhấn nút **Deploy**.
  7. Theo dõi log quá trình build trực tiếp trên Vercel Dashboard cho đến khi xuất hiện màn hình pháo hoa ăn mừng (Congratulations!).

- [ ] **Cách 2 (Tự động hóa qua Vercel CLI):**
  1. Cài đặt hoặc chạy Vercel CLI:
     ```bash
     npx vercel login
     ```
  2. Liên kết dự án:
     ```bash
     npx vercel link
     ```
  3. Đẩy biến môi trường qua CLI:
     ```bash
     npx vercel env add GEMINI_API_KEY production
     npx vercel env add NEXT_PUBLIC_API_BASE_URL production
     npx vercel env add NEXT_PUBLIC_WS_URL production
     ```
  4. Triển khai trực tiếp:
     ```bash
     npx vercel deploy --prod
     ```

---

### Task 6: Kiểm Thử Toàn Diện Hậu Triển Khai (Post-Deployment E2E Verification)
**Trọng tâm:** Xác nhận mọi tính năng cốt lõi của ứng dụng hoạt động 100% trên URL triển khai Vercel thực tế.

- [ ] **Bước 1: Kiểm tra Route Guard & Trang Xác Thực**
  - Mở URL Vercel (ví dụ: `https://checked-nextjs.vercel.app`).
  - Chưa đăng nhập -> Tự động chuyển hướng về `/login`.
  - Đăng nhập bằng tài khoản thử nghiệm -> Lưu JWT cookie an toàn, chuyển hướng về trang chủ `/`.
- [ ] **Bước 2: Kiểm tra Tải Dữ Liệu Thực Từ Heroku Backend**
  - Trang chủ `/`: Nạp ảnh feed bạn bè, hiển thị badge số tin chưa đọc trên Top Bar.
  - Trang hồ sơ `/profile`: Hiển thị thông tin cá nhân, lịch sử streak, thống kê dinh dưỡng/chi tiêu.
  - Trang danh sách bạn bè `/messages`: Nạp danh sách bạn bè và cuộc trò chuyện gần nhất từ API `GET /api/v1/conversations`.
- [ ] **Bước 3: Kiểm tra Trò Chuyện Realtime STOMP WebSocket**
  - Vào phòng chat 1-1 `/messages/[friendId]`.
  - Mở DevTools Network tab -> Lọc thẻ `WS` -> Xác nhận kết nối thành công tới `wss://heroku-7usd-5a73e86b5b14.herokuapp.com/ws-chat` (trạng thái `101 Switching Protocols`).
  - Gửi tin nhắn -> Tin nhắn hiển thị ngay lập tức, đối phương nhận được realtime.
  - Đóng phòng chat -> Read receipt gửi thành công, badge số tin chưa đọc giảm về 0.
- [ ] **Bước 4: Kiểm tra Trích Xuất Hóa Đơn & Dinh Dưỡng Bằng Gemini Vision AI**
  - Vào chế độ chụp ảnh `/calorie` hoặc `/expense`.
  - Tải lên một hình ảnh món ăn hoặc hóa đơn mua sắm.
  - Kiểm tra request gửi tới Route Handler `/api/ai/vision-analyze` trên Vercel Serverless Function.
  - Xác nhận nhận kết quả JSON phân tích hợp lệ từ Google Gemini AI mà không bị timeout.
- [ ] **Bước 5: Kiểm tra Màn Hình Cài Đặt (`/settings`)**
  - Mở `/settings` từ trang cá nhân.
  - Thử cập nhật họ tên (Bottom Sheet), ngày sinh, và bật/tắt toggle switch âm thanh/rung.
  - Vào `/settings/blocked` -> Kiểm tra nạp danh sách chặn và nút bỏ chặn.
  - Bấm Đăng xuất -> Modal xác nhận hiển thị -> Xác nhận đăng xuất thành công và xóa session.
- [ ] **Bước 6: Đo Lường Hiệu Năng & Lighthouse**
  - Chạy Lighthouse audit trên trang Production:
    - Performance $\ge 90$
    - Accessibility $\ge 95$
    - Best Practices $\ge 95$
    - SEO $\ge 90$

---

## Tóm Tắt Các Bước Tiếp Theo Để Triển Khai Ngay

1. **Bước 1:** Cấu hình file `vercel.json` và cập nhật `next.config.ts`.
2. **Bước 2:** Cấu hình biến môi trường `APP_CORS_ALLOWED_ORIGINS` trên Heroku backend.
3. **Bước 3:** Đẩy toàn bộ commit `main` lên GitHub `origin/main`.
4. **Bước 4:** Import repo vào Vercel Dashboard, điền Environment Variables và bấm **Deploy**.
5. **Bước 5:** Chạy kiểm thử E2E trên domain Vercel.
