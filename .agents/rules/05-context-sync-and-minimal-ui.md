# Rule: Context Synchronization & Minimal Low-Text UI (Đồng Bộ Context & Giao Diện Ít Chữ)

## Trigger
Áp dụng cho mọi UI Component, Screen, DTO/Type definition, Label, Button copy và State binding.

## 1. ĐỒNG BỘ CONTEXT TUYỆT ĐỐI (ZERO CONTEXT DRIFT)
1. **Đồng bộ 3 chiều: Giao diện (UI) $\longleftrightarrow$ Mã nguồn (Code/State) $\longleftrightarrow$ Dữ liệu máy chủ (Backend/DTO)**:
   - Tên trường trên UI phải phản ánh chính xác 100% thuộc tính trong Type và Backend:
     - Số tiền chi tiêu: `amount` (không tự ý đổi thành `cost`, `priceTag`, `money`).
     - Tên người gửi: `senderName` / `senderDisplayName`.
     - Hạn mức ngân sách: `budgetLimit` / `amountLimit`.
     - Số calo: `calories`.
     - Phân loại bữa ăn: `mealType` (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`).
   - Mọi state trên UI phải ràng buộc trực tiếp với Model tương ứng, không tạo biến rác hay state giả lập gây lệch context.
2. **Parity hoàn hảo với `checked-ios` và `checked-backend`**:
   - Mọi luồng xử lý trên web (từ upload ảnh multipart, bóc tách hóa đơn, tính toán ngân sách, nhận tin nhắn WebSocket) phải đồng nhất về hành vi với bản gốc iOS.

---

## 2. GIAO DIỆN TỐI GIẢN CHỮ, TRỰC QUAN & DỄ HIỂU (MINIMAL LOW-TEXT UI)

Checked là ứng dụng mang phong cách Locket: **Thị giác làm chủ đạo, thao tác chạm lướt tự nhiên, tối giản chữ tối đa (Low-Text Design)**.

1. **Nguyên tắc "Ít chữ - Nhiều nghĩa" (Microcopy Standards)**:
   - Tiêu đề màn hình: Tối đa 1 - 2 từ ngắn gọn (ví dụ: `Chi tiêu`, `Năng lượng`, `Tin nhắn`, `Lịch sử`, `Đăng nhập`).
   - Nút hành động: 1 - 2 từ dứt khoát (ví dụ: `Gửi`, `Lưu`, `Thêm`, `Hủy`, `Chụp`).
   - Tuyệt đối KHÔNG viết câu văn rườm rà, đoạn văn giải thích dài dòng, hay banner hướng dẫn sử dụng chiếm diện tích màn hình.
   - Thay thế văn bản bằng **Biểu tượng (Icon)**, **Huy hiệu số (Pill Badge)**, và **Màu sắc ngữ nghĩa (Matcha Glow / Đỏ san hô / Cam)**.

2. **Bảng Đối Chiếu Microcopy Chuẩn (Trước vs Sau)**:

| Ngữ cảnh | ❌ Copy Rườm Rà (BỊ CẤM) | ✅ Checked Minimal Copy (BẮT BUỘC) |
| :--- | :--- | :--- |
| **Màn hình Đăng nhập** | "Chào mừng bạn quay trở lại với Checked. Vui lòng nhập email và mật khẩu của bạn để tiếp tục" | `Đăng nhập` |
| **Màn hình OTP** | "Vui lòng kiểm tra hộp thư đến và nhập mã xác thực OTP 6 số vừa được gửi" | `Nhập mã 6 số` (kèm email nhỏ) |
| **Gắn thẻ Hóa đơn** | "Hệ thống AI đã nhận diện hóa đơn này từ quán cà phê với tổng số tiền là" | `🧾 Highlands · 65.000đ` |
| **Gắn thẻ Món ăn** | "Món ăn này được nhận diện là Phở bò với lượng calo ước tính là" | `🍲 Phở bò · 550 kcal` |
| **Ngân sách tháng** | "Tình hình chi tiêu tháng này của bạn đang đạt mức 83% trên tổng ngân sách dự kiến" | `Chi 12.5M / 15M` (kèm vòng đo màu cam) |
| **Hạn mức bạn thân** | "Số lượng bạn thân hiện tại bạn đã kết nối trong danh sách là 12 trên tổng số 20" | `12/20 Bạn thân` |
| **Xem ảnh khoảnh khắc** | "Vuốt màn hình lên trên để chuyển sang xem khoảnh khắc tiếp theo của bạn bè" | *Không cần chữ* (chỉ cử chỉ vuốt tự nhiên) |
| **Mời bạn bè** | "Nhấn vào đây để chia sẻ liên kết mời bạn bè tham gia ứng dụng với bạn" | `Chia sẻ link` |

3. **Căn Chỉnh Trực Quan (Visual Hierarchy)**:
   - Ưu tiên con số to, in đậm (Large Tabular Numbers): Ví dụ `12.450.000đ` font `currency-lg` đặt ở trung tâm thay vì giải thích bằng chữ.
   - Trạng thái rõ ràng bằng Icon: Dùng icon nĩa muỗng `Utensils`, icon ngọn lửa `Flame`, icon hóa đơn `Receipt` thay cho nhãn chữ dài.

