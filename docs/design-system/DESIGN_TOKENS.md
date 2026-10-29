# 🎨 DESIGN TOKENS SPECIFICATION (ZERO BLUR, ZERO SHADOW)

> ⚠️ **QUY TẮC BẮT BUỘC (STRICT DESIGN RULE)**:  
> **TUYỆT ĐỐI KHÔNG DÙNG BLUR, KHÔNG DÙNG SHADOW!**  
> Cấm hoàn toàn `blur-*`, `backdrop-blur-*`, filter `blur()`, `shadow-*`, `drop-shadow-*`, `box-shadow`.  
> Thay vào đó, thiết kế sử dụng **Phản xạ Tương phản Phẳng Đơn sắc (Flat Tonal Contrast)**, độ sâu phân lớp bằng bề mặt màu ấm (`#EDE9DF`, `#FFFFFF`, `#DFDACD`, `#F2F2F4`) và **Đường viền Cơ học Sắc Nét (Crisp Solid Borders)**.

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

## 2. HỆ THỐNG ĐƯỜNG VIỀN SẮC NÉT (THAY THẾ HOÀN TOÀN SHADOW)

Để tạo sự phân tách không gian mà **không dùng bất kỳ bóng đổ mờ (shadow) hay hiệu ứng mờ nhòe (blur)**, Checked sử dụng hệ thống viền phân cấp sắc sảo:

| Token Viền | Quy cách CSS | Ứng dụng |
| :--- | :--- | :--- |
| `--border-subtle` | `1px solid rgba(20, 22, 19, 0.08)` | Viền thẻ Card trắng, phân cách danh sách |
| `--border-medium` | `1px solid rgba(20, 22, 19, 0.16)` | Viền nút tròn, viền ô nhập text input |
| `--border-strong` | `2px solid #141613` | Viền khung camera, nút chụp nhấn mạnh |
| `--border-accent` | `2px solid #D4EB70` | Viền trạng thái Focus, viền bài đăng nổi bật |
| `--border-divider`| `1px solid #DFDACD` | Vạch kẻ ngang phân chia nội dung phẳng |

---

## 3. HỆ THỐNG PHÔNG CHỮ & TYPOGRAPHY SCALE

- **Display Font (Rounded)**: `Plus Jakarta Sans`, `Nunito`, hoặc `-apple-system, sans-serif`.
- **Body & Data Font (Sans)**: `Inter`, `Geist Sans`, `system-ui`.

| Tên Token | Size | Line Height | Weight | Letter Spacing | Font Family |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `display-xl` | `32px` | `38px` | 800 (ExtraBold) | `-0.03em` | Display Rounded |
| `display-lg` (Title) | `28px` | `34px` | 700 (Bold) | `-0.02em` | Display Rounded |
| `headline` | `20px` | `26px` | 600 (SemiBold) | `-0.01em` | Display Rounded |
| `body-bold` | `16px` | `22px` | 600 (SemiBold) | `0em` | Sans (Inter) |
| `body` | `16px` | `22px` | 400 (Regular) | `0em` | Sans (Inter) |
| `caption` | `13px` | `18px` | 500 (Medium) | `0.01em` | Sans (Inter) |
| `button` | `16px` | `20px` | 700 (Bold) | `-0.01em` | Display Rounded |
| `currency-lg` | `36px` | `42px` | 800 (ExtraBold) | `-0.03em` | Display Rounded (Tabular) |

---

## 4. HÌNH HỌC & BÁN KÍNH BO GÓC (RADII)

- `rounded-camera`: `32px` — Bo góc khung ngắm camera và card ảnh 1:1.
- `rounded-sheet`: `28px` — Bo góc trên của Bottom Sheet.
- `rounded-card`: `24px` — Thẻ chi tiêu, thẻ calo, thẻ tin nhắn.
- `rounded-pill`: `9999px` (`full`) — Con nhộng Top Bar, Tag Pills.
- `rounded-button`: `9999px` (`full`) — Nút tròn 44x44, 52x52, nút chụp Matcha Glow.

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

  --font-display: "Plus Jakarta Sans", "Nunito", -apple-system, sans-serif;
  --font-sans: "Inter", "Geist Sans", system-ui, sans-serif;

  --radius-camera: 32px;
  --radius-card: 24px;
  --radius-sheet: 28px;
}
```
