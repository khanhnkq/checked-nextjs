# 💰 BẢNG ĐIỀU KHIỂN CHI TIÊU & TÀI CHÍNH (`/expense` - LOW TEXT & SOLID SPEC)

> 💡 **NGUYÊN TẮC GIAO DIỆN ÍT CHỮ (LOW-TEXT UI)**:  
> Thay thế các câu văn rườm rà bằng con số tài chính lớn (Large Tabular Numbers), nhãn danh mục ngắn gọn 1 - 2 từ và icon trực quan.

---

## 1. BỐ CỤC DASHBOARD CHI TIÊU

```text
┌────────────────────────────────────────────────────────┐
│ [←]                  Chi Tiêu                  [⚙]     │ (HeaderBar)
├────────────────────────────────────────────────────────┤
│                  < Tháng 10, 2026 >                    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Dòng tiền                                        │  │
│  │ Thu +25.0M              Chi -12.5M               │  │
│  │ Còn lại: +12.5M                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ngân sách                                        │  │
│  │ 12.45M / 15.0M (83%)                             │  │
│  │ Còn: 2.55M  [Cam: Chạm ngưỡng]                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Danh mục                                              │
│  🍲 Ăn uống 48%            ☕ Cafe 22%                  │
│  🛒 Mua sắm 15%            🚕 Di chuyển 15%            │
│                                                        │
│  Giao dịch                                             │
│  [Ảnh bill] Highlands Coffee · 65.000đ      Hôm nay    │
│  [Ảnh bill] Cơm tấm Ba Ghiền · 95.000đ      Hôm qua    │
└────────────────────────────────────────────────────────┘
```

---

## 2. CÁC THÀNH PHẦN CHI TIẾT & ĐỒNG BỘ CONTEXT

### 2.1 Bộ Chuyển Đổi Tháng (Month Switcher)
- Hai nút mũi tên tròn trái/phải (`ChevronLeft`, `ChevronRight`), viền sắc nét.
- Nhãn tháng: `Tháng 10, 2026` (đồng bộ trực tiếp tham số `monthKey: "2026-10"` của backend).
- Query Cache: `['expenses', 'monthly', monthKey]`.

### 2.2 Thẻ Dòng Tiền (Cashflow Card - Zero Shadow)
- Nền trắng `#FFFFFF`, bo góc `rounded-[24px]`, viền mảnh `border border-[#141613]/10` (không shadow).
- **Thu nhập (`totalIncome`)**: Màu xanh lá `#4E8752`.
- **Chi tiêu (`totalExpense`)**: Màu đen đậm `#141613`.
- **Dòng tiền ròng (`netCashflow = totalIncome - totalExpense`)**: Con số to rõ ràng.

### 2.3 Vòng Tiến Độ Ngân Sách (Budget Progress Indicator)
- Vòng SVG phẳng hiển thị phần trăm chi tiêu (`budgetUsedPct`):
  - Dưới 80%: Màu xanh Matcha Glow `#D4EB70`.
  - Từ 80% đến 99%: Màu Cam `#FF9500` kèm nhãn ngắn `Chạm ngưỡng`.
  - Từ 100% trở lên (`budgetExceeded = true`): Màu Đỏ `#FF6954` kèm nhãn ngắn `Vượt hạn mức`.

### 2.4 Danh Mục Chi Tiêu (Category Spend Breakdown)
- Tên ngắn gọn: `Ăn uống`, `Cafe`, `Mua sắm`, `Di chuyển`, `Khác`.
- Đi kèm tỷ lệ phần trăm (`percentage: number`) và số tiền đã chi (`amount: number`).

### 2.5 Danh Sách Giao Dịch
- Thumbnail ảnh bill vuông $48x48px$, viền `border border-[#141613]/10`.
- Chạm vào mở popup phóng to ảnh hóa đơn gốc.

---

## 3. SHEET CÀI ĐẶT HẠN MỨC (`BudgetSettingSheet`)
- Tiêu đề ngắn gọn: **`Hạn mức tháng`**.
- Ô nhập số tiền: `Hạn mức tối đa` (`amountLimit`).
- Con trượt: `Cảnh báo tại %` (mặc định $80\%$).
- Nút chính: **`Lưu hạn mức`** (Nền Matcha Glow, viền đen mảnh).
- API đồng bộ: `PUT /api/v1/expenses/budget`.
