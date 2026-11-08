# Kế hoạch Triển khai Tự động Cập nhật PWA khi Deploy (Next.js 15 & iOS Standalone)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống tự động phát hiện và áp dụng bản cập nhật PWA mới nhất ngay sau mỗi lần deploy lên Vercel, hoạt động tối ưu trên cả iOS Safari Standalone (Màn hình chính iPhone) và trình duyệt máy tính/Android, loại bỏ triệt để lỗi kẹt cache cũ và lỗi Next.js ChunkLoadError.

**Architecture:** Kiến trúc cập nhật 4 tầng (Multi-layer Auto-Update Engine):
1. **Edge/Build Layer**: Script build tự động đóng dấu version độc nhất (`BUILD_ID` / Git SHA + Timestamp) vào `public/sw.js` và `public/version.json`; cấu hình `next.config.ts` cấm cache (`Cache-Control: no-cache, no-store, must-revalidate`) cho các file service worker và version.
2. **Service Worker Layer (`sw.js`)**: Triển khai `skipWaiting()` và `clients.claim()` kích hoạt ngay lập tức khi phát hiện file SW bị thay đổi byte, tự động dọn dẹp các cache bucket cũ và xử lý lỗi redirect cache của WebKit iOS.
3. **Client Detection Layer (`PwaUpdateManager.tsx`)**: Lắng nghe vòng đời PWA đa kênh: `onupdatefound`, `controllerchange`, `visibilitychange` (khi mở lại app trên iPhone), kiểm tra định kỳ 15 phút, và bắt lỗi `ChunkLoadError` để tự động khôi phục.
4. **UX Layer**: Banner thông báo cập nhật dạng Pill tối giản (chuẩn thẩm mỹ Checked: Zero Border, Zero Shadow, `#FAF8F5`), nút "Cập nhật" tải lại mượt mà, và mục chẩn đoán "Kiểm tra cập nhật" trong màn hình Cài đặt.

**Tech Stack:** Next.js 15 (App Router), React 19, Service Worker API, TypeScript, Vitest, Tailwind CSS.

**Spec:** Thiết kế chi tiết theo cơ chế cập nhật chuẩn PWA WebKit iOS & Chromium, tuân thủ nghiêm ngặt quy chuẩn Checked Design System (Zero Border, Zero Shadow, Zero Blur, Báo gấm).

## Global Constraints
- Không thêm thư viện ngoài nặng nề hoặc lỗi thời (không dùng `next-pwa` cũ gây conflict React 19/Turbopack); sử dụng Native Service Worker chuẩn hóa zero-dependency.
- `public/sw.js` bắt buộc phải khác byte giữa các lần deploy (byte-different) để trình duyệt nhận diện được sự thay đổi.
- Header HTTP cho `/sw.js` và `/version.json` phải là `Cache-Control: no-cache, no-store, must-revalidate`.
- Mọi giao diện thông báo cập nhật phải tuân thủ triệt để Zero Border, Zero Shadow, tone màu Oat Milk `#EDE9DF` và thẻ `#FAF8F5`.

## Review Focus
- **Input/Condition 1 (iOS Standalone Backgrounding)**: Khi người dùng iPhone mở app từ màn hình chính sau khi app bị suspend trong background, sự kiện `visibilitychange` phải tự động kích hoạt `registration.update()` và kiểm tra `version.json` mà không cần đóng hẳn app.
- **Input/Condition 2 (Next.js Chunk Mismatch)**: Khi deploy bản mới, các chunk JS cũ bị xóa khỏi CDN Vercel. Nếu user đang thao tác gọi chunk mới bị 404, listener lỗi toàn cục phải tự động reload trang sạch sẽ thay vì đứng im màn hình trắng.
- **Input/Condition 3 (Vercel Edge Caching)**: Vercel CDN không được phép giữ cache của `sw.js` dù chỉ 1 giây; mỗi request fetch `/sw.js` phải luôn trả về code mới nhất.
- **Input/Condition 4 (Non-intrusive Form Protection)**: Nếu người dùng đang gõ tin nhắn hoặc đang ở màn hình camera/đăng bài, thông báo cập nhật dạng Pill hiển thị nhẹ nhàng, chỉ reload khi người dùng bấm "Cập nhật" hoặc khi chuyển trang/mở lại app.
- **Input/Condition 5 (Offline Resiliency)**: Khi mất kết nối mạng, Service Worker vẫn fallback về trang `/offline` bình thường, không liên tục báo lỗi update.

---

### Task 1: Tạo Script Tạo Bản Đồ Phiên Bản Tự Động khi Build (`scripts/generate-sw.mjs`)

**Files:**
- Create: `scripts/generate-sw.mjs`
- Modify: `package.json`
- Test: `scripts/__tests__/generate-sw.test.mjs`

- [ ] **Step 1: Viết test kiểm tra logic sinh version và file SW**
  Tạo `scripts/__tests__/generate-sw.test.mjs` kiểm tra:
  - Script tạo ra `public/version.json` chứa `version`, `builtAt`, `gitCommit`.
  - Script tạo ra `public/sw.js` chứa chuỗi `CACHE_NAME` duy nhất với version tương ứng, có `skipWaiting()` và `clients.claim()`.
- [ ] **Step 2: Chạy test để xác nhận test thất bại (Red)**
  ```bash
  node --test scripts/__tests__/generate-sw.test.mjs
  ```
- [ ] **Step 3: Hiện thực `scripts/generate-sw.mjs`**
  - Lấy hash từ `process.env.VERCEL_GIT_COMMIT_SHA` hoặc sinh timestamp `build-${Date.now()}`.
  - Ghi file `public/version.json`.
  - Template hóa `public/sw.js` tối ưu hóa cho iOS WebKit & Android (dọn dẹp cache cũ, cache tài nguyên tĩnh, bỏ qua cache redirect lỗi trên iOS).
- [ ] **Step 4: Cập nhật `package.json`**
  Thêm `prebuild: "node scripts/generate-sw.mjs"` vào `scripts` của `package.json` để tự động chạy trước mọi lệnh `npm run build`.
- [ ] **Step 5: Chạy test và xác nhận pass (Green)**
  ```bash
  node scripts/generate-sw.mjs
  node --test scripts/__tests__/generate-sw.test.mjs
  ```
- [ ] **Step 6: Commit thay đổi Task 1**
  ```bash
  git add scripts/ package.json public/
  git commit -m "feat(pwa): add dynamic service worker and version generation at build time"
  ```

---

### Task 2: Cấu Hình Cache-Control Headers Cho PWA Trong `next.config.ts`

**Files:**
- Modify: `next.config.ts`
- Test: `src/config/__tests__/pwa-headers.test.ts`

- [ ] **Step 1: Viết test cho headers của next.config.ts**
  Tạo `src/config/__tests__/pwa-headers.test.ts` kiểm tra:
  - Header cho `/sw.js` chứa `Cache-Control: no-cache, no-store, must-revalidate`.
  - Header cho `/version.json` chứa `Cache-Control: no-cache, no-store, must-revalidate`.
- [ ] **Step 2: Chạy test xác nhận fail**
  ```bash
  npx vitest run src/config/__tests__/pwa-headers.test.ts
  ```
- [ ] **Step 3: Cập nhật `next.config.ts`**
  Bổ sung async `headers()` trong `nextConfig`:
  ```ts
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
      {
        source: '/version.json',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  }
  ```
- [ ] **Step 4: Chạy test xác nhận pass (Green)**
  ```bash
  npx vitest run src/config/__tests__/pwa-headers.test.ts
  ```
- [ ] **Step 5: Commit thay đổi Task 2**
  ```bash
  git add next.config.ts src/config/__tests__/pwa-headers.test.ts
  git commit -m "feat(pwa): configure zero-cache headers for sw.js and version.json"
  ```

---

### Task 3: Xây Dựng `PwaUpdateManager` (Phát Hiện Bản Mới & Khôi Phục ChunkLoadError)

**Files:**
- Create: `src/components/pwa/PwaUpdateManager.tsx`
- Modify: `src/components/pwa/index.ts`
- Modify: `src/app/layout.tsx`
- Test: `src/components/pwa/__tests__/PwaUpdateManager.test.tsx`

- [ ] **Step 1: Viết test cho `PwaUpdateManager`**
  Kiểm tra:
  - Tự động gọi `navigator.serviceWorker.register('/sw.js')`.
  - Lắng nghe sự kiện `visibilitychange`: khi tab trở lại `visible`, kiểm tra version và trigger `update()`.
  - Hiển thị UI Toast/Pill khi phát hiện bản mới (`hasUpdate === true`).
  - Khi người dùng bấm nút "Cập nhật", gọi `window.location.reload()`.
  - Bắt lỗi `ChunkLoadError` từ `window.onerror` hoặc unhandledrejection để reload trang.
- [ ] **Step 2: Chạy test xác nhận fail**
  ```bash
  npx vitest run src/components/pwa/__tests__/PwaUpdateManager.test.tsx
  ```
- [ ] **Step 3: Hiện thực `PwaUpdateManager.tsx`**
  - Quản trị state: `hasUpdate`, `isUpdating`, `newVersion`.
  - Polling định kỳ mỗi 15 phút khi người dùng mở app.
  - UI Pill chuẩn phong cách Checked (vị trí `top-4` hoặc ngay dưới Safe Area, không shadow, viền sạch sẽ, nút điểm nhấn Lime `#D9E872`).
- [ ] **Step 4: Tích hợp vào `src/app/layout.tsx`**
  Thay thế component `ServiceWorkerRegister` cũ bằng `PwaUpdateManager`.
- [ ] **Step 5: Chạy test xác nhận pass (Green)**
  ```bash
  npx vitest run src/components/pwa/__tests__/PwaUpdateManager.test.tsx
  ```
- [ ] **Step 6: Commit thay đổi Task 3**
  ```bash
  git add src/components/pwa/ src/app/layout.tsx
  git commit -m "feat(pwa): implement PwaUpdateManager with auto-recovery and update pill UI"
  ```

---

### Task 4: Bổ Sung Nút "Kiểm Tra Cập Nhật" Trong Màn Hình Cài Đặt (`/settings`)

**Files:**
- Modify: `src/app/settings/page.tsx`
- Test: `src/app/settings/__tests__/settings-version-check.test.tsx`

- [ ] **Step 1: Viết test cho nút kiểm tra phiên bản trong Settings**
  Kiểm tra:
  - Hiển thị phiên bản hiện tại (ví dụ: `v1.0.0 (Build 2026.11.08)`).
  - Có nút bấm "Kiểm tra cập nhật".
  - Khi bấm, hiển thị trạng thái "Đang kiểm tra..." và thông báo "Bạn đang ở phiên bản mới nhất" hoặc "Có bản cập nhật mới!".
- [ ] **Step 2: Chạy test xác nhận fail**
  ```bash
  npx vitest run src/app/settings/__tests__/settings-version-check.test.tsx
  ```
- [ ] **Step 3: Cập nhật `src/app/settings/page.tsx`**
  Thêm khối Thông tin phiên bản vào màn hình Settings với phong cách danh sách tối giản của Checked.
- [ ] **Step 4: Chạy test xác nhận pass (Green)**
  ```bash
  npx vitest run src/app/settings/__tests__/settings-version-check.test.tsx
  ```
- [ ] **Step 5: Commit thay đổi Task 4**
  ```bash
  git add src/app/settings/
  git commit -m "feat(settings): add app version display and manual update check button"
  ```

---

### Task 5: Kiểm Thử Toàn Diện, Build Production và Triển Khai Lên Vercel

**Files:**
- All modified files

- [ ] **Step 1: Chạy toàn bộ test suite của dự án**
  ```bash
  npm run test
  ```
- [ ] **Step 2: Chạy production build kiểm tra script sinh SW tự động**
  ```bash
  npm run build
  ```
  Xác nhận file `public/sw.js` và `public/version.json` được sinh ra với timestamp/hash mới.
- [ ] **Step 3: Push lên GitHub origin main**
  ```bash
  git push origin main
  ```
- [ ] **Step 4: Deploy lên Vercel Production**
  ```bash
  npx --yes vercel deploy --prod
  ```
- [ ] **Step 5: Kiểm tra live trên `https://checked.quizken.com`**
  - Kiểm tra `curl -i https://checked.quizken.com/sw.js` trả về header `Cache-Control: no-cache, no-store, must-revalidate`.
  - Kiểm tra `curl https://checked.quizken.com/version.json` trả về version JSON chuẩn xác.
