# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 2
## Xây Dựng Toàn Diện ImagePreviewView (Đối Chiếu Chuẩn 1:1 iOS)

> **Mục tiêu**: Tái hiện 100% giao diện và tương tác của `ImagePreviewView.swift` trên Web: TopBar đồng bộ 44px, Gemini Brand Pill, Pinned Tags trên khung ảnh 1:1, thanh Caption Capsule có nút Sparkles, hàng Action Pills cuộn ngang, và Bottom Controls 86px Matcha Glow.
> **Quy tắc bắt buộc**: 
> - **Zero Border, Zero Blur, Zero Shadow** (thuần túy tương phản sắc thái màu Tonal Contrast).
> - **Max 700 lines/file**: Tách thành các subcomponents độc lập (mỗi file dưới 200 dòng).
> - **Microcopy $\le 3$ từ**.

---

### Bảng Đối Chiếu Thành Phần Giao Diện (iOS vs Next.js)

| Thành phần trên iOS (`ImagePreviewView.swift`) | Component Next.js tương ứng | Quy cách & Visual Tokens |
| :--- | :--- | :--- |
| **TopBar** (Close 44pt, GeminiPill 144x44pt, Download 44pt) | `ImagePreviewTopBar` / `GeminiBrandPill.tsx` | Nút tròn 44px `bg-white`, Capsule 144x44px `bg-white` |
| **Pinned Tags** (Location, Food, Bill/Price, Calorie) | `PreviewPinnedTags.tsx` | Thẻ con nhộng bo tròn `rounded-full` ghim góc trái trên ảnh (Matcha Glow & White) |
| **Caption Capsule** (TextField + Sparkles button) | `PreviewCaptionBar.tsx` | Capsule 44px `bg-black/60` chữ trắng, nút Sparkles sinh caption tự động |
| **Action Pills Row** (Tag món, Sửa bill, Tag calo, Tag giá, Tag vị trí) | `PreviewActionPills.tsx` | Hàng cuộn ngang height 44px, nút active `bg-[#D4EB70]`, inactive `bg-white` |
| **Bottom Controls** (Trash 52pt, Send Matcha 86pt, Audience 52pt) | `ImagePreviewBottomControls` (trong `ImagePreviewView.tsx`) | 3 lớp đồng tâm: Trắng 86px -> Sand Dust 78px -> Matcha Glow 66px |

---

### Danh Sách Công Việc (Tasks)

- [x] **Task 1: Xây dựng Component `GeminiBrandPill.tsx`**
  - **File**: `src/components/home/GeminiBrandPill.tsx`
  - **Mô tả**: Component kích thước chuẩn 144x44px `rounded-full bg-white flex items-center justify-center gap-1.5`. Nhận prop `isAnalyzing?: boolean`. Khi đang phân tích: icon Sparkles có hiệu ứng pulse nhịp điệu mượt mà (`animate-pulse scale-[1.08]`).
  - **Verifiable**: Export qua `src/components/home/index.ts`. (Đã hoàn thành, 3/3 tests pass).

- [ ] **Task 2: Xây dựng Component `PreviewPinnedTags.tsx`**
  - **File**: `src/components/home/PreviewPinnedTags.tsx`
  - **Mô tả**: Cụm thẻ ghim nổi góc trái trên ảnh (`top-3.5 left-3.5 flex flex-col gap-1.5`).
    - Thẻ Vị trí: `bg-white text-[#141613]` + icon `MapPin` (11px).
    - Thẻ Món ăn: `bg-[#D4EB70] text-[#141613]` + icon `Utensils` (11px).
    - Thẻ Giá tiền / Hóa đơn: `bg-[#D4EB70] text-[#141613]` + icon `CreditCard` / `Receipt` (11px).
    - Thẻ Calo: `bg-white text-[#141613]` + icon `Flame` cam (11px).
    - Mỗi thẻ hỗ trợ callback `onClick` để sau này mở Bottom Sheet tương ứng.
  - **Verifiable**: Unit test kiểm tra hiển thị và ẩn/hiện theo props.

- [ ] **Task 3: Xây dựng Component `PreviewCaptionBar.tsx`**
  - **File**: `src/components/home/PreviewCaptionBar.tsx`
  - **Mô tả**: Thanh capsule nhập caption `h-[44px] min-w-[200px] max-w-[320px] rounded-full bg-black/60 px-4 flex items-center gap-2`.
    - Input text trắng `placeholder="Thêm tin nhắn..."` (`placeholder-white/70 text-sm font-semibold`).
    - Nút `Sparkles` sinh gợi ý Caption thông minh dựa trên tên quán / món ăn / giá tiền khi bấm.
  - **Verifiable**: Unit test kiểm tra gõ tin nhắn và bấm nút Sparkles.

- [ ] **Task 4: Xây dựng Component `PreviewActionPills.tsx`**
  - **File**: `src/components/home/PreviewActionPills.tsx`
  - **Mô tả**: Dải nút con nhộng cuộn ngang height 44px (`no-scrollbar flex items-center gap-2 px-5`).
    - Các nút: `Tag món`, `Sửa bill` (nếu có bill), `Tag calo`, `Tag giá`, `Tag vị trí`.
    - Trạng thái Active: `bg-[#D4EB70]` (Matcha Glow); Inactive: `bg-white`. Bấm vào sẽ bật/tắt (toggle) thẻ ghim trên ảnh.
  - **Verifiable**: Unit test kiểm tra toggle state của từng action pill.

- [ ] **Task 5: Ghép Nối & Tối Ưu `ImagePreviewView.tsx`**
  - **File**: `src/components/home/ImagePreviewView.tsx`
  - **Mô tả**: Ghép nối TopBar, Khung ảnh 1:1, Pinned Tags, Caption Bar, Action Pills và Bottom Controls vào một bố cục chuẩn xác, responsive trong `max-w-[430px]`.
    - Quản lý state đồng bộ giữa Action Pills và Pinned Tags (bật/tắt thẻ ghim nào thì thẻ đó ẩn/hiện tức thì trên ảnh).
    - Đảm bảo toàn bộ file $<250$ dòng code, tuyệt đối không có `border-*`, `blur-*`, `shadow-*`.
  - **Verifiable**: Export qua `src/components/home/index.ts`.

- [ ] **Task 6: Viết Test Suites Chi Tiết Cho Phase 2**
  - **Files**:
    - `src/components/home/__tests__/gemini-brand-pill.test.tsx`
    - `src/components/home/__tests__/preview-pinned-tags.test.tsx`
    - `src/components/home/__tests__/preview-caption-bar.test.tsx`
    - `src/components/home/__tests__/preview-action-pills.test.tsx`
    - `src/components/home/__tests__/image-preview-view.test.tsx`
  - **Verifiable**: `npm test` vượt qua 100% test suites.

- [ ] **Task 7: Kiểm Tra Toàn Diện (Verification Phase)**
  - **Lệnh**: `npm test` và `npm run build`.
  - **Tiêu chí**: Toàn bộ unit tests pass, TypeScript 0 lỗi, production build thành công.
