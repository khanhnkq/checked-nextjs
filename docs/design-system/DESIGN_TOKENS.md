# 🎨 DESIGN TOKENS SPECIFICATION (ZERO BLUR, ZERO SHADOW & IOS NATIVE)

> ⚠️ **QUY TẮC BẮT BUỘC (STRICT DESIGN RULE)**:  
> **TUYỆT ĐỐI KHÔNG DÙNG BLUR, KHÔNG DÙNG SHADOW!**  
> Cấm hoàn toàn `blur-*`, `backdrop-blur-*`, filter `blur()`, `shadow-*`, `drop-shadow-*`, `box-shadow`.  
> Thiết kế chuẩn Apple iPhone: Sử dụng **Phân lớp Tương phản Màu Phẳng (Flat Tonal Contrast)**, độ sâu phân lớp bằng bề mặt màu ấm (`#EDE9DF`, `#FFFFFF`, `#DFDACD`, `#F2F2F4`) và **Đường viền Cơ học Sắc Nét (Crisp Solid Borders)**.

---

## 1. BẢNG MÀU THƯƠNG HIỆU (FLAT COLOR PALETTE)

### 1.1 Khối Màu Nền & Bề Mặt (Canvas & Surfaces)

| Token Name | Hex Code | Tên màu | Mục đích ứng dụng (Phẳng & Sắc Nét) |
| :--- | :---: | :--- | :--- |
| `--color-canvas` | `#EDE9DF` | Oat Milk Warm | Nền chính toàn bộ màn hình, mang lại cảm giác giấy ấm tự nhiên |
| `--color-surface` | `#FFFFFF` | Pure White | Nền phẳng của các thẻ Card, Bottom Sheet, Nút tròn |
| `--color-surface-subtle`| `#DFDACD` | Sand Dust | Nền thứ cấp, nền nút tròn phụ, khối phân cách |
| `--color-gray-subtle` | `#F2F2F4` | Clean Gray | Nền ô input, nền bong bóng tin nhắn nhận |
| `--color-dark-surface` | `#141613` | Deep Obsidian | Nền đen sâu phẳng của khung camera 1:1 |

### 1.2 Khối Màu Nhận Diện & Điểm Nhấn (Brand & Accents)

| Token Name | Hex Code | Tên màu | Ứng dụng |
| :--- | :---: | :--- | :--- |
| `--color-primary` | `#D4EB70` | Matcha Glow | Nút chụp ảnh chính, nút CTA, thanh tiến độ |
| `--color-primary-soft`| `#E6F5A3` | Pastel Matcha | Nền của Pill Badge trạng thái, huy hiệu |
| `--color-accent` | `#BFDD4A` | Deep Matcha | Trạng thái nhấn active của nút chụp |
| `--color-accent-orange`| `#FF9500` | Warm Orange | Cảnh báo chi tiêu chạm 80% ngân sách |

### 1.3 Khối Màu Văn Bản (Typography Colors)

| Token Name | Hex Code | Tên màu | Độ tương phản |
| :--- | :---: | :--- | :--- |
| `--color-text-primary` | `#141613` | Obsidian Black | Đạt chuẩn tương phản cao AAA trên mọi nền |
| `--color-text-secondary`| `#63685F` | Sage Ash | Dùng cho nhãn phụ, ngày tháng, caption |

### 1.4 Khối Màu Ngữ Nghĩa (Semantics)

| Token Name | Hex Code | Mô tả | Ứng dụng |
| :--- | :---: | :--- | :--- |
| `--color-error` | `#FF6954` | Đỏ san hô | Cảnh báo vượt ngân sách, nút xóa, lỗi |
| `--color-success` | `#4E8752` | Xanh rêu | Hoàn thành mục tiêu, kết bạn thành công |

---

## 2. HỆ THỐNG ĐƯỜNG VIỀN SẮC NÉT CHUẨN RETINA IPHONE (SOLID BORDERS)

Để phân tách các lớp không gian mà **không dùng bóng mờ nhòe**, ứng dụng sử dụng các đường viền đơn sắc phẳng:

| Token Viền | Quy cách CSS | Ứng dụng |
| :--- | :--- | :--- |
| `--border-hairline`| `0.5px solid rgba(20, 22, 19, 0.12)` | Viền siêu mỏng chuẩn Retina màn hình iPhone |
| `--border-subtle` | `1px solid rgba(20, 22, 19, 0.08)` | Viền thẻ Card trắng, phân cách danh sách |
| `--border-medium` | `1px solid rgba(20, 22, 19, 0.16)` | Viền nút tròn, viền ô nhập text input |
| `--border-strong` | `2px solid #141613` | Viền khung camera, nút chụp nhấn mạnh |
| `--border-accent` | `2px solid #D4EB70` | Viền trạng thái Focus, viền bài đăng nổi bật |
| `--border-divider`| `1px solid #DFDACD` | Vạch kẻ ngang phân chia nội dung phẳng |

---

## 3. HỆ THỐNG PHÔNG CHỮ CHUẨN APPLE IPHONE (SF PRO STACK)

- **Display Font (Rounded)**: `-apple-system, BlinkMacSystemFont, "SF Pro Rounded", "Plus Jakarta Sans", sans-serif`.
- **Body & Data Font (Sans)**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif`.

| Tên Token | Size | Line Height | Weight | Letter Spacing | Font Family |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `display-xl` | `32px` | `38px` | 800 (ExtraBold) | `-0.03em` | SF Pro Rounded |
| `display-lg` (Title) | `28px` | `34px` | 700 (Bold) | `-0.02em` | SF Pro Rounded |
| `headline` | `20px` | `26px` | 600 (SemiBold) | `-0.01em` | SF Pro Rounded |
| `body-bold` | `16px` | `22px` | 600 (SemiBold) | `0em` | SF Pro Text |
| `body` | `16px` | `22px` | 400 (Regular) | `0em` | SF Pro Text |
| `caption` | `13px` | `18px` | 500 (Medium) | `0.01em` | SF Pro Text |
| `button` | `16px` | `20px` | 700 (Bold) | `-0.01em` | SF Pro Rounded |
| `currency-lg` | `36px` | `42px` | 800 (ExtraBold) | `-0.03em` | SF Pro Rounded (Tabular) |

---

## 4. HÌNH HỌC, BÁN KÍNH BO GÓC & AN TOÀN IPHONE (SAFE AREA INSETS)

- `rounded-camera`: `32px` — Bo góc khung ngắm camera và card ảnh 1:1.
- `rounded-sheet`: `28px` — Bo góc trên của Bottom Sheet (Drawer `vaul`).
- `rounded-card`: `24px` — Thẻ chi tiêu, thẻ calo, thẻ tin nhắn.
- `rounded-pill`: `9999px` (`full`) — Con nhộng Top Bar, Tag Pills.
- `rounded-button`: `9999px` (`full`) — Nút tròn 44x44, 52x52, nút chụp Matcha Glow.

### 4.1 Căn Chỉnh Dynamic Island & Home Indicator
- **Đỉnh màn hình (Top Safe Area)**: `padding-top: max(env(safe-area-inset-top), 12px)`.
- **Đáy màn hình (Bottom Safe Area)**: `padding-bottom: max(env(safe-area-inset-bottom), 16px)`.

---

## 5. TÍCH HỢP TAILWIND CSS V4 (@THEME)

```css
@theme {
  --color-canvas: #EDE9DF;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #DFDACD;
  --color-gray-subtle: #F2F2F4;
  --color-dark-surface: #141613;

  --color-primary: #D4EB70;
  --color-primary-soft: #E6F5A3;
  --color-accent: #BFDD4A;
  --color-accent-orange: #FF9500;

  --color-text-primary: #141613;
  --color-text-secondary: #63685F;

  --color-error: #FF6954;
  --color-success: #4E8752;

  --font-display: -apple-system, BlinkMacSystemFont, "SF Pro Rounded", "Plus Jakarta Sans", sans-serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;

  --radius-camera: 32px;
  --radius-card: 24px;
  --radius-sheet: 28px;
}
```
