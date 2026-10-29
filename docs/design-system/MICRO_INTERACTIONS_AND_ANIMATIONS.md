# ✨ MICRO-INTERACTIONS & ANIMATIONS SPECIFICATION

Checked không phải là một ứng dụng web tĩnh khô cứng; nó được thiết kế với những tương tác vật lý sống động mang lại niềm vui (delightful micro-interactions) cho người dùng.

---

## 1. HIỆU ỨNG BỤI TAN BIẾN THANOS SNAP (`ThanosSnapEngine`)

Khi người dùng nhấn xóa một món ăn hoặc sticker trong ảnh preview:

```mermaid
flowchart LR
    Origin[Ảnh Gốc / Món Ăn] --> Slice[Chụp Canvas & Chia lưới Điểm Ảnh (Pixels/Blocks)]
    Slice --> Disintegrate[Tính toán Vector Lực & Hạt Bụi Phân Tán]
    Disintegrate --> Dissolve[Mờ Dần & Biến Mất trong 1.2s]
    Dissolve --> TimeStone[Hiển Thị Nút Hoàn Tác 'Viên Đá Thời Gian']
```

### 1.1 Cơ chế kỹ thuật trên HTML5 Canvas
1. **Lấy dữ liệu điểm ảnh (Pixel Extraction)**:
   - Dùng `CanvasRenderingContext2D.getImageData()` để lấy mảng màu `Uint8ClampedArray` của vùng vật thể món ăn.
2. **Khởi tạo hệ thống hạt (Particle Generation)**:
   - Gom nhóm các điểm ảnh thành các hạt bụi kích thước $2 \times 2$ pixel hoặc $3 \times 3$ pixel.
   - Mỗi hạt được gán: Vị trí ban đầu $(x, y)$, vận tốc ngang ngẫu nhiên $v_x \in [-1.5, 3.5]$ (thiên về bên phải tạo luồng gió thổi), vận tốc dọc $v_y \in [-2.0, 0.5]$ (hơi bay lên), và tuổi thọ hạt (life duration).
3. **Vòng lặp hoạt họa (`requestAnimationFrame`)**:
   - Cập nhật tọa độ hạt kèm lực cản ma sát không khí và gió lốc.
   - Giảm dần độ trong suốt (`alpha`) của hạt từ $1.0 \rightarrow 0$.
   - Toàn bộ quá trình hoàn tất trong $1200ms$.
4. **Nút Hoàn tác Time Stone (Undo Button)**:
   - Nút tròn xanh ngọc bảo (#00D26A) xuất hiện với vòng tròn quay ngược chiều kim đồng hồ, cho phép người dùng click để khôi phục lại ảnh/dữ liệu ban đầu nếu xóa nhầm.

---

## 2. HIỆU ỨNG NỔ HẠT EMOJI PHẢN HỒI (`EmojiBurstEngine`)

Dùng trong màn hình xem chi tiết ảnh (`PhotoDetailView`):

- **Kích hoạt**: Khi người dùng chạm vào một biểu tượng cảm xúc (❤️, 🔥, 😂, 😮, 😢, 👏).
- **Hành vi vật lý**:
  - Sinh ra từ $15$ đến $25$ icon emoji cùng loại bắn tung ra từ vị trí nút bấm theo hình nan quạt (góc $-60^\circ$ đến $+60^\circ$).
  - Có trọng lực ảo kéo emoji rơi xuống sau khi đạt đỉnh cung parabol.
  - Xoay ngẫu nhiên góc $-45^\circ$ đến $+45^\circ$.
  - Mờ dần và tự hủy khỏi DOM sau $800ms$.

---

## 3. VIỀN CHUYỂN MÀU THƯƠNG HIỆU GEMINI (`GeminiPillBorder`)

Thanh hiển thị trạng thái phân tích AI trên ảnh:

- **Dải màu thương hiệu**: Dải gradient 4 màu đặc trưng của Google Gemini:  
  `linear-gradient(90deg, #4E8752, #D4EB70, #96C2EC, #BA75FF)`.
- **Chuyển động**: Dải gradient liên tục xoay quanh viền con nhộng với chu kỳ $3.0s$ mượt mà bằng CSS `@keyframes rotateGradient` hoặc SVG stroke-dashoffset.
- **Biểu tượng lấp lánh (Sparkle Icon)**: Icon 4 cánh hoa Gemini co dãn nhẹ nhàng `scale(0.95) <-> scale(1.1)` tạo cảm giác "AI đang suy nghĩ trực tiếp".

---

## 4. CỬ CHỈ CẢM ỨNG DI ĐỘNG (MOBILE GESTURES)

### 4.1 Chụm Ngón Tay Zoom Khung Ngắm (Pinch-to-Zoom)
- Lắng nghe cử chỉ chạm 2 ngón tay `TouchMove`.
- Tính khoảng cách Euclid giữa 2 ngón $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.
- Điều chỉnh zoom quang học kỹ thuật số của camera trong khoảng $0.5x$ đến $3.0x$ thông qua `MediaTrackConstraints.zoom` hoặc CSS transform fallback.

### 4.2 Vuốt Dọc Chuyển Ảnh Khoảnh Khắc (Vertical Snap Scroll)
- Cơ chế snap cuộn dọc màn hình: Mỗi bức ảnh chiếm trọn viewport chiều cao.
- Sử dụng Framer Motion `drag="y"` với lực hãm quán tính: Vuốt lên chuyển ảnh tiếp theo, vuốt xuống chuyển về ảnh trước đó.

