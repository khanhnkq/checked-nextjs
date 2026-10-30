# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 3
## Gemini AI Vision Route Handler & Geolocation (Đối Chiếu Chuẩn 1:1 iOS)

> **Mục tiêu**: Tái hiện 100% năng lực phân tích thị giác của `GeminiVisionProvider.swift` và `LocationService.swift`: Route Handler server bảo mật API key, gọi mô hình Google Gemini Flash phân loại `BILL`, `FOOD`, hoặc `NORMAL`, cùng Geolocation xác định vị trí quán ăn.
> **Quy tắc bắt buộc**:
> - **Bảo mật**: `GEMINI_API_KEY` chỉ lưu ở phía Server (`.env.local` / Next.js API Route), không bao giờ lộ ra Client.
> - **Tối ưu tốc độ**: Nén ảnh $800 \times 800$ JPEG ($<150$KB) ở Client trước khi gửi lên AI, phản hồi dưới 1.5s.
> - **Zero Border, Zero Blur, Zero Shadow**: Giữ vững visual rules.
> - **Max 700 lines/file**: Code module hóa rõ ràng.

---

### Bảng Đối Chiếu Kiến Trúc (iOS vs Next.js)

| Thành phần trên iOS (`checked-ios`) | Thành phần Web Next.js (`checked-nextjs`) | Vai trò & Đặc tả |
| :--- | :--- | :--- |
| `GeminiVisionDTO.swift` | `src/lib/ai/gemini-types.ts` | Interface dữ liệu JSON payload phân loại `BILL`, `FOOD`, `NORMAL` |
| `GeminiPromptBuilder.swift` | `src/lib/ai/gemini-prompt.ts` | Builder sinh Structured Prompt tiếng Việt chuẩn chuyên gia ẩm thực Checked |
| `GeminiVisionProvider.swift` | `src/app/api/ai/vision-analyze/route.ts` | Route Handler bảo mật gọi Google Generative AI SDK (`@google/generative-ai`) |
| `VisionServiceCoordinator.swift` | `src/hooks/useVisionAnalysis.ts` | Hook điều phối nén ảnh canvas $800 \times 800$, gọi API và cập nhật state |
| `LocationService.swift` | `src/hooks/useGeolocation.ts` | Hook lấy tọa độ GPS `navigator.geolocation` & format tên địa phương |

---

### Danh Sách Công Việc (Tasks)

- [x] **Task 1: Tạo Prompt Builder & Type Definitions (`gemini-prompt.ts` & `gemini-types.ts`)**
  - **Files**: `src/lib/ai/gemini-types.ts`, `src/lib/ai/gemini-prompt.ts`
  - **Mô tả**: Tái hiện 100% prompt từ `GeminiPromptBuilder.swift` yêu cầu Gemini Flash trả về JSON schema: `is_food`, `dish_name`, `category`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `is_bill`, `total_amount_str`, `merchant_name`, `suggested_caption`.
  - **Verifiable**: Export qua `src/lib/ai/index.ts`. (Đã hoàn thành, 6/6 tests pass).

- [x] **Task 2: Xây dựng Next.js Route Handler `/api/ai/vision-analyze`**
  - **File**: `src/app/api/ai/vision-analyze/route.ts`
  - **Mô tả**: Nhận POST `{ imageBase64: string, mimeType?: string }`. Khởi tạo `GoogleGenerativeAI` với model `gemini-1.5-flash` (hoặc `gemini-2.0-flash`), cấu hình `responseMimeType: "application/json"`. Xử lý lỗi API key rỗng hoặc rate-limit gracefully mà không crash server.
  - **Verifiable**: Unit test kiểm tra Route Handler với mock Gemini SDK. (Đã hoàn thành, 5/5 tests pass).

- [x] **Task 3: Xây dựng Hook `useVisionAnalysis.ts`**
  - **File**: `src/hooks/useVisionAnalysis.ts`
  - **Mô tả**: Nhận ảnh Blob/dataUrl, tự động resize tâm vuông 800x800 JPEG (quality 0.82) qua Canvas, gửi request lên `/api/ai/vision-analyze`, trả về `{ isAnalyzing, result, analyzeImage, error }`.
  - **Verifiable**: Unit test kiểm tra hook nén ảnh và parse kết quả. (Đã hoàn thành, 5/5 tests pass).

- [ ] **Task 4: Xây dựng Hook `useGeolocation.ts`**
  - **File**: `src/hooks/useGeolocation.ts`
  - **Mô tả**: Lấy vị trí người dùng qua `navigator.geolocation`, hỗ trợ làm mới `refreshLocation()`, trả về `{ locationName: string, coords: { lat, lng } | null, isLocating: boolean }` với giá trị mặc định là `"TP. Hồ Chí Minh"`.
  - **Verifiable**: Unit test kiểm tra gọi GPS và fallback địa phương.

- [ ] **Task 5: Tích hợp AI Vision & Geolocation vào `ImagePreviewView.tsx`**
  - **File**: `src/components/home/ImagePreviewView.tsx`
  - **Mô tả**: Kích hoạt phân tích ảnh và GPS tự động khi mở Preview. Khi có kết quả:
    - Bật hiệu ứng `isAnalyzing` trên `GeminiBrandPill` và `PreviewActionPills`.
    - Tự động điền `locationName`, `dishName`, `priceText`, `calorieText`, và `suggested_caption`.
    - Rung haptic nhẹ khi AI nhận diện thành công.
  - **Verifiable**: Tương tác xem trước ảnh nhận diện thông minh.

- [ ] **Task 6: Viết Test Suites Chi Tiết Cho Phase 3**
  - **Files**:
    - `src/lib/ai/__tests__/gemini-prompt.test.ts`
    - `src/app/api/ai/__tests__/vision-analyze-route.test.ts`
    - `src/hooks/__tests__/useVisionAnalysis.test.ts`
    - `src/hooks/__tests__/useGeolocation.test.ts`
  - **Verifiable**: `npm test` vượt qua 100% test suites.

- [ ] **Task 7: Kiểm Tra Toàn Diện (Verification Phase)**
  - **Lệnh**: `npm test` và `npm run build`.
  - **Tiêu chí**: Toàn bộ unit tests pass, TypeScript 0 lỗi, production build thành công.
