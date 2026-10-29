# 📷 MÀN HÌNH CHÍNH & KHUNG CAMERA 1:1 (`/` - LOW TEXT SPEC)

> 💡 **NGUYÊN TẮC GIAO DIỆN ÍT CHỮ (LOW-TEXT UI)**:  
> Ống kính camera vuông 1:1 trực quan là trung tâm. Không có văn bản thừa trên giao diện ngoài nhãn bộ lọc ngắn và số đếm tin nhắn.

---

## 1. BỐ CỤC KHÔNG GIAN 3 TẦNG (THREE-LAYER LAYOUT)

```text
┌────────────────────────────────────────────────────────┐
│ [Avatar]      [Pill Dropdown: Tất cả ▼]    [Chat + (3)]│ (TopBar: 58px)
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │           KHUNG CAMERA VUÔNG 1:1                 │  │
│  │           (Bo góc 32px, Viền cơ học sắc nét)    │  │
│  │                                                  │  │
│  │  [⚡ Flash]                         [1x Zoom]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│         ┌─────────────────────────────────────┐        │
│         │     Thẻ Bạn Bè Xếp Chồng 3D         │        │
│         └─────────────────────────────────────┘        │
│                                                        │
│    [Thư viện]       [ NÚT CHỤP MATCHA ]       [Lật Cam]│
│                        (80x80px)                       │
│                       ↓ Lịch sử                        │
└────────────────────────────────────────────────────────┘
```

---

## 2. ĐẶC TẢ KỸ THUẬT CAMERA WEB (ZERO BLUR, ZERO SHADOW)

### 2.1 Khung Hình Vuông 1:1 (`aspect-square`)
- **Tỉ lệ cố định**: Chiều rộng bằng $100\%$ chiều rộng màn hình trừ đi lề $2 \times 18px = 36px$. Chiều cao luôn bằng chiều rộng (`aspect-ratio: 1 / 1`).
- **Bo góc & Viền**: `rounded-[32px]`, `overflow: hidden`, viền đen cơ học `border-2 border-[#141613]`.
- **Nguồn Video**: HTML5 `<video autoPlay playsInline muted>` nhận stream từ `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', aspectRatio: 1 } })`.

### 2.2 Các Nút Điều Khiển Nổi Trên Khung Camera
- **Nút Flash/Torch**: Nút tròn đen sâu $38x38px$, viền `border border-white/20`:
  - Bật/tắt đèn trợ sáng trên thiết bị di động có hỗ trợ (`track.applyConstraints({ advanced: [{ torch: true }] })`).
  - Đổi màu icon tia sét sang Matcha khi đang bật.
- **Nút Zoom (0.5x <-> 1x)**: Nút tròn đen sâu $38x38px$, viền `border border-white/20`:
  - Nhãn hiển thị siêu ngắn: `0.5x` hoặc `1x`.
  - Hỗ trợ chụm ngón tay pinch-to-zoom trên màn hình cảm ứng điện thoại.

---

## 3. CỤM ĐIỀU KHIỂN DƯỚI (BOTTOM CONTROLS)

1. **Nút Thư viện Ảnh (Album Picker)**:
   - Nút tròn $52x52px$ màu trắng, viền `border border-[#141613]/15`, icon chồng ảnh `Images` màu đen.
   - Khi bấm sẽ mở trình duyệt tệp tin: `<input type="file" accept="image/*" />`.
   - Ảnh chọn từ thư viện sẽ được tự động vẽ lên Canvas và cắt vuông trung tâm (`cropToSquare`).
2. **Nút Chụp Matcha Glow**:
   - Vòng tròn ngoài $80x80px$ viền phẳng `border-2 border-primary` (không dùng bóng tỏa sáng blur/glow).
   - Lõi trong $70x70px$ màu `#D4EB70`, viền `border border-[#141613]/10`.
   - Khi bấm:
     - Kích hoạt rung haptic `navigator.vibrate(25)`.
     - Chụp khung hình hiện tại từ thẻ `<video>` sang `<canvas>` độ phân giải cao ($1080 \times 1080$).
     - Chuyển `Blob` sang màn hình `ImagePreviewView`.
3. **Nút Lật Camera**:
   - Nút tròn $52x52px$ màu trắng, viền `border border-[#141613]/15`, icon `RotateCcw` hoặc `SwitchCamera`.
   - Đổi luồng video giữa `facingMode: 'user'` và `facingMode: 'environment'`.
4. **Nhãn mở Lịch sử**:
   - Chữ ngắn: **`Lịch sử`** kèm icon mũi tên trỏ xuống `ChevronDown`.
   - Bấm vào hoặc vuốt màn hình lên sẽ mở trang `/history`.
