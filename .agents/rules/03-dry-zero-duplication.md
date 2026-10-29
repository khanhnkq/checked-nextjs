# Rule: Zero Duplication (DRY Principle)

## Trigger
Áp dụng khi tạo mới hàm tính toán, component, hook hoặc định nghĩa kiểu dữ liệu.

## Bắt buộc
1. **Cấm copy-paste code**:
   - Nếu một logic xuất hiện từ 2 lần trở lên $\rightarrow$ Bắt buộc đưa vào shared utility trong `src/lib/utils/` (ví dụ `formatCurrency`, `formatTimeAgo`, `cropToSquare`).
   - Nếu một mẫu UI xuất hiện từ 2 lần trở lên $\rightarrow$ Đóng gói thành Shared Component trong `src/components/common/`.
2. **Kiểu dữ liệu tập trung**:
   - Mọi data model và DTO phải import từ `src/types/`. Không định nghĩa lặp lại inline type trùng lặp ở nhiều màn hình.

