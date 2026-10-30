# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 1
## Shutter FX & Flow Transition (Màn Trập & Chuyển Luồng Camera Sang Preview)

> **Mục tiêu**: Tái hiện 100% trải nghiệm chụp ảnh của `checked-ios`: hiệu ứng màn trập lóe sáng trắng 120ms kết hợp haptic, tách biệt hoàn toàn giữa `CameraBox` (Live Viewfinder) và `ImagePreviewView` (Màn hình xem trước).

---

### Danh Sách Công Việc (Tasks)

- [x] **Task 1: Tạo Component `ShutterFlash.tsx`**
  - **File**: `src/components/home/ShutterFlash.tsx`
  - **Mô tả**: Lớp phủ màn trập `fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-120 ease-out`. Nhận props `{ isFlashing: boolean }`. Khi bật flash chuyển từ `opacity-80` sang `opacity-0`. Tuân thủ 100% Zero Border, Zero Blur, Zero Shadow.
  - **Verifiable**: Export qua `src/components/home/index.ts`. (Đã hoàn thành, 4/4 tests pass).

- [ ] **Task 2: Tách biệt `CameraBox.tsx` thành Viewfinder thuần túy**
  - **File**: `src/components/home/CameraBox.tsx`
  - **Mô tả**: Xóa bỏ `previewImageUrl` và `onRetake` khỏi `CameraBoxProps` và JSX. `CameraBox` chỉ đảm nhiệm: stream WebRTC, lật camera, zoom 1x/0.5x, toggle flash, và hiển thị trạng thái xin quyền.
  - **Verifiable**: `CameraBox` không còn logic ảnh tĩnh hay nút retake đè lên khung ngắm.

- [ ] **Task 3: Dựng Shell `ImagePreviewView.tsx` (Khung nền sẵn sàng cho Phase 2)**
  - **File**: `src/components/home/ImagePreviewView.tsx`
  - **Mô tả**: Tạo component nhận props `{ photo: { blob: Blob; dataUrl: string }; onDismiss: () => void }`. Render khung ảnh vuông 1:1 bo góc `rounded-[32px]`, thanh header có nút Hủy `✕` (44x44px) và nút Chụp lại để quay về luồng camera live stream.
  - **Verifiable**: Export qua `src/components/home/index.ts`.

- [ ] **Task 4: Nâng cấp State & Điều phối Luồng tại `src/app/page.tsx`**
  - **File**: `src/app/page.tsx`
  - **Mô tả**:
    - Quản lý state `capturedPhoto: { blob: Blob; dataUrl: string } | null` và `isFlashing: boolean`.
    - Trong `handleCapture`: kích hoạt `isFlashing = true`, gọi `haptics.heavy()`, lấy kết quả `{ blob, dataUrl }` từ `captureVideoFrame`, và tắt flash sau 120ms.
    - Trong `handleFileSelected`: lấy `{ blob, dataUrl }` từ `cropImageFileToSquare` và cập nhật `capturedPhoto`.
    - Điều kiện render: nếu `capturedPhoto !== null`, hiển thị `ImagePreviewView`; ngược lại hiển thị giao diện Camera chính (`HomeTopBar`, `CameraBox`, `StackedFriendCardsView`, `footer`).
  - **Verifiable**: Bấm nút chụp hoặc nạp ảnh album sẽ lóe flash và chuyển ngay sang `ImagePreviewView`.

- [ ] **Task 5: Cập nhật & Bổ sung Test Suites**
  - **Files**:
    - `src/components/home/__tests__/home-components.test.tsx` (cập nhật test `CameraBox`).
    - `src/components/home/__tests__/shutter-flash.test.tsx` (test render & animation class của flash).
    - `src/components/home/__tests__/image-preview-shell.test.tsx` (test hiển thị ảnh và nút dismiss).
  - **Verifiable**: `npm test` vượt qua 100% các bài test.

- [ ] **Task 6: Kiểm tra Tổng thể (Verification Phase)**
  - **Lệnh**: `npm test` và `npm run build`.
  - **Tiêu chí**: Toàn bộ unit tests pass, TypeScript biên dịch 0 lỗi, giao diện mượt mà không giật lag.
