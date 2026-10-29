# 🤖 AGENT RULES & PROJECT STANDARDS: CHECKED NEXT.JS

> **Áp dụng cho**: Mọi AI Agent, Pair Programmer và Developer làm việc trong repository `/Users/nguyenkimquockhanh/Desktop/checked-nextjs`.  
> **Tính hiệu lực**: BẮT BUỘC TUÂN THỦ 100% (STRICT COMPLIANCE). Mọi Pull Request hoặc Code Generation vi phạm bất kỳ điều lệ nào dưới đây đều KHÔNG ĐƯỢC CHẤP NHẬN.

---

## 🏛️ ĐIỀU LỆ 1: THIẾT KẾ ZERO BLUR & ZERO SHADOW (STRICT VISUAL RULE)

1. **Tuyệt đối CẤM Blur**:
   - CẤM sử dụng các class Tailwind: `blur-*`, `backdrop-blur-*`.
   - CẤM sử dụng CSS: `filter: blur(...)`, `backdrop-filter: blur(...)`.
2. **Tuyệt đối CẤM Shadow**:
   - CẤM sử dụng các class Tailwind: `shadow`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `drop-shadow-*`.
   - CẤM sử dụng CSS: `box-shadow`, `text-shadow`, `filter: drop-shadow(...)`.
3. **Giải pháp thay thế bắt buộc**:
   - **Tonal Contrast (Phân lớp màu nền phẳng)**: Dùng sự đối lập giữa nền kem Oat Milk (`#EDE9DF`), trắng (`#FFFFFF`), cát ấm Sand Dust (`#DFDACD`), xám sạch (`#F2F2F4`).
   - **Đường viền sắc sảo (Crisp Solid Borders)**: Tạo chiều sâu và phân tách giao diện bằng các viền đơn sắc: `border border-[#141613]/10`, `border border-[#141613]/15`, hoặc `border-2 border-[#141613]`.
   - **Tối ưu hiệu năng**: Không dùng blur/shadow giúp ứng dụng đạt tốc độ hiển thị $60fps$ tuyệt đối trên mọi thiết bị di động yếu.

---

## ✍️ ĐIỀU LỆ 2: GIAO DIỆN TỐI GIẢN CHỮ, DỄ HIỂU & TRỰC QUAN (LOW-TEXT UI)

Checked là ứng dụng mang phong cách Locket: **Thị giác làm chủ đạo, thao tác chạm lướt tự nhiên, tối giản chữ tối đa**.

1. **Microcopy Cực Ngắn (Tối đa 1 - 3 từ)**:
   - Tiêu đề màn hình: 1 - 2 từ (ví dụ: `Chi tiêu`, `Năng lượng`, `Tin nhắn`, `Đăng nhập`).
   - Nút hành động: 1 - 2 từ (ví dụ: `Gửi`, `Lưu`, `Thêm`, `Hủy`, `Chụp`).
   - Tuyệt đối CẤM các câu văn giải thích dài dòng, đoạn mô tả rườm rà, banner disclaimers chiếm diện tích màn hình.
2. **Visual-First (Hình ảnh & Con số thay cho chữ)**:
   - Dùng icon trực quan (Receipt, Utensils, Flame, MapPin).
   - Dùng số to in đậm rõ ràng (Tabular Bold Numbers) thay cho câu diễn giải.
   - Thao tác tự nhiên: Vuốt chuyển ảnh trực tiếp, không cần nút "Bấm vào đây để xem tiếp".

---

## 🔗 ĐIỀU LỆ 3: ĐỒNG BỘ CONTEXT TUYỆT ĐỐI (ZERO CONTEXT DRIFT)

1. **Đồng bộ 3 chiều: Giao diện $\longleftrightarrow$ Code/State $\longleftrightarrow$ Backend DTO**:
   - Tên trường trên UI phải khớp 100% với Model Type và Backend API:
     - Số tiền: `amount` (cấm tự đổi thành `priceTag`, `cost`, `money`).
     - Người gửi: `senderName` / `senderDisplayName`.
     - Ngân sách: `budgetLimit` / `amountLimit`.
     - Calo: `calories` và `mealType` (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`).
   - Tuyệt đối không tạo biến mock, biến rác hoặc state giả lập gây lệch context chức năng giữa UI và Backend.
2. **Parity hoàn hảo với `checked-ios`**:
   - Toàn bộ 23 màn hình, logic chia tiền, bóc tách AI, STOMP chat và phân bổ ngân sách phải phản ánh đúng hành vi nghiệp vụ gốc.

---

## 📏 ĐIỀU LỆ 4: GIỚI HẠN DÒNG CODE (MAXIMUM 700 LINES / FILE)

1. **Giới hạn cứng (Hard Limit)**:
   - **Không một file nào (`.ts`, `.tsx`, `.css`) được phép vượt quá 700 dòng code.**
2. **Quy tắc tái cấu trúc chủ động (Proactive Refactoring Trigger)**:
   - Khi một file đạt ngưỡng $500 - 600$ dòng, bắt buộc phải chia nhỏ:
     - Tách Component thành các Sub-components con trong cùng folder feature.
     - Đưa logic tính toán, event handlers vào Custom Hooks riêng (`use[Feature].ts`).
     - Tách các hàm định dạng, tính toán toán học vào `utils/`.
     - Tách kiểu dữ liệu DTO/Interface vào `types/`.

---

## 🧩 ĐIỀU LỆ 5: NGUYÊN TẮC THIẾT KẾ PHẦN MỀM S.O.L.I.D

1. **S - Single Responsibility Principle (Đơn trách nhiệm)**: Mỗi file/component/hook chỉ làm đúng 1 việc.
2. **O - Open/Closed Principle (Mở rộng, không sửa lõi)**: Thiết kế component mở rộng qua composition (`children`, `renderProps`).
3. **L - Liskov Substitution Principle (Khả năng thay thế)**: Interface chuẩn cho API Client/Storage để dễ tráo đổi bằng Mock Service khi test.
4. **I - Interface Segregation Principle (Phân tách giao diện)**: Chia nhỏ interfaces, component chỉ nhận đúng props thực dùng.
5. **D - Dependency Inversion Principle (Đảo ngược phụ thuộc)**: UI phụ thuộc vào abstraction (hooks/interfaces), không gọi trực tiếp API/WebSocket thô.

---

## 🚫 ĐIỀU LỆ 6: ZERO DUPLICATION (D.R.Y - TUYỆT ĐỐI KHÔNG CODE TRÙNG)

1. **Cấm Copy-Paste Logic**:
   - Định dạng tiền tệ (`formatCurrency`), ngày tháng (`formatDate`), lấy chữ cái đầu avatar (`getInitials`) phải nằm tập trung ở `src/lib/utils/`.
2. **Cấm Copy-Paste Giao Diện Tương Tự**:
   - Đóng gói các UI lặp lại thành Shared Component trong `src/components/common/`.
3. **Thống Nhất Kiểu Dữ Liệu**:
   - Sử dụng các interfaces tập trung từ `src/types/`, cấm khai báo lại inline type trùng lặp ở từng file.

---

## 🧪 ĐIỀU LỆ 7: TEST-DRIVEN DEVELOPMENT (T.D.D) & KIỂM THỬ RÕ RÀNG

1. **Chu trình TDD Bắt Buộc**:
   - **RED**: Viết Unit Test trước để mô tả kỳ vọng nghiệp vụ (Test fail).
   - **GREEN**: Viết mã nguồn tối thiểu vừa đủ để Test vượt qua (Test pass).
   - **REFACTOR**: Tối ưu hóa cấu trúc code, đảm bảo sạch sẽ và không trùng lặp.
2. **Các Phân Hệ Bắt Buộc Có Test Coverage $\ge 90\%$**:
   - Logic phân chia tiền hóa đơn (`splitBill`).
   - Logic tính toán ngân sách và dòng tiền (`calculateCashflowSummary`).
   - Logic xác định bữa ăn theo giờ thực tế (`MealType.current`).
   - Logic phân tích gói tin WebSocket STOMP.
   - Các hàm nén ảnh, crop vuông 1:1 (`cropToSquare`).
3. **Công Cụ Kiểm Thử Chuẩn**:
   - Test Runner: `vitest` + `@testing-library/react` + `msw`.

---

## 🛑 ĐIỀU LỆ 8: QUY TẮC BẢO TOÀN TÀI LIỆU & "CHƯA ĐƯỢC CODE"

1. **Chưa Được Code Khi Chưa Có Lệnh**:
   - Tuyệt đối không tự ý sinh file mã nguồn nếu người dùng chưa chỉ định bắt đầu triển khai code.
2. **Tài Liệu Hóa Đồng Bộ**:
   - Mọi thay đổi về kiến trúc, endpoint backend hoặc design token phải được cập nhật ngay vào `docs/`.
