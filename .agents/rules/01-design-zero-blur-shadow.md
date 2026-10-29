# Rule: Zero Blur & Zero Shadow (Strict Flat Mechanical Aesthetics)

## Trigger
Áp dụng cho mọi file CSS, Tailwind class, Style tag hoặc JSX/TSX component có tạo kiểu giao diện.

## Bắt buộc
1. KHÔNG BAO GIỜ sử dụng:
   - `shadow`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `drop-shadow-*`
   - `box-shadow`, `text-shadow`, `filter: drop-shadow`
   - `blur-*`, `backdrop-blur-*`, `filter: blur`, `backdrop-filter: blur`
2. Thay thế bằng:
   - Độ tương phản nền phẳng (Tonal Contrast) giữa các màu:
     - Nền chính: `--color-canvas` (`#EDE9DF`)
     - Bề mặt Card/Nút: `--color-surface` (`#FFFFFF`)
     - Nền phụ: `--color-surface-subtle` (`#DFDACD`)
     - Nền ô nhập: `--color-gray-subtle` (`#F2F2F4`)
     - Khung ngắm: `--color-dark-surface` (`#141613`)
   - Đường viền đơn sắc sắc nét (Solid Crisp Borders):
     - Thẻ trắng: `border border-[#141613]/10`
     - Nút tròn: `border border-[#141613]/15`
     - Khung camera: `border-2 border-[#141613]`
     - Phân cách: `border-b border-[#DFDACD]`

