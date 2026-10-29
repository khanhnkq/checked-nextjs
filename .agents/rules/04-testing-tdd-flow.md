# Rule: Test-Driven Development (TDD) & Clear Testing Standards

## Trigger
Áp dụng cho mọi tính năng nghiệp vụ, thuật toán tính toán tài chính, phân loại bữa ăn, bộ chuyển đổi dữ liệu và API service.

## Bắt buộc
1. **Quy trình TDD (Red - Green - Refactor)**:
   - Viết test case mô tả kỳ vọng trước khi viết logic thực thi.
   - Chạy test kiểm tra trạng thái Red (thất bại).
   - Viết code tối thiểu để đạt Green (thành công).
   - Refactor code sạch sẽ, tuân thủ SOLID và DRY.
2. **Kiểm thử đơn vị bắt buộc (Unit Tests)**:
   - Tỷ lệ bao phủ kiểm thử $\ge 90\%$ cho các modules:
     - Logic chia tiền hóa đơn (`splitBill`)
     - Phân bổ dòng tiền & ngân sách tháng (`calculateCashflow`)
     - Tự động nhận diện bữa ăn theo thời gian thực (`MealType.current`)
     - Cắt ảnh vuông 1:1 (`cropToSquare`)
     - Giải mã & đóng gói gói tin WebSocket STOMP
3. **Môi trường kiểm thử**:
   - Chạy bằng `vitest` + `@testing-library/react`.
   - Mock API bằng `msw` (Mock Service Worker).

