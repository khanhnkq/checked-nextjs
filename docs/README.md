# 📚 Checked Web (Next.js) - Documentation Portal

> **Dự án**: Checked Web Client UI  
> **Phiên bản kiến trúc**: Next.js 15+ App Router, React 19, Tailwind CSS v4, TypeScript  
> **Hệ sinh thái đối chiếu**: `checked-ios` (SwiftUI) & `checked-backend` (Spring Boot 3.3)  
> **Nguyên tắc triển khai**: **Specification-First** (Hoàn thiện tài liệu hóa chuẩn mực trước khi lập trình)

---

## 🗺️ Bản Đồ Tài Liệu Kỹ Thuật

Hệ thống tài liệu được phân cấp theo 5 module bài bản:

```text
docs/
├── README.md                                  # Cổng điều hướng tài liệu tổng quan
│
├── design-system/                             # Ngôn ngữ thiết kế & hệ thống Token
│   ├── DESIGN_TOKENS.md                       # Màu sắc, font chữ, kích thước, bo góc, bóng mờ
│   ├── COMPONENTS_SPECIFICATION.md            # Đặc tả kỹ thuật các UI Components & Primitives
│   └── MICRO_INTERACTIONS_AND_ANIMATIONS.md   # Thanos Snap, Sticker Cutout, Emoji Physics, Gestures
│
├── architecture/                              # Kiến trúc hệ thống & giải pháp kỹ thuật
│   ├── SYSTEM_ARCHITECTURE.md                 # Luồng SSR/CSR, PWA Standalone, Caching Strategy
│   ├── AUTHENTICATION_AND_SECURITY.md         # JWT lifecycle, Silent Refresh, Route Guards
│   ├── STATE_MANAGEMENT.md                    # Zustand UI store + TanStack Query + IndexedDB
│   └── REALTIME_WEBSOCKET_STOMP.md            # STOMP Broker, kết nối SockJS, channels, retry
│
├── screens/                                   # Đặc tả chi tiết từng màn hình & modal (23 Screens)
│   ├── SCREENS_CATALOG.md                     # Ma trận tổng hợp 23 màn hình, route, state
│   ├── 01_AUTH_FLOW.md                        # Đăng nhập, Đăng ký, OTP, Hoàn thiện hồ sơ
│   ├── 02_HOME_CAMERA_VIEWFINDER.md           # Khung camera 1:1, Nút Matcha Glow, Filter Pill
│   ├── 03_IMAGE_PREVIEW_AND_AI.md             # Xem trước, Gemini AI, Sticker, 5 Sheets chỉnh sửa
│   ├── 04_HISTORY_AND_PHOTO_DETAIL.md         # Lưới 3 cột, xem ảnh vuốt dọc, Emoji burst reactions
│   ├── 05_EXPENSE_DASHBOARD.md                # Quản lý dòng tiền, hạn mức ngân sách, cảnh báo
│   ├── 06_CALORIE_DASHBOARD.md                # Theo dõi calo, macros (đạm/đường/béo), 4 bữa ăn
│   ├── 07_CHAT_AND_MESSAGING.md               # Danh sách chat, phòng chat 1-1 STOMP, quote, revoke
│   ├── 08_FRIENDSHIP_AND_SOCIAL.md            # Mã QR, chia sẻ link, duyệt kết bạn, trang cá nhân
│   └── 09_PROFILE_AND_SETTINGS.md             # Hồ sơ cá nhân, streak, cài đặt ứng dụng
│
├── api-and-models/                            # Giao thức API, DTOs & Trí tuệ nhân tạo
│   ├── DATA_MODELS_AND_DTOS.md                # TypeScript Types 1:1 với Swift & Java DTOs
│   ├── API_CONTRACT_MAPPING.md                # Bảng đối chiếu Endpoint backend, tham số, mã lỗi
│   └── GEMINI_AI_SPECS.md                     # System Prompts, JSON Schemas cho OCR & Món ăn
│
└── roadmap/                                   # Lộ trình & Tiêu chuẩn nghiệm thu
    └── MIGRATION_ROADMAP_AND_CHECKLIST.md     # 10 Phase triển khai chi tiết & Quality Gates
```

---

## 🎯 Mục Tiêu Thiết Kế Của Phiên Bản Web

1. **Parity Tuyệt Đối với iOS**: Giữ nguyên vẹn cảm xúc người dùng, từ màu sắc **Oat Milk Warm Canvas** (`#EDE9DF`) đến điểm nhấn tươi mới **Matcha Glow** (`#D4EB70`), độ nảy khi chạm (`scale-95`) và tỷ lệ vuông vắn `1:1`.
2. **Khả Năng Chạy Trên Thiết Bị Di Động Tối Ưu (PWA First)**: Trải nghiệm như một app native trên Safari iOS và Chrome Android không xuất hiện thanh điều hướng trình duyệt.
3. **Phân Tách Rõ Ràng Giữa Server & Client**: Tối ưu SSR cho metadata/deep-link và CSR cho các tương tác camera/chat thời gian thực.
4. **Không Thất Thoát Dữ Liệu AI Cục Bộ**: Lưu trữ trọn vẹn chi tiết từng món trong hóa đơn và các chỉ số calo đa lượng (Macros) tương thích tuyệt đối với Backend.

