# Rule: Zero Border, Zero Blur & Zero Shadow (Pure Flat Tonal Contrast)

## Trigger
Áp dụng cho mọi file CSS, Tailwind class, Style tag hoặc JSX/TSX component có tạo kiểu giao diện.

## Bắt buộc
1. KHÔNG BAO GIỜ sử dụng:
   - `border`, `border-*`, `border-t-*`, `border-b-*`, `border-l-*`, `border-r-*`, `border-x-*`, `border-y-*`, `border-[...]`
   - `border`, `border-width`, `border-color`, `border-style`, `outline`
   - `shadow`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `drop-shadow-*`
   - `box-shadow`, `text-shadow`, `filter: drop-shadow`
   - `blur-*`, `backdrop-blur-*`, `filter: blur`, `backdrop-filter: blur`
2. Thay thế bằng:
   - Độ tương phản nền phẳng thuần túy (Pure Tonal Contrast) giữa các màu:
     - Nền chính ứng dụng: `--color-canvas` (`#EDE9DF`)
     - Bề mặt Card/Nút: `--color-surface` (`#FFFFFF`) hoặc `--color-primary` (`#D4EB70`)
     - Nền phụ / Subtle surfaces: `--color-surface-subtle` (`#DFDACD`)
     - Nền ô nhập liệu: `--color-gray-subtle` (`#F2F2F4`)
     - Khung ngắm Camera: `--color-dark-surface` (`#141613`)
   - Tách khối bằng góc bo hình học tự nhiên (`rounded-full`, `rounded-3xl`, `rounded-2xl`).
   - Tuyệt đối KHÔNG dùng bất kỳ đường viền phân cách nào.
