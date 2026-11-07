# Kế Hoạch Thiết Kế Lại TopBar Profile & Loại Bỏ Huy Hiệu Gold

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## 1. Mục Tiêu & Bối Cảnh (Context & Goals)

### Bối cảnh hiện tại:
1. **Sự không đồng bộ về điều hướng (Navigation Inconsistency)**:
   - Trên toàn bộ ứng dụng Checked (`/calorie`, `/expense`, `/invite`, `/friends/requests`, `/u/[username]`), nút Quay lại (Back button) luôn nằm ở **Góc trên bên trái** với kích thước chuẩn **44x44px** (`w-11 h-11 rounded-full bg-surface text-text-primary active:scale-95 transition-transform`) sử dụng icon `ChevronLeft`.
   - Riêng màn hình Profile chính (`/profile` - `ProfileTopBar.tsx`), nút đóng/quay lại về camera hiện tại lại đặt ở **Góc phải cùng** với icon `ChevronRight`, kích thước nhỏ 40x40px (`w-10 h-10`), không có nền `bg-surface`, tạo cảm giác nghịch chiều và lệch chuẩn trải nghiệm người dùng iOS/Checked.
   - Góc trái của `/profile` hiện tại đang đặt huy hiệu viền `border-[1.5px] border-primary` `Checked GOLD` (vi phạm nguyên tắc Flat Design System: Zero Border, và tính năng Gold membership hiện chưa cần thiết).
2. **Dư thừa thông tin trên Header Public Profile (`/u/[username]`)**:
   - Header topbar hiển thị `@username` ở giữa trong khi thẻ Profile Card ngay phía dưới đã có avatar lớn, họ tên đầy đủ và `@username` to rõ nét.
   - Trên avatar của `/u/[username]` có gắn icon vương miện Gold (`Crown` badge) cần được loại bỏ.

### Mục tiêu sau khi hoàn thành:
- **Chuẩn hóa 1:1 hệ thống nút TopBar**:
  - **Nút Back / Thoát**: Đặt ở góc trên bên trái, chuẩn 44x44px (`w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform`), icon `ChevronLeft` stroke 2.5.
  - **Cụm nút Hành động (Action buttons)**: Đặt ở góc trên bên phải gồm 2 nút: Bạn bè (`Users`) và Cài đặt (`Settings`), đồng bộ kích thước 44x44px (`w-11 h-11 rounded-full bg-surface text-text-primary active:scale-95 transition-transform`), khoảng cách `gap-2`.
- **Loại bỏ tính năng Gold chưa cần thiết**:
  - Gỡ bỏ hoàn toàn huy hiệu `Checked GOLD` ở `ProfileTopBar.tsx` và `ProfilePage.tsx`.
  - Gỡ bỏ huy hiệu vương miện `Crown` (`gold-crown-badge`) trên avatar trang `/u/[username]`.
- **Bảo toàn 100% kiểm thử**:
  - Cập nhật các bộ unit test liên quan (`profile-top-bar.test.tsx`, `profile-page.test.tsx`, `user-profile-page.test.tsx`).
  - Đảm bảo `npx tsc --noEmit` 0 lỗi và 100% vitest pass.

---

## 2. Kiến Trúc & Thiết Kế Giao Diện Mới (Design Spec)

### So sánh Bố Cục `ProfileTopBar` (Trước vs Sau):

```
[Hiện tại - Chưa đồng bộ]:
+--------------------------------------------------------------+
| [Checked GOLD (Border 1.5px)]      (Users) (Settings) ( > )  |
+--------------------------------------------------------------+

[Mới - Đồng bộ 100% Flat Design System]:
+--------------------------------------------------------------+
| (< Back tròn 44px)                       (Users 44px) (⚙ 44px)|
+--------------------------------------------------------------+
```

### Chi tiết Component `ProfileTopBar`:
- **Container**: `w-full h-14 flex items-center justify-between px-4 z-20 select-none flex-shrink-0 bg-transparent`
- **Cụm Bên Trái (Left)**:
  - Nút Back / Thoát về Camera (`onCloseClick`):
    - Class: `w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform cursor-pointer border-0 focus:outline-none`
    - Icon: `ChevronLeft size={22} strokeWidth={2.5}`
    - `aria-label="Quay lại"`
- **Cụm Bên Phải (Right)**:
  - Container: `flex items-center gap-2`
  - Nút Bạn bè (`onFriendsClick`):
    - Class: `w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform cursor-pointer border-0 focus:outline-none`
    - Icon: `Users size={20} strokeWidth={2.2}`
    - `aria-label="Bạn bè"`
  - Nút Cài đặt (`onSettingsClick`):
    - Class: `w-11 h-11 rounded-full bg-surface flex items-center justify-center text-text-primary active:scale-95 transition-transform cursor-pointer border-0 focus:outline-none`
    - Icon: `Settings size={20} strokeWidth={2.2}`
    - `aria-label="Cài đặt"`

---

## 3. Danh Sách Tệp Thay Đổi (Files to Modify)

| Tệp | Trách nhiệm thay đổi |
|---|---|
| `src/components/profile/ProfileTopBar.tsx` | Chuyển nút Back sang bên trái (44x44px, ChevronLeft), đưa nút Users & Settings sang phải (44x44px), xóa huy hiệu Checked GOLD |
| `src/components/profile/__tests__/profile-top-bar.test.tsx` | Cập nhật test case: vị trí nút, aria-label, kiểm tra không còn huy hiệu GOLD |
| `src/app/profile/page.tsx` | Cập nhật TopBar skeleton (thay thế placeholder gold badge bằng cụm nút 44px chuẩn) |
| `src/app/profile/__tests__/profile-page.test.tsx` | Cập nhật test case loại bỏ assertion `Checked GOLD` |
| `src/app/u/[username]/page.tsx` | Gỡ bỏ icon vương miện `Crown` / `gold-crown-badge` trên avatar |
| `src/app/u/__tests__/user-profile-page.test.tsx` | Cập nhật test case loại bỏ assertion `gold-crown-badge` |

---

## 4. Kế Hoạch Thực Hiện Từng Bước (Bite-sized Tasks)

### Task 1: Tái thiết kế `ProfileTopBar` và cập nhật Unit Tests (TDD)
- [ ] **Step 1.1**: Sửa file `src/components/profile/__tests__/profile-top-bar.test.tsx` phản ánh cấu trúc mới:
  - Xóa test kiểm tra "Checked GOLD" badge.
  - Thêm test kiểm tra nút Back nằm ở đầu với aria-label "Quay lại" và icon `ChevronLeft`.
  - Kiểm tra 2 nút chức năng Bạn bè (`Users`) và Cài đặt (`Settings`).
  - Kiểm tra kích thước `w-11 h-11` và `active:scale-95`.
- [ ] **Step 1.2**: Chạy test để xác nhận test FAIL theo đúng quy trình TDD:
  ```bash
  npx vitest run src/components/profile/__tests__/profile-top-bar.test.tsx
  ```
- [ ] **Step 1.3**: Tái cấu trúc `src/components/profile/ProfileTopBar.tsx`:
  - Thay thế icon `ChevronRight` bằng `ChevronLeft`.
  - Di chuyển nút Back sang góc trái.
  - Tạo cụm nút hành động bên phải gồm `Users` và `Settings` với kích thước `w-11 h-11 bg-surface rounded-full`.
  - Xóa hoàn toàn khối render huy hiệu `Checked GOLD`.
- [ ] **Step 1.4**: Chạy lại test `profile-top-bar.test.tsx` để xác nhận PASS 100%.
- [ ] **Step 1.5**: Commit Task 1:
  ```bash
  git add src/components/profile/ProfileTopBar.tsx src/components/profile/__tests__/profile-top-bar.test.tsx
  git commit -m "feat(profile): redesign ProfileTopBar with unified 44px back button and remove gold badge"
  ```

---

### Task 2: Cập nhật Profile Skeleton trong `src/app/profile/page.tsx` & Test
- [ ] **Step 2.1**: Trong `src/app/profile/page.tsx`:
  - Cập nhật TopBar skeleton tại lines 66-73: đổi layout từ (40px + 130x32 badge + 2x40px) thành (1 nút tròn 44px bên trái + 2 nút tròn 44px bên phải với `gap-2`).
- [ ] **Step 2.2**: Trong `src/app/profile/__tests__/profile-page.test.tsx`:
  - Xóa assertion `expect(screen.getByText('Checked GOLD')).toBeInTheDocument();`.
  - Kiểm tra nút "Quay lại" có mặt trong tài liệu.
- [ ] **Step 2.3**: Chạy test `profile-page.test.tsx`:
  ```bash
  npx vitest run src/app/profile/__tests__/profile-page.test.tsx
  ```
- [ ] **Step 2.4**: Commit Task 2:
  ```bash
  git add src/app/profile/page.tsx src/app/profile/__tests__/profile-page.test.tsx
  git commit -m "fix(profile): update profile skeleton to match unified topbar and remove gold assertion"
  ```

---

### Task 3: Gỡ bỏ Vương miện Gold trên trang Public Profile (`/u/[username]`)
- [ ] **Step 3.1**: Trong `src/app/u/[username]/page.tsx`:
  - Xóa block render `{profile.isGoldMember && (<div data-testid="gold-crown-badge">...</div>)}`.
  - Xóa import `Crown` không còn sử dụng từ `lucide-react`.
- [ ] **Step 3.2**: Trong `src/app/u/__tests__/user-profile-page.test.tsx`:
  - Sửa test case "hiển thị đầy đủ thông tin: họ tên, username, avatar ảnh" -> loại bỏ kỳ vọng `gold-crown-badge`.
  - Xóa hoặc cập nhật test case kiểm tra vương miện khi không phải gold member.
- [ ] **Step 3.3**: Chạy test `user-profile-page.test.tsx`:
  ```bash
  npx vitest run src/app/u/__tests__/user-profile-page.test.tsx
  ```
- [ ] **Step 3.4**: Commit Task 3:
  ```bash
  git add "src/app/u/[username]/page.tsx" src/app/u/__tests__/user-profile-page.test.tsx
  git commit -m "fix(profile): remove gold crown badge from public profile page"
  ```

---

### Task 4: Kiểm Thử Toàn Diện & Typecheck (Verification)
- [ ] **Step 4.1**: Chạy kiểm tra kiểu tĩnh TypeScript:
  ```bash
  npx tsc --noEmit
  ```
- [ ] **Step 4.2**: Chạy toàn bộ test suite của Profile và Friendship:
  ```bash
  npx vitest run src/components/profile/ src/app/profile/ src/app/u/
  ```
- [ ] **Step 4.3**: Chạy `npm run build` để xác nhận Next.js build sản phẩm sạch hoàn toàn không có lỗi bundle.

---

## 5. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. **Trải nghiệm điều hướng đồng nhất**:
   - Tất cả màn hình `/profile`, `/u/[username]`, `/calorie`, `/expense`, `/invite`, `/friends/requests` đều có nút Back ở góc trên bên trái, chuẩn 44x44px `bg-surface` tròn với icon `ChevronLeft`.
2. **Loại bỏ hoàn toàn Gold**:
   - Không còn chữ "Checked GOLD" ở topbar profile.
   - Không còn icon vương miện vàng trên avatar profile công khai.
3. **Flat Design System**:
   - Zero Border, Zero Shadow, Zero Blur trên toàn bộ các nút điều hướng TopBar.
4. **Chất lượng mã nguồn**:
   - TypeScript `tsc --noEmit` hoàn toàn không có lỗi.
   - Tất cả các bài kiểm thử tự động (Unit / Integration tests) đều vượt qua (100% PASS).
