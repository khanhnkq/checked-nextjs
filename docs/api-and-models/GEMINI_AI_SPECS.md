# 🤖 GEMINI AI VISION & PROMPT SPECIFICATIONS

Checked sử dụng mô hình **Google Gemini Flash (1.5 hoặc 2.0)** để phân tích tự động hình ảnh vừa chụp, phân loại bức ảnh thành 3 nhóm: **Hóa đơn tính tiền (Bill)**, **Món ăn & Dinh dưỡng (Food)**, hoặc **Ảnh sinh hoạt thông thường (Normal)**.

---

## 1. KIẾN TRÚC TÍCH HỢP GEMINI AI

```text
┌────────────────────────────────────────────────────────┐
│             Ảnh Chụp từ Canvas Web (1:1)               │
└──────────────────────────┬─────────────────────────────┘
                           │ (Chuyển thành Base64 JPEG)
                           ▼
┌────────────────────────────────────────────────────────┐
│     Next.js API Route (/api/ai/vision-analyze)         │
│     (Bảo mật GEMINI_API_KEY ở môi trường Server)       │
└──────────────────────────┬─────────────────────────────┘
                           │ (Gọi Google GenAI SDK)
                           ▼
┌────────────────────────────────────────────────────────┐
│           Google Gemini 1.5 / 2.0 Flash                │
│    System Instruction: Phân tích hóa đơn & món ăn VN   │
└──────────────────────────┬─────────────────────────────┘
                           │ (Trả về JSON có cấu trúc chuẩn)
                           ▼
┌────────────────────────────────────────────────────────┐
│          Client: Tự động điền các Tag Sheets           │
│   - Số tiền & Tên quán -> BillDetailSheet              │
│   - Tên món & Calo/Macros -> CalorieEditSheet          │
└────────────────────────────────────────────────────────┘
```

---

## 2. SYSTEM INSTRUCTION & STRUCTURED PROMPT

Được chuyển thể chính xác từ `GeminiPromptBuilder.swift`:

```text
Bạn là một trợ lý AI thông minh chuyên về thị giác máy tính của ứng dụng tài chính và dinh dưỡng Checked.
Nhiệm vụ của bạn là phân tích bức ảnh được cung cấp và trả về DUY NHẤT một chuỗi JSON chuẩn (không chứa markdown backticks, không giải thích dài dòng).

Hãy xác định loại ảnh:
1. Nếu ảnh là hóa đơn, biên lai, phiếu thanh toán (BILL):
   - Trích xuất: Tên cửa hàng/quán ăn (merchantName), tổng số tiền thanh toán (totalAmount dạng số nguyên VNĐ), danh mục gợi ý (category: Ăn uống, Mua sắm, Di chuyển, Khác), danh sách từng món hàng nếu đọc được (items: [{ name, price, quantity }]).
2. Nếu ảnh là đồ ăn, thức uống, món ăn Việt Nam (FOOD):
   - Trích xuất: Tên món ăn chính xác bằng tiếng Việt chuẩn (dishName), nhóm danh mục (category: Cơm, Phở/Bún, Đồ uống/Cafe, Tráng miệng, Ăn vặt...), lượng Calo ước tính (calories dạng số nguyên kcal), ước tính Đạm (proteinGrams), Đường bột (carbsGrams), Chất béo (fatGrams).
3. Nếu là ảnh phong cảnh, chân dung, không có hóa đơn hay đồ ăn (NORMAL):
   - Đặt type = "NORMAL".

ĐỊNH DẠNG JSON ĐẦU RA BẮT BUỘC:
{
  "type": "BILL" | "FOOD" | "NORMAL",
  "confidence": 0.95,
  "billData": {
    "merchantName": "Highlands Coffee",
    "totalAmount": 65000,
    "category": "Ăn uống",
    "categoryIcon": "Coffee",
    "items": [
      { "name": "Trà sen vàng (L)", "price": 65000, "quantity": 1 }
    ]
  },
  "foodData": {
    "dishName": "Phở Bò Tái Nạm",
    "category": "Phở/Bún/Mì",
    "categoryIcon": "Utensils",
    "calories": 550,
    "proteinGrams": 28,
    "carbsGrams": 65,
    "fatGrams": 18
  },
  "suggestedCaption": "🧾 Highlands Coffee · 65.000đ"
}
```

---

## 3. CƠ CHẾ DỰ PHÒNG & XỬ LÝ LỖI (FALLBACK STRATEGY)

- **Khi mất mạng hoặc API Key đạt giới hạn (Rate Limit)**:
  - Ứng dụng không chặn người dùng gửi ảnh.
  - Chuyển sang chế độ thủ công (`Manual Mode`): Cho phép người dùng tự gõ số tiền hoặc tên món ăn nếu muốn.
- **Tối ưu Kích thước Ảnh Gửi lên Gemini**:
  - Không gửi ảnh gốc dung lượng lớn ($5 - 10MB$).
  - Canvas client sẽ nén ảnh thành kích thước chuẩn $800 \times 800$ pixel, chất lượng JPEG $0.8$ (dung lượng chỉ khoảng $150KB$), giúp thời gian Gemini phản hồi siêu tốc dưới $1.5$ giây.

