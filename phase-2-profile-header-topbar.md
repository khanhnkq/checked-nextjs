# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 2
## Top Navigation Bar & User Identity Header (Màn Hình Profile)
### Dự án: Checked Next.js (`checked-nextjs`) — Chuẩn Parity 1:1 với `ProfileView.swift`

> **Mục tiêu**: Xây dựng toàn diện thanh điều hướng đầu trang (`ProfileTopBar`) với huy hiệu **Checked GOLD** và 3 nút điều hướng thao tác nhanh, cùng khối nhận diện người dùng (`ProfileHeader`) hiển thị ảnh đại diện 80x80 viền xanh Matcha Glow và tên tài khoản.
>
> **Quy tắc thiết kế cốt lõi**:
> - **Zero Border, Zero Blur, Zero Shadow**: Tuyệt đối không dùng `border-*`, `blur-*`, `shadow-*` (ngoại trừ viền stroke của avatar 2px và viền 1.5px của badge Checked GOLD).
> - **Kích thước chạm chuẩn iOS**: Nút bấm kích thước tối thiểu 40x40px, có hiệu ứng nén nhẹ `active:scale-90` và rung xúc giác `haptics.click()`.
> - **TDD (Test-Driven Development)**: Viết test suites độc lập, kiểm thử 100% các trạng thái render và callbacks.

---

### Bảng Đối Chiếu Kiến Trúc Chi Tiết (iOS vs Next.js)

| Thành phần trên iOS (`ProfileView.swift`) | Component Next.js (`checked-nextjs`) | Chi tiết đặc tả & CSS tokens |
| :--- | :--- | :--- |
| `appBar` (Cao 44px, padding ngang 16px) | `ProfileTopBar.tsx` | Khung `w-full h-11 flex items-center justify-between px-4 z-20` |
| Huy hiệu `'Checked GOLD'` | `CheckedGoldBadge` | `px-3 py-1 rounded-xl border-[1.5px] border-primary text-[12px] font-bold font-display text-primary` |
| Nút `person.2.fill` (40x40px) | Nút `Users` icon (40x40px) | Gọi `onFriendsClick()`, rung `haptics.click()`, `active:scale-90` |
| Nút `gearshape.fill` (40x40px) | Nút `Settings` icon (40x40px) | Gọi `onSettingsClick()`, rung `haptics.click()`, `active:scale-90` |
| Nút `chevron.right` (40x40px) | Nút `ChevronRight` icon (40x40px) | Gọi `onCloseClick()`, rung `haptics.click()`, quay lại Camera (`/`) |
| `profileHeader` (Padding ngang 24px) | `ProfileHeader.tsx` | `flex items-center gap-5 px-6 select-none` |
| Avatar tròn viền Matcha Glow 2px | Avatar Outer Ring 80x80px | `w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center p-[3px]` |
| Ảnh đại diện 70x70px | Inner Image 70x70px | `w-[70px] h-[70px] rounded-full object-cover` (Fallback: icon `User` 28px) |
| Display Name (24pt bold rounded) | Tên hiển thị | `text-[24px] font-bold font-display text-text-primary leading-tight` |
| @username (16pt regular gray) | Username | `text-[16px] font-normal text-text-secondary` |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 2

```
src/
└── components/
    └── profile/
        ├── ProfileTopBar.tsx              # Component AppBar Checked GOLD + 3 nút thao tác
        ├── ProfileHeader.tsx              # Component Avatar viền xanh + Tên người dùng
        ├── index.ts                       # Barrel export xuất các component Profile
        └── __tests__/
            ├── profile-top-bar.test.tsx   # Test suite cho ProfileTopBar
            └── profile-header.test.tsx    # Test suite cho ProfileHeader
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

- [x] **Task 1: Xây dựng Component `ProfileTopBar.tsx`**
  - **File**: `src/components/profile/ProfileTopBar.tsx`
  - **Mô tả**:
    - Nhận props:
      ```typescript
      export interface ProfileTopBarProps {
        onFriendsClick?: () => void;
        onSettingsClick?: () => void;
        onCloseClick?: () => void;
        isGoldMember?: boolean;
        className?: string;
      }
      ```
    - Bố cục:
      - Bên trái: Huy hiệu `Checked GOLD` pill viền màu `border-primary` (`#D4EB70`), chữ màu `text-primary`.
      - Bên phải: Cụm 3 nút icon chuẩn 40x40px:
        1. Nút Bạn bè: icon `Users` (Lucide, size 20, strokeWidth 2.2).
        2. Nút Cài đặt: icon `Settings` (Lucide, size 20, strokeWidth 2.2).
        3. Nút Đóng/Thoát: icon `ChevronRight` (Lucide, size 22, strokeWidth 2.5) mang ý nghĩa vuốt sang phải để đóng về Camera.
    - Tương tác: Mỗi nút có `haptics.click()` khi nhấn và hiệu ứng co giãn xúc giác mượt mà `active:scale-90 transition-transform duration-100`.
  - **Verifiable**: Kiểm tra kích thước khung hình chính xác 44px, gọi đúng callback khi người dùng bấm vào từng nút (Đã hoàn thành, 6/6 tests pass).

- [x] **Task 2: Xây dựng Component `ProfileHeader.tsx`**
  - **File**: `src/components/profile/ProfileHeader.tsx`
  - **Mô tả**:
    - Nhận props:
      ```typescript
      export interface ProfileHeaderProps {
        displayName?: string;
        username?: string;
        avatarUrl?: string | null;
        onAvatarClick?: () => void;
        className?: string;
      }
      ```
    - Bố cục:
      - Khối Avatar 80x80px bên trái:
        - Vòng ngoài: `w-20 h-20 rounded-full border-2 border-primary p-[3px] flex items-center justify-center`.
        - Ảnh tròn bên trong: `w-[70px] h-[70px] rounded-full object-cover`.
        - Fallback: Nếu không có `avatarUrl`, hiển thị khối tròn `bg-gray-subtle` kèm icon `User` 28px màu `text-text-secondary`.
        - Nếu có `onAvatarClick`: thêm hiệu ứng nhấn `cursor-pointer active:scale-95 transition-transform`.
      - Cột thông tin bên phải (cách avatar 20px):
        - `displayName`: mặc định `"Người dùng Checked"`, kiểu chữ 24px đậm, bo tròn.
        - `@username`: mặc định `"checked"`, kiểu chữ 16px màu xám `text-text-secondary`.
    - Padding ngang: `px-6` (24px) theo đúng tỉ lệ `ProfileView.swift`.
  - **Verifiable**: Render avatar chuẩn tỉ lệ, kiểm tra hiển thị đúng cả khi có ảnh và khi dùng fallback placeholder (Đã hoàn thành, 7/7 tests pass).

- [x] **Task 3: Thiết lập Barrel Export (`src/components/profile/index.ts`)**
  - **File**: `src/components/profile/index.ts`
  - **Mô tả**:
    - Xuất khẩu toàn bộ các component và type props của Phase 2:
      ```typescript
      export * from './ProfileTopBar';
      export * from './ProfileHeader';
      ```
  - **Verifiable**: Có thể import trực tiếp từ `@/components/profile` mà không cần trỏ đường dẫn file sâu (Đã hoàn thành).

- [x] **Task 4: Xây dựng Bộ Unit Test Suites cho Phase 2**
  - **Files**:
    - `src/components/profile/__tests__/profile-top-bar.test.tsx`
    - `src/components/profile/__tests__/profile-header.test.tsx`
  - **Mô tả**:
    - `profile-top-bar.test.tsx`:
      - Kiểm tra render đúng badge "Checked GOLD".
      - Kiểm tra trigger đúng sự kiện `onFriendsClick`, `onSettingsClick`, `onCloseClick`.
      - Kiểm tra gọi rung haptic khi bấm nút.
    - `profile-header.test.tsx`:
      - Kiểm tra render đúng tên hiển thị và @username.
      - Kiểm tra hiển thị ảnh `<img>` khi có `avatarUrl`.
      - Kiểm tra hiển thị placeholder icon `User` khi `avatarUrl` là null/undefined.
      - Kiểm tra callback `onAvatarClick` khi nhấn vào avatar.
  - **Verifiable**: Toàn bộ unit tests mới pass 100% (Đã hoàn thành, 13/13 tests pass).

- [x] **Task 5: Kiểm tra Tổng thể Phase 2 (Verification Phase)**
  - **Lệnh thực thi**:
    ```bash
    npx vitest run src/components/profile
    npx tsc --noEmit
    npm test
    ```
  - **Tiêu chuẩn hoàn thành**:
    - 100% tests của Phase 2 passed.
    - Toàn bộ test suites của toàn dự án passed (không có regression: 41/41 test files, 271/271 tests passed).
    - TypeScript kiểm tra 0 lỗi biên dịch. (Đã hoàn thành 100%).

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria cho Phase 2)
1. Thanh `ProfileTopBar` cao đúng 44px, huy hiệu Checked GOLD có viền Matcha Glow 1.5px và bo góc chuẩn.
2. 3 nút hành động có vùng chạm tối thiểu 40x40px, phản hồi rung haptic và co giãn xúc giác mượt mà khi nhấn.
3. Avatar trong `ProfileHeader` có kích thước chuẩn 80x80px với viền Matcha Glow 2px, ảnh 70x70px cắt tròn sắc nét.
4. Xử lý fallback hoàn hảo khi người dùng chưa có ảnh đại diện hoặc chưa cập nhật tên hiển thị.
5. 100% Unit Tests passed và TypeScript biên dịch 0 lỗi.
