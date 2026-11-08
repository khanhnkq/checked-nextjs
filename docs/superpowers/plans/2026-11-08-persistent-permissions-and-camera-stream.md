# Kế hoạch Triển khai Quản lý Tất cả Quyền (Camera & Vị trí) Chỉ Hỏi 1 Lần & Giữ Luồng Bền Vững (Next.js 15 & iOS Standalone)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chấm dứt triệt để tình trạng ứng dụng liên tục hỏi xin quyền (cả Camera và Vị trí GPS) mỗi khi người dùng vào lại hoặc chuyển tab; đảm bảo tất cả các quyền **CHỈ HỎI 1 LẦN DUY NHẤT**, ghi nhớ trạng thái cấp quyền vĩnh viễn trong `localStorage`, duy trì luồng Camera toàn cục (Global Stream Singleton) và cache vị trí thông minh.

**Architecture:** Hệ thống Quản trị Quyền Toàn diện (Unified Permission & Hardware Lifecycle Engine):
1. **Unified Permission Store (`usePermissionStore`)**: Lưu trữ tập trung trạng thái của mọi quyền (`camera`, `location`: `'granted' | 'denied' | 'prompt'`) và cờ `hasAskedCamera`, `hasAskedLocation` trong `localStorage` (`checked_permissions_v1`). Đồng bộ hai chiều với `navigator.permissions.query`.
2. **Global Camera Context (`CameraProvider`)**: Chuyển luồng `MediaStream` từ cấp trang cục bộ (`page.tsx`) lên cấp ứng dụng toàn cục (`layout.tsx`). Khi chuyển tab Trang chủ $\leftrightarrow$ Tin nhắn $\leftrightarrow$ Cài đặt $\leftrightarrow$ Lịch sử, luồng camera giữ nguyên, loại bỏ 100% việc hỏi lại quyền Camera giữa các trang.
3. **Location Caching & On-Demand Engine (`useGeolocation`)**: 
   - Tuyệt đối KHÔNG tự động bật popup xin quyền vị trí mỗi khi bấm chụp ảnh trong `ImagePreviewView`.
   - Lưu vị trí gần nhất (`coords`, `locationName`) vào `localStorage` (`checked_last_location`).
   - Màn hình chụp ảnh tự động lấy ngay vị trí từ cache.
   - Chỉ kích hoạt `navigator.geolocation.getCurrentPosition` đúng 1 lần duy nhất khi người dùng đồng ý cấp quyền, hoặc khi người dùng chủ động bấm vào badge địa điểm để làm mới.
4. **Soft-Prompt Permission Onboarding (Hỏi quyền qua tương tác người dùng)**: Card thông báo cấp quyền nhẹ nhàng chuẩn thẩm mỹ Checked, giải thích rõ lý do trước khi kích hoạt prompt hệ thống qua User Gesture (giúp WebKit iOS lưu quyền bền vững vào container).
5. **Trung tâm Quyền trong Cài đặt (`/settings`)**: Hiển thị trạng thái của Camera và Vị trí, kèm nút bật/tắt và hướng dẫn cấp quyền vĩnh viễn 1 lần trong Cài đặt Safari trên iPhone.

**Tech Stack:** Next.js 15, React 19 Context & Hooks, WebRTC `MediaStream`, Geolocation API, Permissions API, Zustand / LocalStorage, Vitest, Tailwind CSS.

**Spec:** Tối ưu hóa trải nghiệm 1:1 với ứng dụng Native iOS (Checked Locket-style), tuân thủ nghiêm ngặt quy chuẩn thiết kế Checked (Zero Border, Zero Shadow, Zero Blur, Báo gấm).

## Global Constraints
- Không làm ảnh hưởng đến hiệu năng hay gây rò rỉ bộ nhớ (memory leak): khi người dùng ẩn app (`document.visibilityState === 'hidden'`), tạm dừng render video.
- Giữ vững quy chuẩn thiết kế Checked: Zero Border, Zero Shadow, Zero Blur, bảng màu Oat Milk `#EDE9DF`, card `#FAF8F5`, nút nhấn Lime `#D9E872`.
- Đảm bảo 100% tương thích ngược với các hàm điều khiển camera hiện có (`toggleFlash`, `toggleFacingMode`, `toggleZoom`, `setZoom`) và các chức năng gắn thẻ địa điểm của Checked.

## Review Focus
- **Input/Condition 1 (Camera Tab Navigation Persistence)**: Khi người dùng đang ở Trang chủ (`/`), bấm sang Cài đặt (`/settings`) hoặc Tin nhắn (`/messages`) rồi quay lại Trang chủ, luồng camera hiển thị lại ngay lập tức mà KHÔNG gọi lại `getUserMedia` và KHÔNG hiện thông báo hỏi quyền.
- **Input/Condition 2 (Location Permission Asked Exactly Once)**: Người dùng chụp ảnh lần đầu và cấp quyền vị trí $\to$ lần chụp thứ 2, thứ 3... hoặc khi mở lại app, màn hình `ImagePreviewView` tự động đọc vị trí từ cache mà KHÔNG BAO GIỜ hiện lại popup xin quyền GPS.
- **Input/Condition 3 (Cold Start with Saved Permission)**: Khi đóng hẳn app rồi mở lại (kể cả PWA trên iOS), nếu `localStorage` đã ghi nhận quyền là `'granted'`, app tự động kích hoạt camera và vị trí mượt mà không hỏi lại.
- **Input/Condition 4 (User Rejection Handling)**: Nếu người dùng lỡ bấm "Từ chối" (Don't Allow) cho Camera hoặc Vị trí, app ghi nhớ trạng thái `denied`, không lặp lại popup gây phiền hà, và hiển thị badge/nút hướng dẫn mở lại trong Cài đặt nếu cần.
- **Input/Condition 5 (Offline Location Fallback)**: Khi không có mạng hoặc chưa có GPS, app sử dụng vị trí mặc định (`TP. Hồ Chí Minh`) mà không bị crash hay liên tục báo lỗi định vị.

---

### Task 1: Xây Dựng `usePermissionStore` Quản Trị Trạng Thái Cả Camera và Vị Trí

**Files:**
- Create: `src/stores/permission-store.ts`
- Create: `src/stores/__tests__/permission-store.test.ts`

- [x] **Step 1: Viết test cho `permission-store`**
  Tạo `src/stores/__tests__/permission-store.test.ts` kiểm tra:
  - Khởi tạo giá trị mặc định từ `localStorage` (`camera: 'prompt'`, `location: 'prompt'`).
  - Hàm `setPermission('camera', 'granted')` lưu vào store và đồng bộ `localStorage`.
  - Hàm `setPermission('location', 'granted')` lưu vào store và đồng bộ `localStorage`.
  - Cờ `hasAskedCamera` và `hasAskedLocation` được lưu bền vững sau lần hỏi đầu tiên.
  - Hàm `checkSystemPermissions()` kiểm tra qua `navigator.permissions.query` cho cả `'camera'` và `'geolocation'`.
- [x] **Step 2: Chạy test xác nhận fail (Red)**
  ```bash
  npx vitest run src/stores/__tests__/permission-store.test.ts
  ```
- [x] **Step 3: Hiện thực `permission-store.ts`**
  - Quản trị state: `permissions: { camera, location }`, `hasAsked: { camera, location }`, `cachedLocation`.
  - Đồng bộ `localStorage` với key `checked_permissions_v1` và `checked_last_location`.
  - Safe check cho SSR / môi trường không có `window`.
- [x] **Step 4: Chạy test xác nhận pass (Green)**
  ```bash
  npx vitest run src/stores/__tests__/permission-store.test.ts
  ```
- [x] **Step 5: Commit thay đổi Task 1**
  ```bash
  git add src/stores/permission-store.ts src/stores/__tests__/permission-store.test.ts
  git commit -m "feat(permissions): implement unified permission store for camera and location"
  ```

---

### Task 2: Xây Dựng `CameraProvider` (Global Stream Singleton) Cho Toàn Ứng Dụng

**Files:**
- Create: `src/contexts/CameraContext.tsx`
- Create: `src/contexts/__tests__/CameraContext.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Viết test cho `CameraContext`**
  Tạo `src/contexts/__tests__/CameraContext.test.tsx` kiểm tra:
  - Giữ luồng `MediaStream` hoạt động xuyên suốt khi component con mount/unmount.
  - Khi chuyển trang (unmount), luồng video KHÔNG bị hủy (tracks không bị stop).
  - Cung cấp đầy đủ interface của `useWebRTCCamera`: `stream`, `videoRef`, `status`, `startCamera`, `stopCamera`, `toggleFacingMode`, `toggleFlash`, `toggleZoom`.
  - Tự động cập nhật `usePermissionStore` khi camera được cấp quyền (`'granted'`) hoặc bị từ chối (`'denied'`).
- [ ] **Step 2: Chạy test xác nhận fail (Red)**
  ```bash
  npx vitest run src/contexts/__tests__/CameraContext.test.tsx
  ```
- [ ] **Step 3: Hiện thực `CameraContext.tsx`**
  - Chuyển logic từ `useWebRTCCamera` vào Provider cấp cao.
  - Cung cấp hook `useCameraContext()`.
  - Tích hợp với `usePermissionStore`: nếu `camera === 'granted'`, tự động khôi phục stream.
- [ ] **Step 4: Tích hợp `CameraProvider` vào `src/app/layout.tsx`**
  Bao bọc `children` bên trong `<CameraProvider>`.
- [ ] **Step 5: Cập nhật `src/app/page.tsx` sử dụng `useCameraContext()`**
  Thay thế hook `useWebRTCCamera({ autoStart: true })` cục bộ bằng `useCameraContext()`.
- [ ] **Step 6: Chạy test xác nhận pass (Green)**
  ```bash
  npx vitest run src/contexts/__tests__/CameraContext.test.tsx
  ```
- [ ] **Step 7: Commit thay đổi Task 2**
  ```bash
  git add src/contexts/ src/app/layout.tsx src/app/page.tsx
  git commit -m "feat(camera): implement global CameraProvider singleton to eliminate repetitive permission prompts"
  ```

---

### Task 3: Tối Ưu Hóa `useGeolocation` & `ImagePreviewView` (Cache Vị Trí, Chỉ Xin Quyền 1 Lần)

**Files:**
- Modify: `src/hooks/useGeolocation.ts`
- Modify: `src/components/home/ImagePreviewView.tsx`
- Test: `src/hooks/__tests__/useGeolocation.test.ts`
- Test: `src/components/home/__tests__/image-preview-view.test.tsx`

- [ ] **Step 1: Viết test cho cơ chế Cache và Quyền Vị Trí của `useGeolocation`**
  Cập nhật test kiểm tra:
  - Khi khởi tạo, tự động lấy vị trí từ cache `localStorage` (`checked_last_location`) hiển thị tức thì.
  - Nếu đã từng cấp quyền (`location === 'granted'`), chỉ đồng bộ ngầm khi cache quá 30 phút, không chặn UI.
  - Nếu đã từ chối (`location === 'denied'`), không bao giờ tự động gọi `getCurrentPosition` nữa.
  - Khi người dùng bấm vào badge địa điểm trong `ImagePreviewView`, gọi `refreshLocation()` chủ động.
- [ ] **Step 2: Chạy test xác nhận fail (Red)**
  ```bash
  npx vitest run src/hooks/__tests__/useGeolocation.test.ts
  ```
- [ ] **Step 3: Cập nhật `useGeolocation.ts` & `ImagePreviewView.tsx`**
  - Tích hợp `usePermissionStore` vào `useGeolocation`.
  - Lưu kết quả GPS thành công vào `localStorage`.
  - Trong `ImagePreviewView.tsx`, đổi `autoFetch: false` khi đã có cache vị trí, loại bỏ hoàn toàn popup xin quyền mỗi lần chụp ảnh.
- [ ] **Step 4: Chạy test xác nhận pass (Green)**
  ```bash
  npx vitest run src/hooks/__tests__/useGeolocation.test.ts src/components/home/__tests__/image-preview-view.test.tsx
  ```
- [ ] **Step 5: Commit thay đổi Task 3**
  ```bash
  git add src/hooks/useGeolocation.ts src/components/home/ImagePreviewView.tsx src/hooks/__tests__/useGeolocation.test.ts src/components/home/__tests__/image-preview-view.test.tsx
  git commit -m "feat(geo): cache location and prevent repeated geolocation permission popups"
  ```

---

### Task 4: Tạo Component `CameraPermissionPrompt` (Soft-Prompt Chuẩn Checked Cho Lần Đầu)

**Files:**
- Create: `src/components/home/CameraPermissionPrompt.tsx`
- Create: `src/components/home/__tests__/CameraPermissionPrompt.test.tsx`
- Modify: `src/components/home/CameraBox.tsx`

- [ ] **Step 1: Viết test cho `CameraPermissionPrompt`**
  Tạo `src/components/home/__tests__/CameraPermissionPrompt.test.tsx` kiểm tra:
  - Hiển thị card chuẩn Checked khi quyền chưa được cấp (`camera === 'prompt'`).
  - Có icon Camera, tiêu đề "Bật Camera để bắt đầu", nội dung giải thích ngắn gọn, nút bấm "Bật Camera".
  - Khi người dùng bấm "Bật Camera", gọi `startCamera()` từ user gesture và đánh dấu `hasAskedCamera = true`.
  - Hiển thị giao diện hướng dẫn mở quyền trong Cài đặt nếu trạng thái là `denied`.
- [ ] **Step 2: Chạy test xác nhận fail (Red)**
  ```bash
  npx vitest run src/components/home/__tests__/CameraPermissionPrompt.test.tsx
  ```
- [ ] **Step 3: Hiện thực `CameraPermissionPrompt.tsx` & tích hợp `CameraBox.tsx`**
  - Thẩm mỹ: Zero Border, Zero Shadow, Zero Blur, nền `#FAF8F5`, nút Lime `#D9E872`.
  - Hiển thị overlay trực quan trong khung camera thay vì màn hình đen.
- [ ] **Step 4: Chạy test xác nhận pass (Green)**
  ```bash
  npx vitest run src/components/home/__tests__/CameraPermissionPrompt.test.tsx
  ```
- [ ] **Step 5: Commit thay đổi Task 4**
  ```bash
  git add src/components/home/CameraPermissionPrompt.tsx src/components/home/__tests__/CameraPermissionPrompt.test.tsx src/components/home/CameraBox.tsx
  git commit -m "feat(ui): add camera soft-prompt card with user gesture activation"
  ```

---

### Task 5: Bổ Sung Trung Tâm Quản Lý Quyền & Hướng Dẫn iPhone Trong Cài Đặt (`/settings`)

**Files:**
- Modify: `src/app/settings/page.tsx`
- Test: `src/app/settings/__tests__/settings-permissions-management.test.tsx`

- [ ] **Step 1: Viết test cho mục Quản lý Quyền trong Settings**
  Tạo `src/app/settings/__tests__/settings-permissions-management.test.tsx` kiểm tra:
  - Hiển thị mục "Quyền ứng dụng & Thiết bị".
  - Hiển thị trạng thái Camera: [Đã cấp quyền ✓] hoặc [Chưa cấp / Bật].
  - Hiển thị trạng thái Vị trí: [Đã cấp quyền ✓] hoặc [Chưa cấp / Bật].
  - Hiển thị khối hướng dẫn lưu quyền vĩnh viễn trên iPhone (Safari > aA > Website Settings).
- [ ] **Step 2: Chạy test xác nhận fail (Red)**
  ```bash
  npx vitest run src/app/settings/__tests__/settings-permissions-management.test.tsx
  ```
- [ ] **Step 3: Cập nhật `src/app/settings/page.tsx`**
  - Thêm thẻ quản trị quyền sử dụng dữ liệu từ `usePermissionStore`.
  - Thiết kế tinh tế chuẩn Checked (Zero Border, Zero Shadow, `#FAF8F5`).
- [ ] **Step 4: Chạy test xác nhận pass (Green)**
  ```bash
  npx vitest run src/app/settings/__tests__/settings-permissions-management.test.tsx
  ```
- [ ] **Step 5: Commit thay đổi Task 5**
  ```bash
  git add src/app/settings/page.tsx src/app/settings/__tests__/settings-permissions-management.test.tsx
  git commit -m "feat(settings): add permissions management card and iOS Safari permanent permission guide"
  ```

---

### Task 6: Kiểm Thử Toàn Diện, Build Production và Triển Khai Lên Vercel

**Files:**
- All modified files

- [ ] **Step 1: Chạy toàn bộ test suite của dự án (`npm test`)**
  Xác nhận 100% test files pass không lỗi hồi quy.
- [ ] **Step 2: Chạy production build (`npm run build`)**
  Xác nhận compile thành công 24/24 routes.
- [ ] **Step 3: Push lên GitHub origin main**
  ```bash
  git push origin main
  ```
- [ ] **Step 4: Deploy lên Vercel Production**
  ```bash
  npx --yes vercel deploy --prod
  ```
- [ ] **Step 5: Xác minh thực tế trên `checked.quizken.com`**
  - Chuyển đổi giữa các tab (Home $\to$ Profile $\to$ Settings $\to$ Messages $\to$ Home) để kiểm tra luồng camera giữ nguyên vẹn mà không hỏi lại quyền.
  - Chụp ảnh kiểm tra màn hình Preview tự động lấy vị trí từ cache mà không pop-up hỏi quyền GPS.
  - Kiểm tra mục Quản lý quyền trong Cài đặt.
