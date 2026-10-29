# 🥗 BẢNG ĐIỀU KHIỂN NĂNG LƯỢNG & CALO (`/calorie` - LOW TEXT & SOLID SPEC)

> 💡 **NGUYÊN TẮC GIAO DIỆN ÍT CHỮ (LOW-TEXT UI)**:  
> Thay thế bảng số liệu phức tạp bằng vòng năng lượng tròn trực quan, thanh đo 3 chỉ số đa lượng và phân nhóm 4 bữa ăn rõ ràng.

---

## 1. BỐ CỤC DASHBOARD NĂNG LƯỢNG

```text
┌────────────────────────────────────────────────────────┐
│ [←]                 Năng Lượng                 [+ Thêm]│ (HeaderBar)
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Vòng đo Calo Ngày                                │  │
│  │ 1.450 / 2.000 kcal                               │  │
│  │ Còn: 550 kcal                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Chỉ số Đa Lượng (Macros)                              │
│  🍗 Đạm: 85g / 120g (70%)                               │
│  🍚 Đường bột: 160g / 220g (72%)                       │
│  🥑 Chất béo: 42g / 65g (64%)                           │
│                                                        │
│  Bữa ăn (Tự nhận diện theo giờ)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ☕ Sáng (05:00 - 10:30) · 380 kcal                │  │
│  │ [Ảnh] Bánh mì chả lụa                            │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ☀️ Trưa (10:30 - 14:30) · 720 kcal  [HIỆN TẠI]   │  │
│  │ [Ảnh] Cơm gà xối mỡ                              │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 🥪 Phụ (14:30 - 17:00) · 0 kcal                  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 🌙 Tối (17:00 - 21:30) · 350 kcal                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 2. NHẬN DIỆN BỮA ĂN THEO ĐỒNG HỒ THỰC & ĐỒNG BỘ CONTEXT

Hàm `MealType.current()` kiểm tra trực tiếp thời gian thiết bị:

| Enum Key | Tên hiển thị ngắn | Khung giờ |
| :--- | :--- | :---: |
| `BREAKFAST` | `Sáng` | `05:00 - 10:30` |
| `LUNCH` | `Trưa` | `10:30 - 14:30` |
| `SNACK` | `Phụ` | `14:30 - 17:00 & Đêm` |
| `DINNER` | `Tối` | `17:00 - 21:30` |

---

## 3. CÁC SHEET TƯƠNG TÁC ĐI KÈM

### 3.1 `CalorieGoalSettingSheet` (Mục Tiêu Ngày)
- Tiêu đề: **`Mục tiêu ngày`**.
- Ô nhập: `Mục tiêu Calo` (`dailyTargetCalories`, mặc định $2000$ kcal).
- Nút chính: **`Lưu mục tiêu`**.
- API đồng bộ: `PUT /api/v1/nutrition/goal`.

### 3.2 `QuickAddCalorieSheet` (Thêm Nhanh Món Ăn)
- Tiêu đề: **`Thêm món ăn`**.
- Trường nhập: `Tên món`, `Số Calo` (kcal), `Bữa ăn` (chọn Sáng/Trưa/Phụ/Tối).
- Nút chính: **`Thêm`**.
- API đồng bộ: `POST /api/v1/nutrition/entries`.
