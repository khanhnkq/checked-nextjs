# Auth Fallback to Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chặn hoàn toàn việc người dùng chưa đăng nhập nhìn thấy hoặc tương tác với giao diện camera/feed riêng tư trên Root `/` và các trang bảo vệ (`/messages`, etc.), tự động chuyển hướng mượt mà về `/login` cả ở tầng Server Middleware, tầng Service Worker PWA, và tầng React Client Shell mà không bị chớp giật (flash) hay gọi quyền Camera/Vị trí sớm.

**Architecture:**
- **Server Middleware**: Cập nhật `src/middleware.ts` chuẩn hóa tập hợp Public Routes (`/login`, `/register`, `/verify-otp`, `/complete-profile`, `/offline`, `/invite/*`, `/u/*`). Với mọi protected route, nếu không có cookie `checked_token` hợp lệ, lập tức trả về HTTP 307 Redirect tới `/login` kèm tham số `redirect` an toàn.
- **Client Auth Gate Guard**: Nâng cấp `src/components/auth/AuthGate.tsx` để **chặn tuyệt đối việc render children** đối với private routes khi `!isHydrated` hoặc `!tokenValid`. Hiển thị Skeleton phẳng (`HomeSkeleton`) trong lúc kiểm tra hoặc điều hướng, ngăn chặn triệt để hiện tượng chớp nháy (flash) camera viewfinder / giao diện riêng tư và ngăn WebRTC camera gọi `startCamera()` sớm.
- **Root Home Guard & Defense-in-Depth**: Bổ sung `isHydrated` & `isAuthenticated` guard trực tiếp trong `src/app/page.tsx`, `src/app/messages/page.tsx` và `src/app/messages/[id]/page.tsx` để đảm bảo nếu trang được truy cập qua client-side router, component cũng không bao giờ khởi chạy camera hay truy vấn feed khi chưa đăng nhập.
- **PWA Service Worker**: Loại bỏ `'/'` khỏi `PRECACHE_ASSETS` trong `scripts/generate-sw.mjs` và `public/sw.js`. Định tuyến HTML navigation theo chiến lược Network-First và chỉ fallback về `/offline` khi mất mạng hoàn toàn, tuyệt đối không cache trang private `/` vào PWA shell offline.

**Tech Stack:** Next.js 15 (App Router), React 19, Zustand (persist middleware), TypeScript, Vitest, Service Worker API.

**Spec:** docs/superpowers/plans/2026-11-08-auth-fallback-to-login.md

## Global Constraints

- **Design Rules:** Zero Border, Zero Shadow, Zero Blur trên toàn bộ các thành phần fallback và skeleton.
- **Color Palette:** Giữ nguyên Oat Milk (#EDE9DF, #FAF8F5, #2C2825, Lime #D9E872).
- **No Infinite Loops:** Cookie và Store luôn đồng bộ; khi token hết hạn hoặc không hợp lệ, xóa sạch `checked_token` và state để tránh lặp redirect giữa `/` và `/login`.
- **Offline Integrity:** Khi mất mạng hoàn toàn, PWA phải fallback về `/offline`, không được crash hoặc hiển thị trang lỗi 500.

## Review Focus

1. **Khách truy cập Root `/` chưa đăng nhập:** Tuyệt đối không bật camera, không hiện hộp thoại xin quyền, không chớp màn hình Home, chuyển hướng tức thì về `/login`.
2. **PWA Standalone khởi động lại sau khi đăng xuất / hết hạn token:** Service Worker không được trả về shell cũ đã cache của `/`, mà phải điều hướng về `/login`.
3. **Deep links vào trang bảo vệ (`/messages`, `/settings`, `/profile`):** Tự động chuyển hướng về `/login?redirect=<path>` và sau khi đăng nhập thành công phải quay lại đúng trang đó.
4. **Public & Semi-public routes (`/invite/[token]`, `/u/[username]`, `/offline`):** Không bị chặn nhầm bởi AuthGate hay Middleware.
5. **Đăng xuất chủ động (Logout):** Xóa sạch cả localStorage và cookie `checked_token`, hủy stream camera ngay lập tức, chuyển hướng về `/login`.

---

### Task 1: Loại bỏ `'/'` khỏi Precache của Service Worker

**Files:**
- Modify: `scripts/generate-sw.mjs:28-42`
- Modify: `public/sw.js:28-42`
- Test: `scripts/__tests__/generate-sw.test.mjs`

- [ ] **Step 1.1: Viết test kiểm tra Service Worker không precache trang private `'/'`**
  Tạo hoặc cập nhật file test `scripts/__tests__/generate-sw.test.mjs` kiểm tra output của `generateServiceWorkerContent`:
  - `PRECACHE_ASSETS` không được chứa `'/'`.
  - `PRECACHE_ASSETS` phải chứa `'/offline'`, `'/manifest.webmanifest'`, và các icon public.

- [ ] **Step 1.2: Chạy test để xác nhận fail**
  Chạy `npx vitest run scripts/__tests__/generate-sw.test.mjs`.

- [ ] **Step 1.3: Cập nhật `scripts/generate-sw.mjs` và regenerate `public/sw.js`**
  Trong `scripts/generate-sw.mjs`, xóa `'/'` khỏi mảng `PRECACHE_ASSETS`.
  Chạy `node scripts/generate-sw.mjs` để cập nhật `public/sw.js`.

- [ ] **Step 1.4: Chạy lại test để xác nhận pass**
  Chạy `npx vitest run scripts/__tests__/generate-sw.test.mjs` -> Pass.

- [ ] **Step 1.5: Commit Task 1**
  `git commit -m "fix(pwa): remove root route from service worker precache assets"`

---

### Task 2: Chuẩn hóa Server Middleware (`src/middleware.ts`)

**Files:**
- Modify: `src/middleware.ts:1-64`
- Test: `src/__tests__/middleware.test.ts`

- [ ] **Step 2.1: Viết bộ unit test toàn diện cho Middleware**
  Tạo `src/__tests__/middleware.test.ts` kiểm tra các kịch bản:
  - Khách chưa đăng nhập vào `/` -> redirect 307 về `/login`.
  - Khách chưa đăng nhập vào `/messages` -> redirect 307 về `/login?redirect=/messages`.
  - Khách chưa đăng nhập vào `/offline` -> Next (cho phép truy cập).
  - Khách chưa đăng nhập vào `/invite/abc-token` -> Next (cho phép truy cập).
  - Khách chưa đăng nhập vào `/u/johndoe` -> Next (cho phép truy cập public profile).
  - Khách có token hợp lệ vào `/login` -> redirect về `/`.
  - Khách có token hết hạn vào `/` -> xóa cookie và redirect về `/login`.

- [ ] **Step 2.2: Chạy test để xác nhận fail**
  Chạy `npx vitest run src/__tests__/middleware.test.ts`.

- [ ] **Step 2.3: Cập nhật `src/middleware.ts`**
  Mở rộng danh sách `PUBLIC_PATHS` và quy tắc kiểm tra:
  - Khai báo các public prefixes: `['/login', '/register', '/verify-otp', '/complete-profile', '/offline']`.
  - Khai báo pattern cho semi-public routes: `/invite/`, `/u/`.
  - Đảm bảo tham số redirect được mã hóa chuẩn (`encodeURIComponent`).

- [ ] **Step 2.4: Chạy lại test để xác nhận pass**
  Chạy `npx vitest run src/__tests__/middleware.test.ts` -> Pass.

- [ ] **Step 2.5: Commit Task 2**
  `git commit -m "fix(auth): refine server middleware public paths and redirect rules"`

---

### Task 3: Nâng cấp Centralized `AuthGate` Component

**Files:**
- Modify: `src/components/auth/AuthGate.tsx:1-90`
- Test: `src/components/auth/__tests__/AuthGate.test.tsx`

- [ ] **Step 3.1: Viết unit test cho `AuthGate` kiểm tra chặn render children**
  Cập nhật `src/components/auth/__tests__/AuthGate.test.tsx`:
  - Khi chưa hydrate (`isHydrated = false`) trên private route: KHÔNG render children, hiển thị Skeleton.
  - Khi đã hydrate (`isHydrated = true`) nhưng `tokenValid = false` trên private route: KHÔNG render children, gọi `router.replace('/login?redirect=...')`, hiển thị Skeleton.
  - Khi đã hydrate và `tokenValid = true`: render children bình thường.
  - Khi ở public route (`/login`, `/register`, `/offline`, etc.): render children bình thường ngay cả khi chưa đăng nhập.

- [ ] **Step 3.2: Chạy test để xác nhận fail**
  Chạy `npx vitest run src/components/auth/__tests__/AuthGate.test.tsx`.

- [ ] **Step 3.3: Cập nhật `src/components/auth/AuthGate.tsx`**
  - Thêm logic kiểm tra public route tương thích với middleware (`/login`, `/register`, `/verify-otp`, `/complete-profile`, `/offline`, `/invite/*`, `/u/*`).
  - Khi `!isPublicRoute`:
    - Nếu `!isHydrated`: return `<HomeSkeleton />`.
    - Nếu `isHydrated && !tokenValid`: kích hoạt `router.replace` và return `<HomeSkeleton />`.
  - Đảm bảo không bao giờ mount `children` khi người dùng chưa xác thực trên route bảo vệ.

- [ ] **Step 3.4: Chạy lại test để xác nhận pass**
  Chạy `npx vitest run src/components/auth/__tests__/AuthGate.test.tsx` -> Pass.

- [ ] **Step 3.5: Commit Task 3**
  `git commit -m "fix(auth): block rendering private children in AuthGate until authenticated"`

---

### Task 4: Bổ sung Client Route Guard tại Root `/` và `/messages` (Defense in Depth)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/messages/page.tsx`
- Modify: `src/app/messages/[id]/page.tsx`
- Test: `src/app/__tests__/home-auth-guard.test.tsx`
- Test: `src/app/messages/__tests__/messages-auth-guard.test.tsx`

- [ ] **Step 4.1: Viết test cho Home Page Auth Guard**
  Tạo `src/app/__tests__/home-auth-guard.test.tsx`:
  - Khi `isHydrated = true` và `isAuthenticated = false`: `HomePage` gọi `router.replace('/login')`, không gọi `camera.startCamera()`.
  - Khi `isHydrated = false`: `HomePage` hiển thị `HomeSkeleton`.

- [ ] **Step 4.2: Viết test cho Messages Pages Auth Guard**
  Tạo `src/app/messages/__tests__/messages-auth-guard.test.tsx`:
  - Khi `isHydrated = true` và `isAuthenticated = false`: điều hướng về `/login?redirect=/messages`.

- [ ] **Step 4.3: Chạy test để xác nhận fail**
  Chạy `npx vitest run src/app/__tests__/home-auth-guard.test.tsx src/app/messages/__tests__/messages-auth-guard.test.tsx`.

- [ ] **Step 4.4: Cập nhật `src/app/page.tsx`, `src/app/messages/page.tsx`, `src/app/messages/[id]/page.tsx`**
  - Trong `src/app/page.tsx`: lấy `isAuthenticated` và `isHydrated` từ `useAuthStore`.
    - Thêm `useEffect` chuyển hướng về `/login` nếu `isHydrated && !isAuthenticated`.
    - Chỉ chạy hook camera `useEffect` khi `isAuthenticated` là true.
    - Nếu `!isHydrated || !isAuthenticated`: return `<HomeSkeleton />`.
  - Trong `src/app/messages/page.tsx` & `src/app/messages/[id]/page.tsx`:
    - Thêm guard `if (isHydrated && !isAuthenticated) router.replace('/login?redirect=...')`.
    - Nếu `!isHydrated || !isAuthenticated`: return Skeleton tương ứng.

- [ ] **Step 4.5: Chạy lại test để xác nhận pass**
  Chạy `npx vitest run src/app/__tests__/home-auth-guard.test.tsx src/app/messages/__tests__/messages-auth-guard.test.tsx` -> Pass.

- [ ] **Step 4.6: Commit Task 4**
  `git commit -m "feat(auth): add client-side route guards to home and messages pages"`

---

### Task 5: Kiểm thử hồi quy, Build Production, Deploy Vercel và Xác thực E2E

**Files:**
- Toàn bộ codebase

- [ ] **Step 5.1: Chạy toàn bộ Vitest Suite**
  Chạy `npm test` để xác nhận tất cả test files (bao gồm các test mới) đều pass 100%.

- [ ] **Step 5.2: Chạy Production Build**
  Chạy `npm run build` để kiểm tra compile TypeScript, generate SSG/SSR routes, và generate Service Worker.

- [ ] **Step 5.3: Push lên Git `origin/main`**
  Đẩy các commits lên GitHub để kích hoạt deploy production trên Vercel.

- [ ] **Step 5.4: Kiểm tra HTTP status và redirect trên Production URL**
  - Chạy `curl -i https://checked.quizken.com/` kiểm tra HTTP 307 -> `/login`.
  - Chạy `curl -i https://checked.quizken.com/messages` kiểm tra HTTP 307 -> `/login?redirect=/messages`.
  - Chạy `curl -i https://checked.quizken.com/login` kiểm tra HTTP 200.
  - Chạy `curl -i https://checked.quizken.com/offline` kiểm tra HTTP 200.
