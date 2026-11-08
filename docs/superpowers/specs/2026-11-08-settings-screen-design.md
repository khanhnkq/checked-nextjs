# Design Specification: Settings Screen (`/settings`) & Blocked Users (`/settings/blocked`)

> **Document Path**: `docs/superpowers/specs/2026-11-08-settings-screen-design.md`  
> **Target Project**: `checked-nextjs` (Next.js 15+ App Router, Tailwind CSS v4, React 19)  
> **Source Parity**: `checked-ios` (`SettingsView.swift`, `BlockedUsersView.swift`, `BlockedUsersViewModel.swift`) & `checked-backend` (`UserController.java`, `FriendshipController.java`)  
> **Status**: Approved Design Specification

---

## 1. Intent & Purpose

The Settings screen (`/settings`) serves as the central account management and application configuration hub in Checked. Accessible via the gear icon `[⚙]` on the Profile top bar (`/profile`), it enables users to:
1. View and update their personal identity (Avatar photo, First Name, Last Name, Display Name, and Date of Birth).
2. Manage privacy controls, specifically inspecting and unblocking previously blocked users (`/settings/blocked`).
3. Configure tactile and sensory preferences (Haptic feedback, Sound effects, Auto-saving photos to device).
4. Safely sign out of the active session with clear confirmation.

The visual architecture strictly adheres to Checked's **Zero Border, Zero Shadow, Zero Blur** design language, using high-contrast Oat Milk (`#EDE9DF`) canvas, crisp White (`#FFFFFF`) rounded card groupings (radius 20–24px), Matcha Glow (`#D4EB70`) primary action buttons, and Coral Red (`#FF5252`) destructive triggers.

---

## 2. Parity Comparison & Feature Scope

### 2.1 Screen Architecture (`/settings`)

```text
┌────────────────────────────────────────────────────────┐
│ [←]                   Cài đặt                          │ (SettingsTopBar 44px)
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │               [ AVATAR 80px 📷 ]                 │  │ (ProfileAvatarBanner)
│  │              Nguyễn Kim Quốc Khánh               │  │
│  │             @khanhnkq · me@example.com           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  TÀI KHOẢN                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 👤  Sửa tên            Quốc Khánh Nguyễn     [>] │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 📅  Sửa ngày sinh      15/08/2000            [>] │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ✉️  Địa chỉ email      khanh@example.com     🔒  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 👥  Mời bạn bè         Tạo liên kết mời      [>] │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 💬  Danh sách bạn bè   Xem bạn thân & chat   [>] │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  RIÊNG TƯ & BẢO MẬT                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🚫  Tài khoản đã bị chặn                     [>] │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  TÙY CHỌN ỨNG DỤNG                                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📳  Rung xúc giác (Haptics)               [ ON ] │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 🔊  Âm thanh hiệu ứng                     [ ON ] │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 💾  Tự động lưu ảnh chụp                 [ OFF ] │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│                     Phiên bản 1.0.0                    │
│                                                        │
│                   [ Đăng xuất ]                        │ (Nút đỏ san hô #FF5252)
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 2.2 Screen Architecture (`/settings/blocked`)

```text
┌────────────────────────────────────────────────────────┐
│ [←]              Tài khoản đã bị chặn                  │ (TopBar 44px)
├────────────────────────────────────────────────────────┤
│                                                        │
│  [ Skeleton Shimmer khi đang tải ]                     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Avatar 44px]  Trần Văn Hùng       [ Bỏ chặn ]   │  │
│  │                @hungtran                         │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ [Avatar 44px]  Lê Bảo Ngọc         [ Bỏ chặn ]   │  │
│  │                @baongoc                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  -- HOẶC EMPTY STATE KHI CHƯA CHẶN AI --               │
│               [ Biểu tượng khiên / 🚫 ]                │
│              Chưa có tài khoản nào bị chặn             │
│   Những người bạn chặn sẽ không thể tìm thấy bạn hoặc  │
│              gửi lời mời kết bạn cho bạn.              │
└────────────────────────────────────────────────────────┘
```

---

## 3. Data Contracts & Backend Mapping

### 3.1 Personal Information Update
- **Endpoint**: `PATCH /api/v1/users/me/settings/personal-info`
- **Request Body**:
  ```json
  {
    "firstName": "Quốc Khánh",
    "lastName": "Nguyễn",
    "username": "khanhnkq",
    "dob": "2000-08-15"
  }
  ```
- **Response**: `UserResponse` (Spring Boot)
- **Local Cache**: Mutates `useAuthStore.user` and invalidates `['/api/v1/users', 'me']`.

### 3.2 Avatar Image Upload
- **Endpoint**: `PATCH /api/v1/users/me/settings/avatar`
- **Content-Type**: `multipart/form-data`
- **Form Key**: `file` (File blob: JPEG/PNG/WEBP, max 5MB).
- **Response**: `UserResponse` with newly signed `avatarUrl` from Garage S3.
- **Client Handling**: Optimistic preview via `URL.createObjectURL`, automatic cleanup on settle.

### 3.3 Blocked Users Management
- **List Blocked**: `GET /api/v1/friendships/blocked` -> Returns `FriendProfile[]`.
- **Unblock User**: `DELETE /api/v1/friendships/{userId}/block` -> HTTP 204 No Content.
- **Cache Invalidation**: Invalidates `['/api/v1/friendships', 'blocked']` and `['/api/v1/friendships', 'friends']`.

### 3.4 Local Preferences Store (`checked-preferences`)
- Persisted in browser `localStorage`:
  - `hapticsEnabled`: `boolean` (default: `true`)
  - `soundEnabled`: `boolean` (default: `true`)
  - `autoSavePhotos`: `boolean` (default: `false`)

---

## 4. UI/UX Specifications

1. **Top Bar Header (`SettingsTopBar`)**:
   - Fixed height 56px, max-w-md centered.
   - Back button: 44x44px circular `#FFFFFF` button with dark chevron left icon.
   - Title: 18px font-bold, centered.
   - Right side spacer: 44px empty block to maintain exact center alignment.

2. **Card Container (`SettingsSection`)**:
   - `bg-surface` (`#FFFFFF`), `rounded-[22px]`, `overflow-hidden`.
   - Section header: 12px uppercase tracking-wider font-semibold text-text-secondary, 16px left padding, 8px bottom padding.
   - Row dividers: 1px divider inset 52px from left (aligns with text content, past the 32px icon circle).

3. **Settings Row (`SettingsTile`)**:
   - Left Icon: 32x32px circular pill with 5% dark tint `bg-black/5` or `bg-surface-subtle`, containing Lucide icon (16px).
   - Label: 15px font-medium `text-text-primary`.
   - Subtitle: 12px `text-text-secondary` (e.g., current value or description).
   - Right action: Chevron right icon (`text-text-secondary`), Lock icon for email, or Matcha Glow iOS-style toggle switch for boolean preferences.
   - Active state: `active:bg-black/5 transition-colors duration-100`.

4. **Name Input Bottom Sheet (`NameInputBottomSheet`)**:
   - Embedded within `BaseBottomSheet`.
   - Two rounded input fields: "Họ" (First name / Last name) and "Tên" (First name).
   - Validation: Not empty, trimmed, max 50 chars.
   - Matcha Glow 52px save button with loading indicator.

5. **Date of Birth Bottom Sheet (`DobInputBottomSheet`)**:
   - Embedded within `BaseBottomSheet`.
   - Date picker input / 3-column input with validation (must be in the past, age >= 10).
   - Formatted Vietnamese display string (e.g. "15 tháng 8, 2000").
   - Matcha Glow 52px save button.

6. **Logout Confirmation Dialog (`LogoutConfirmDialog`)**:
   - Non-intrusive action sheet / bottom confirmation card.
   - Clear warning: "Đăng xuất khỏi tài khoản Checked trên thiết bị này?"
   - Cancel button (white rounded surface) + Confirm Logout button (Coral Red `#FF5252` with bold text).
