# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 5
## Gửi Bài Đăng (Multipart Upload) & Đồng Bộ Feed (Chuẩn 1:1 iOS)

> **Mục tiêu**: Tái hiện trọn vẹn quy trình đăng tải khoảnh khắc ảnh kèm metadata chi tiêu & ẩm thực qua API multipart `POST /api/v1/photos` (đối chiếu 1:1 với `PhotoController.java` & `ImagePreviewView.swift`).
> **Quy tắc bắt buộc**:
> - **Zero Border, Zero Blur, Zero Shadow**: Tuyệt đối không dùng `border-*`, `blur-*`, `shadow-*`.
> - **Boundary Safety**: Đảm bảo browser tự động sinh `Content-Type: multipart/form-data; boundary=...` mà không bị ghi đè.
> - **Tối ưu phản hồi**: Nút gửi Matcha Glow 86px có trạng thái loading, rung haptic chân thực, toast thông báo $\le 3$ từ và tự động làm mới Feed ảnh ngay lập tức.
> - **Max 700 lines/file**: Tách nhỏ hook và modal dưới 200 dòng.

---

### Bảng Đối Chiếu Kiến Trúc (iOS vs Backend vs Next.js)

| Backend Spring Boot (`checked-backend`) | Chuẩn iOS (`checked-ios`) | Client Web Next.js (`checked-nextjs`) | Vai trò & Đặc tả |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/photos` (`@RequestParam MultipartFile file`, `amount`, `caption`, `locationName`, `dishName`, `calories`, `mealType`, `recipientScope`) | `PhotoRepository.uploadPhoto(...)` | `src/hooks/usePhotoUpload.ts` | Hook điều phối tạo `FormData`, gọi API multipart, invalidate cache và hiển thị feedback |
| `customFetcher.ts` | `URLSession.upload` | `src/lib/api/custom-fetcher.ts` | Khử header `Content-Type` khi gửi `FormData` để trình duyệt tự động chèn boundary |
| `MealType.current(for: Date())` | `MealType.swift` | `determineMealType(date?: Date)` | Tự động xác định bữa ăn theo giờ chụp: `BREAKFAST` (5h-10h30), `LUNCH` (10h30-14h), `SNACK` (14h-17h30), `DINNER` (17h30-22h) |
| `RecipientScope` (`ALL_FRIENDS`, `SELECTED_FRIENDS`) | Audience Selection Sheet | `src/components/sheets/AudienceSelectSheet.tsx` | Bottom sheet chọn đối tượng nhận ảnh (Tất cả bạn bè hoặc chọn danh sách bạn bè) |
| `QueryClient.invalidateQueries` | `NotificationCenter .didUploadPhotoWithMetadata` | `useQueryClient` cache invalidation | Làm mới tức thì danh sách ảnh Feed (`getFeedPhotos`) và Ảnh của tôi (`getMyPhotos`) |

---

### Danh Sách Công Việc (Tasks)

- [x] **Task 1: Chuẩn hóa `custom-fetcher.ts` cho Multipart FormData**
  - **File**: `src/lib/api/custom-fetcher.ts`
  - **Mô tả**: Khi `data instanceof FormData`, tự động xóa `headers.delete('Content-Type')` nếu có để trình duyệt tự động chèn `multipart/form-data; boundary=----WebKitFormBoundary...`.
  - **Verifiable**: Unit test kiểm tra gửi `FormData` không bị gán cứng Content-Type thiếu boundary (Đã hoàn thành, 7/7 tests pass).

- [ ] **Task 2: Xây dựng Hook `usePhotoUpload.ts` & Helper xác định bữa ăn**
  - **File**: `src/hooks/usePhotoUpload.ts`
  - **Mô tả**:
    - Nhận `file: Blob`, `caption`, `amount`, `locationName`, `dishName`, `calories`, `recipientIds`.
    - Tự động gán `transactionType = "EXPENSE"` nếu `amount > 0`.
    - Tự động gán `mealType` (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`).
    - Gọi API `POST /api/v1/photos` qua `customFetcher`.
    - On success: rung `haptics.success()`, hiện toast `sonner`: `"Đã gửi khoảnh khắc ✨"`, làm mới cache query `['/api/v1/photos']`.
    - On error: rung `haptics.error()`, hiện toast lỗi.
  - **Verifiable**: Unit test kiểm tra đóng gói FormData, gọi API và xử lý kết quả thành công/thất bại.

- [ ] **Task 3: Xây dựng `AudienceSelectSheet.tsx` (Chọn người nhận ảnh)**
  - **File**: `src/components/sheets/AudienceSelectSheet.tsx`
  - **Mô tả**:
    - Kế thừa `BaseBottomSheet`.
    - Lựa chọn 1: "Tất cả bạn bè" (mặc định - icon `Users`, badge Matcha Glow).
    - Lựa chọn 2: "Chọn bạn bè cụ thể" (danh sách bạn bè từ `useGetMyFriends`).
    - Nút "Xác nhận & Cập nhật" 52px ở đáy.
  - **Verifiable**: Unit test kiểm tra chuyển đổi giữa tất cả bạn bè và chọn bạn cụ thể.

- [ ] **Task 4: Ghép nối Upload Flow vào `ImagePreviewView.tsx` & `page.tsx`**
  - **Files**: `src/components/home/ImagePreviewView.tsx`, `src/app/page.tsx`
  - **Mô tả**:
    - Mở `AudienceSelectSheet` khi bấm nút Chọn người nhận (52px `Users`).
    - Hiệu ứng loading xoay nhẹ nhàng trên Nút Gửi Matcha Glow 86px khi `isSending = true`.
    - Khi bấm gửi: gọi `uploadPhoto` từ `usePhotoUpload`, sau khi thành công tự động đóng Preview và hiển thị lại Camera viewfinder.
  - **Verifiable**: Kiểm tra luồng gửi bài đăng hoàn chỉnh từ chụp ảnh đến đăng tải thành công.

- [ ] **Task 5: Kiểm thử toàn diện TDD & Verification**
  - **Lệnh**: `npm test` và `npm run build`.
  - **Tiêu chí**: 100% test suites pass, 0 lỗi TypeScript, Next.js build thành công.
