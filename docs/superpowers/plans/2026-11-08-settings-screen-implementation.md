# Settings Screen & Account Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Settings screen (`/settings`) and Blocked Users screen (`/settings/blocked`) with 100% visual and functional parity with `checked-ios` (`SettingsView.swift` & `BlockedUsersView.swift`), backed by Spring Boot REST APIs (`/api/v1/users/me/settings/*` & `/api/v1/friendships/blocked`).

**Architecture:** The Settings module provides profile customization, sensory preferences, privacy controls, and secure session management. It features an avatar uploader with optimistic preview, bottom sheets for editing personal information (`firstName`, `lastName`, `dob`), a local preferences store persisted via Zustand, and a dedicated blocked users sub-page with real-time unblock actions.

**Tech Stack:** Next.js 15+ (App Router, React 19), Tailwind CSS v4, Zustand (`zustand/middleware/persist`), `@tanstack/react-query`, Lucide React, Vitest & React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-08-settings-screen-design.md`

## Global Constraints

- Design Tokens: Canvas `#EDE9DF` (Oat Milk), Surface `#FFFFFF`, Accent/Primary `#D4EB70` (Matcha Glow), Text `#141613`, Danger `#FF5252` (Coral Red), Zero Border, Zero Shadow, Zero Blur.
- Touch target: Minimum 44x44px for buttons, tactile haptic feedback (`haptics.light() / haptics.click()`) on interactive rows and toggles.
- Avatar upload: Must support image files (JPEG, PNG, WEBP), client-side file size guard (max 5MB), and multipart/form-data upload via `PATCH /api/v1/users/me/settings/avatar`.
- Route Guard: Unauthenticated users visiting `/settings` or `/settings/blocked` must be redirected to `/login?redirect=/settings`.
- Date of Birth format: Must strictly use `YYYY-MM-DD` for backend serialization, displayed to users in localized format (e.g. `15/08/2000`).

## Review Focus

1. **Avatar Upload Failure Handling**: If an image upload fails (e.g. network timeout or >5MB), optimistic preview must revert immediately to the previous avatar and show an informative toast/error.
2. **Whitespace and Empty Name Validation**: Submitting an empty string or whitespace-only first/last name in `NameInputBottomSheet` must be disabled and rejected client-side before calling the API.
3. **Future Date of Birth Guard**: Selecting a date in the future or within the last 10 years must be disallowed by the date picker or input validation.
4. **Session Cleanup upon Logout**: Logout must clear `checked_token` cookie, clear Zustand `auth-store`, cancel any pending queries, and redirect immediately to `/login`.
5. **Blocked Users Empty State & Unblock Invalidation**: Unblocking a user from `/settings/blocked` must immediately update the list, remove the row, and show the empty state if zero blocked users remain.

---

### Task 1: Preferences Store & User Settings API Client

**Files:**
- Create: `src/stores/preferences-store.ts`
- Create: `src/lib/api/user-settings-api.ts`
- Modify: `src/types/user.ts`
- Test: `src/stores/__tests__/preferences-store.test.ts`
- Test: `src/lib/api/__tests__/user-settings-api.test.ts`

**Interfaces:**
- `UserPreferencesState`: `{ hapticsEnabled: boolean, soundEnabled: boolean, autoSavePhotos: boolean }`
- `updatePersonalInfo(data: UpdatePersonalInfoRequest): Promise<User>`
- `uploadAvatar(file: File): Promise<User>`

- [ ] **Step 1: Write the failing tests for `preferences-store` and `user-settings-api`**

```typescript
// src/stores/__tests__/preferences-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferencesStore } from '../preferences-store';

describe('usePreferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      hapticsEnabled: true,
      soundEnabled: true,
      autoSavePhotos: false,
    });
  });

  it('initializes with default settings', () => {
    const state = usePreferencesStore.getState();
    expect(state.hapticsEnabled).toBe(true);
    expect(state.soundEnabled).toBe(true);
    expect(state.autoSavePhotos).toBe(false);
  });

  it('toggles haptics, sound, and autoSavePhotos', () => {
    const { setHapticsEnabled, setSoundEnabled, setAutoSavePhotos } = usePreferencesStore.getState();
    setHapticsEnabled(false);
    expect(usePreferencesStore.getState().hapticsEnabled).toBe(false);

    setSoundEnabled(false);
    expect(usePreferencesStore.getState().soundEnabled).toBe(false);

    setAutoSavePhotos(true);
    expect(usePreferencesStore.getState().autoSavePhotos).toBe(true);
  });
});
```

```typescript
// src/lib/api/__tests__/user-settings-api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userSettingsApi from '../user-settings-api';
import { customFetcher } from '../custom-fetcher';

vi.mock('../custom-fetcher', () => ({
  customFetcher: vi.fn(),
}));

describe('user-settings-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updatePersonalInfo calls PATCH /api/v1/users/me/settings/personal-info', async () => {
    const payload = { firstName: 'Khánh', lastName: 'Nguyễn', dob: '2000-08-15' };
    const mockUser = { id: 'u1', firstName: 'Khánh', lastName: 'Nguyễn', displayName: 'Khánh Nguyễn' };
    vi.mocked(customFetcher).mockResolvedValueOnce(mockUser);

    const result = await userSettingsApi.updatePersonalInfo(payload);
    expect(customFetcher).toHaveBeenCalledWith('/api/v1/users/me/settings/personal-info', expect.objectContaining({
      method: 'PATCH',
      data: payload,
    }));
    expect(result).toEqual(mockUser);
  });

  it('uploadAvatar calls PATCH /api/v1/users/me/settings/avatar with FormData', async () => {
    const file = new File(['test'], 'avatar.png', { type: 'image/png' });
    const mockUser = { id: 'u1', avatarUrl: 'https://cdn/avatar.png' };
    vi.mocked(customFetcher).mockResolvedValueOnce(mockUser);

    const result = await userSettingsApi.uploadAvatar(file);
    expect(customFetcher).toHaveBeenCalledWith('/api/v1/users/me/settings/avatar', expect.objectContaining({
      method: 'PATCH',
      data: expect.any(FormData),
    }));
    expect(result).toEqual(mockUser);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/stores/__tests__/preferences-store.test.ts src/lib/api/__tests__/user-settings-api.test.ts
```

- [ ] **Step 3: Implement `preferences-store.ts`, `user-settings-api.ts`, and update `src/types/user.ts`**

Update `src/types/user.ts` to include `dob?: string | null;`.
Create `src/stores/preferences-store.ts` with Zustand `persist` middleware.
Create `src/lib/api/user-settings-api.ts` wrapping `customFetcher`.

- [ ] **Step 4: Run test to confirm pass**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/stores/__tests__/preferences-store.test.ts src/lib/api/__tests__/user-settings-api.test.ts
```

- [ ] **Step 5: Commit changes**

```bash
git add src/types/user.ts src/stores/preferences-store.ts src/lib/api/user-settings-api.ts src/stores/__tests__/preferences-store.test.ts src/lib/api/__tests__/user-settings-api.test.ts
git commit -m "feat(settings): add preferences store and user settings api client"
```

---

### Task 2: Reusable Settings UI Tiles & Section Containers

**Files:**
- Create: `src/components/settings/SettingsTopBar.tsx`
- Create: `src/components/settings/SettingsSection.tsx`
- Create: `src/components/settings/SettingsTile.tsx`
- Create: `src/components/settings/ProfileAvatarBanner.tsx`
- Create: `src/components/settings/index.ts`
- Test: `src/components/settings/__tests__/settings-components.test.tsx`

**Interfaces:**
- `SettingsTopBarProps`: `{ onBack: () => void, title?: string }`
- `SettingsSectionProps`: `{ title?: string, children: React.ReactNode, className?: string }`
- `SettingsTileProps`: `{ icon: React.ReactNode, title: string, subtitle?: string, value?: string, isSwitch?: boolean, switchChecked?: boolean, onSwitchChange?: (val: boolean) => void, onClick?: () => void, isDestructive?: boolean, showChevron?: boolean }`
- `ProfileAvatarBannerProps`: `{ user: User | null, onAvatarUpload: (file: File) => void | Promise<void>, isUploading?: boolean }`

- [ ] **Step 1: Write the failing tests for Settings components**

```typescript
// src/components/settings/__tests__/settings-components.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsTopBar } from '../SettingsTopBar';
import { SettingsSection } from '../SettingsSection';
import { SettingsTile } from '../SettingsTile';
import { ProfileAvatarBanner } from '../ProfileAvatarBanner';
import { User, Bell } from 'lucide-react';

describe('Settings Components', () => {
  it('renders SettingsTopBar and handles onBack', () => {
    const handleBack = vi.fn();
    render(<SettingsTopBar onBack={handleBack} title="Cài đặt" />);

    expect(screen.getByText('Cài đặt')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Quay lại'));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders SettingsSection with section title and children', () => {
    render(
      <SettingsSection title="Tài khoản">
        <div>Content item</div>
      </SettingsSection>
    );

    expect(screen.getByText('TÀI KHOẢN')).toBeInTheDocument();
    expect(screen.getByText('Content item')).toBeInTheDocument();
  });

  it('renders SettingsTile as a clickable row', () => {
    const handleClick = vi.fn();
    render(
      <SettingsTile
        icon={<User size={16} />}
        title="Sửa tên"
        subtitle="Nguyễn Văn A"
        onClick={handleClick}
      />
    );

    expect(screen.getByText('Sửa tên')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sửa tên'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders SettingsTile as a switch toggle and triggers onSwitchChange', () => {
    const handleChange = vi.fn();
    render(
      <SettingsTile
        icon={<Bell size={16} />}
        title="Rung xúc giác"
        isSwitch={true}
        switchChecked={true}
        onSwitchChange={handleChange}
      />
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('renders ProfileAvatarBanner and triggers file upload on selection', () => {
    const handleUpload = vi.fn();
    const mockUser = {
      id: 'u1',
      username: 'khanh',
      displayName: 'Khánh Nguyễn',
      email: 'khanh@example.com',
      avatarUrl: null,
      isVerified: true,
      profileCompleted: true,
      isGoldMember: false,
    };

    render(<ProfileAvatarBanner user={mockUser} onAvatarUpload={handleUpload} />);

    expect(screen.getByText('Khánh Nguyễn')).toBeInTheDocument();
    expect(screen.getByText('@khanh · khanh@example.com')).toBeInTheDocument();

    const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
    const input = screen.getByTestId('avatar-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleUpload).toHaveBeenCalledWith(file);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/components/settings/__tests__/settings-components.test.tsx
```

- [ ] **Step 3: Implement Settings UI components**

Create `SettingsTopBar.tsx`, `SettingsSection.tsx`, `SettingsTile.tsx`, `ProfileAvatarBanner.tsx`, and export from `src/components/settings/index.ts`.
Follow Zero Border, Zero Shadow, Zero Blur styling.
Provide tactile active feedback and accessibility attributes (`role="switch"`, `aria-checked`).

- [ ] **Step 4: Run test to confirm pass**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/components/settings/__tests__/settings-components.test.tsx
```

- [ ] **Step 5: Commit changes**

```bash
git add src/components/settings/
git commit -m "feat(settings): add reusable topbar, section, tile and avatar banner"
```

---

### Task 3: Bottom Sheets for Profile Personal Info (`NameInputBottomSheet` & `DobInputBottomSheet`)

**Files:**
- Create: `src/components/settings/NameInputBottomSheet.tsx`
- Create: `src/components/settings/DobInputBottomSheet.tsx`
- Modify: `src/components/settings/index.ts`
- Test: `src/components/settings/__tests__/name-input-bottom-sheet.test.tsx`
- Test: `src/components/settings/__tests__/dob-input-bottom-sheet.test.tsx`

**Interfaces:**
- `NameInputBottomSheetProps`: `{ isOpen: boolean, onDismiss: () => void, currentFirstName?: string, currentLastName?: string, onSave: (firstName: string, lastName: string) => Promise<void> | void }`
- `DobInputBottomSheetProps`: `{ isOpen: boolean, onDismiss: () => void, currentDob?: string | null, onSave: (dob: string) => Promise<void> | void }`

- [ ] **Step 1: Write the failing tests for `NameInputBottomSheet` and `DobInputBottomSheet`**

```typescript
// src/components/settings/__tests__/name-input-bottom-sheet.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NameInputBottomSheet } from '../NameInputBottomSheet';

describe('NameInputBottomSheet', () => {
  it('renders inputs populated with current names and saves on submit', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleDismiss = vi.fn();

    render(
      <NameInputBottomSheet
        isOpen={true}
        onDismiss={handleDismiss}
        currentFirstName="Khánh"
        currentLastName="Nguyễn"
        onSave={handleSave}
      />
    );

    const firstInput = screen.getByPlaceholderText('Tên (First name)');
    const lastInput = screen.getByPlaceholderText('Họ và tên đệm (Last name)');

    expect(firstInput).toHaveValue('Khánh');
    expect(lastInput).toHaveValue('Nguyễn');

    fireEvent.change(firstInput, { target: { value: 'Minh' } });
    fireEvent.change(lastInput, { target: { value: 'Trần' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith('Minh', 'Trần');
    });
  });

  it('disables save button when first name is empty', () => {
    render(
      <NameInputBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        currentFirstName=""
        currentLastName="Nguyễn"
        onSave={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    expect(saveBtn).toBeDisabled();
  });
});
```

```typescript
// src/components/settings/__tests__/dob-input-bottom-sheet.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DobInputBottomSheet } from '../DobInputBottomSheet';

describe('DobInputBottomSheet', () => {
  it('renders date picker input with current date and saves valid date', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleDismiss = vi.fn();

    render(
      <DobInputBottomSheet
        isOpen={true}
        onDismiss={handleDismiss}
        currentDob="2000-08-15"
        onSave={handleSave}
      />
    );

    const dateInput = screen.getByTestId('dob-date-input');
    expect(dateInput).toHaveValue('2000-08-15');

    fireEvent.change(dateInput, { target: { value: '1998-05-20' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu ngày sinh/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith('1998-05-20');
    });
  });

  it('disables save button if date is in the future', () => {
    render(
      <DobInputBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        currentDob="2099-01-01"
        onSave={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Lưu ngày sinh/i });
    expect(saveBtn).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/components/settings/__tests__/name-input-bottom-sheet.test.tsx src/components/settings/__tests__/dob-input-bottom-sheet.test.tsx
```

- [ ] **Step 3: Implement `NameInputBottomSheet` and `DobInputBottomSheet`**

Build on top of `BaseBottomSheet`.
Provide clean input cards, placeholder guidance, loading spinners on save, and validation errors.

- [ ] **Step 4: Run test to confirm pass**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/components/settings/__tests__/name-input-bottom-sheet.test.tsx src/components/settings/__tests__/dob-input-bottom-sheet.test.tsx
```

- [ ] **Step 5: Commit changes**

```bash
git add src/components/settings/NameInputBottomSheet.tsx src/components/settings/DobInputBottomSheet.tsx src/components/settings/index.ts src/components/settings/__tests__/
git commit -m "feat(settings): add name and dob edit bottom sheets"
```

---

### Task 4: Logout Confirmation Dialog & User Settings Hook

**Files:**
- Create: `src/components/settings/LogoutConfirmDialog.tsx`
- Create: `src/hooks/useSettingsActions.ts`
- Modify: `src/components/settings/index.ts`
- Test: `src/components/settings/__tests__/logout-confirm-dialog.test.tsx`
- Test: `src/hooks/__tests__/useSettingsActions.test.tsx`

**Interfaces:**
- `LogoutConfirmDialogProps`: `{ isOpen: boolean, onDismiss: () => void, onConfirmLogout: () => void, isLoading?: boolean }`
- `UseSettingsActionsReturn`: `{ updateName, updateDob, uploadAvatarFile, logoutAccount, isUpdating, isUploadingAvatar }`

- [ ] **Step 1: Write the failing tests for `LogoutConfirmDialog` and `useSettingsActions`**

```typescript
// src/components/settings/__tests__/logout-confirm-dialog.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LogoutConfirmDialog } from '../LogoutConfirmDialog';

describe('LogoutConfirmDialog', () => {
  it('renders confirmation text, cancel and logout buttons', () => {
    const handleCancel = vi.fn();
    const handleLogout = vi.fn();

    render(
      <LogoutConfirmDialog
        isOpen={true}
        onDismiss={handleCancel}
        onConfirmLogout={handleLogout}
      />
    );

    expect(screen.getByText('Đăng xuất tài khoản?')).toBeInTheDocument();
    expect(screen.getByText('Bạn có chắc chắn muốn đăng xuất khỏi Checked trên thiết bị này?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Hủy/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/i }));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
```

```typescript
// src/hooks/__tests__/useSettingsActions.test.tsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettingsActions } from '../useSettingsActions';
import { useAuthStore } from '@/stores/auth-store';
import * as userSettingsApi from '@/lib/api/user-settings-api';

vi.mock('@/lib/api/user-settings-api');

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
}));

describe('useSettingsActions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'u1', username: 'me', displayName: 'Me', email: 'me@example.com' } as any,
      isAuthenticated: true,
      accessToken: 'token-123',
    });
  });

  it('updates name and updates auth store user', async () => {
    const updated = { id: 'u1', firstName: 'Khánh', lastName: 'Nguyễn', displayName: 'Khánh Nguyễn' };
    vi.mocked(userSettingsApi.updatePersonalInfo).mockResolvedValueOnce(updated as any);

    const { result } = renderHook(() => useSettingsActions());
    await act(async () => {
      await result.current.updateName('Khánh', 'Nguyễn');
    });

    expect(userSettingsApi.updatePersonalInfo).toHaveBeenCalledWith(expect.objectContaining({
      firstName: 'Khánh',
      lastName: 'Nguyễn',
    }));
    expect(useAuthStore.getState().user?.displayName).toBe('Khánh Nguyễn');
  });

  it('logs out and redirects to /login', async () => {
    const { result } = renderHook(() => useSettingsActions());
    await act(async () => {
      result.current.logoutAccount();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/components/settings/__tests__/logout-confirm-dialog.test.tsx src/hooks/__tests__/useSettingsActions.test.tsx
```

- [ ] **Step 3: Implement `LogoutConfirmDialog.tsx` and `useSettingsActions.ts`**

Build dialog with Coral Red `#FF5252` button and clear session cleanup in hook.

- [ ] **Step 4: Run test to confirm pass**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/components/settings/__tests__/logout-confirm-dialog.test.tsx src/hooks/__tests__/useSettingsActions.test.tsx
```

- [ ] **Step 5: Commit changes**

```bash
git add src/components/settings/LogoutConfirmDialog.tsx src/hooks/useSettingsActions.ts src/components/settings/index.ts src/components/settings/__tests__/ src/hooks/__tests__/
git commit -m "feat(settings): add logout confirm dialog and settings actions hook"
```

---

### Task 5: Blocked Users Management Page (`/settings/blocked`)

**Files:**
- Create: `src/components/settings/BlockedUserRow.tsx`
- Create: `src/app/settings/blocked/page.tsx`
- Modify: `src/components/settings/index.ts`
- Test: `src/components/settings/__tests__/blocked-user-row.test.tsx`
- Test: `src/app/settings/blocked/__tests__/blocked-page.test.tsx`

**Interfaces:**
- `BlockedUserRowProps`: `{ user: FriendProfile, onUnblock: (userId: string) => void | Promise<void>, isUnblocking?: boolean }`
- Page route: `/settings/blocked` with TanStack Query fetching `getBlockedUsers()` and unblock mutation.

- [ ] **Step 1: Write the failing tests for `BlockedUserRow` and `/settings/blocked` page**

```typescript
// src/components/settings/__tests__/blocked-user-row.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BlockedUserRow } from '../BlockedUserRow';

describe('BlockedUserRow', () => {
  it('renders blocked user details and triggers onUnblock', () => {
    const handleUnblock = vi.fn();
    const user = {
      id: 'u-blocked',
      username: 'baduser',
      displayName: 'Bad User',
      avatarUrl: null,
    };

    render(<BlockedUserRow user={user} onUnblock={handleUnblock} />);

    expect(screen.getByText('Bad User')).toBeInTheDocument();
    expect(screen.getByText('@baduser')).toBeInTheDocument();

    const unblockBtn = screen.getByRole('button', { name: /Bỏ chặn/i });
    fireEvent.click(unblockBtn);
    expect(handleUnblock).toHaveBeenCalledWith('u-blocked');
  });
});
```

```typescript
// src/app/settings/blocked/__tests__/blocked-page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BlockedUsersPage from '../page';
import * as friendshipApi from '@/lib/api/friendship-api';
import { useAuthStore } from '@/stores/auth-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api/friendship-api');

const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: vi.fn(), replace: vi.fn() }),
}));

describe('BlockedUsersPage (/settings/blocked)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useAuthStore.setState({
      isAuthenticated: true,
      isHydrated: true,
      user: { id: 'u1' } as any,
    });
  });

  it('renders empty state when there are no blocked users', async () => {
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce([]);

    render(
      <QueryClientProvider client={queryClient}>
        <BlockedUsersPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Chưa có tài khoản nào bị chặn')).toBeInTheDocument();
    });
  });

  it('renders list of blocked users and allows unblocking', async () => {
    const blockedList = [
      { id: 'b1', displayName: 'Blocked One', username: 'b_one', avatarUrl: null },
    ];
    vi.mocked(friendshipApi.getBlockedUsers).mockResolvedValueOnce(blockedList);
    vi.mocked(friendshipApi.unblockUser).mockResolvedValueOnce(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <BlockedUsersPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Blocked One')).toBeInTheDocument();
    });

    const unblockBtn = screen.getByRole('button', { name: /Bỏ chặn/i });
    fireEvent.click(unblockBtn);

    // Confirm alert dialog appears
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận bỏ chặn/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(friendshipApi.unblockUser).toHaveBeenCalledWith('b1');
    });
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/components/settings/__tests__/blocked-user-row.test.tsx src/app/settings/blocked/__tests__/blocked-page.test.tsx
```

- [ ] **Step 3: Implement `BlockedUserRow.tsx` and `src/app/settings/blocked/page.tsx`**

Follow 1:1 parity with iOS `BlockedUsersView.swift`:
- TopBar with 44px back button returning to `/settings`.
- Confirmation alert before unblocking.
- Shimmer skeleton when loading.
- Clean empty state with shield icon.

- [ ] **Step 4: Run test to confirm pass**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/components/settings/__tests__/blocked-user-row.test.tsx src/app/settings/blocked/__tests__/blocked-page.test.tsx
```

- [ ] **Step 5: Commit changes**

```bash
git add src/components/settings/BlockedUserRow.tsx src/app/settings/blocked/ src/components/settings/index.ts src/components/settings/__tests__/
git commit -m "feat(settings): add blocked users management page and row component"
```

---

### Task 6: Main Settings Screen Page Integration (`/settings`)

**Files:**
- Create: `src/app/settings/page.tsx`
- Test: `src/app/settings/__tests__/settings-page.test.tsx`

**Features:**
- Header `SettingsTopBar` navigating back to `/profile`.
- `ProfileAvatarBanner` with live avatar update.
- Account Section:
  - Sửa tên -> opens `NameInputBottomSheet`.
  - Sửa ngày sinh -> opens `DobInputBottomSheet`.
  - Email -> displays current email with lock icon.
  - Mời bạn bè -> navigates to `/invite`.
  - Danh sách bạn bè -> navigates to `/messages`.
- Privacy Section:
  - Tài khoản đã bị chặn -> navigates to `/settings/blocked`.
- Preferences Section:
  - Rung xúc giác -> switches `usePreferencesStore.hapticsEnabled`.
  - Âm thanh hiệu ứng -> switches `usePreferencesStore.soundEnabled`.
  - Tự lưu ảnh chụp -> switches `usePreferencesStore.autoSavePhotos`.
- System & Logout Section:
  - Version label `Phiên bản 1.0.0 (Web)`.
  - Đăng xuất button -> opens `LogoutConfirmDialog`.
- Route Guard: Redirects to `/login?redirect=/settings` if unauthenticated.

- [ ] **Step 1: Write the failing tests for `/settings` page**

```typescript
// src/app/settings/__tests__/settings-page.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from '../page';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';

const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockPush }),
}));

describe('SettingsPage (/settings)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      isHydrated: true,
      user: {
        id: 'u1',
        username: 'khanh',
        displayName: 'Khánh Nguyễn',
        firstName: 'Khánh',
        lastName: 'Nguyễn',
        email: 'khanh@example.com',
        dob: '2000-08-15',
        avatarUrl: null,
      } as any,
    });
  });

  it('renders all settings sections and tiles', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Cài đặt')).toBeInTheDocument();
    expect(screen.getByText('Khánh Nguyễn')).toBeInTheDocument();
    expect(screen.getByText('TÀI KHOẢN')).toBeInTheDocument();
    expect(screen.getByText('Sửa tên')).toBeInTheDocument();
    expect(screen.getByText('Sửa ngày sinh')).toBeInTheDocument();
    expect(screen.getByText('Địa chỉ email')).toBeInTheDocument();
    expect(screen.getByText('RIÊNG TƯ & BẢO MẬT')).toBeInTheDocument();
    expect(screen.getByText('Tài khoản đã bị chặn')).toBeInTheDocument();
    expect(screen.getByText('TÙY CHỌN ỨNG DỤNG')).toBeInTheDocument();
    expect(screen.getByText('Rung xúc giác')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng xuất/i })).toBeInTheDocument();
  });

  it('opens NameInputBottomSheet when clicking Sửa tên', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Sửa tên'));
    expect(screen.getByText('Chỉnh sửa họ & tên')).toBeInTheDocument();
  });

  it('opens DobInputBottomSheet when clicking Sửa ngày sinh', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Sửa ngày sinh'));
    expect(screen.getByText('Chỉnh sửa ngày sinh')).toBeInTheDocument();
  });

  it('navigates to /settings/blocked when clicking Tài khoản đã bị chặn', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByText('Tài khoản đã bị chặn'));
    expect(mockPush).toHaveBeenCalledWith('/settings/blocked');
  });

  it('opens LogoutConfirmDialog when clicking Đăng xuất', () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/i }));
    expect(screen.getByText('Đăng xuất tài khoản?')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/app/settings/__tests__/settings-page.test.tsx
```

- [ ] **Step 3: Implement `src/app/settings/page.tsx`**

Integrate all components with smooth transitions, haptic clicks, sheets, and dialogs.

- [ ] **Step 4: Run test to confirm pass**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npx vitest run src/app/settings/__tests__/settings-page.test.tsx
```

- [ ] **Step 5: Commit changes**

```bash
git add src/app/settings/
git commit -m "feat(settings): implement main settings page with full sections and sheets"
```

---

### Task 7: End-to-End Verification & Build Polish

**Files:**
- Modify: `src/app/profile/page.tsx` (verify `onSettingsClick` routes to `/settings`)
- Test: Full Vitest suite (`npm test -- --run`)
- Build: Full Next.js production build (`npm run build`)

- [ ] **Step 1: Verify profile navigation link to `/settings`**

Ensure `ProfileTopBar` has `onSettingsClick={() => router.push('/settings')}` functioning cleanly.

- [ ] **Step 2: Run entire test suite across all 100+ test files**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npm test -- --run
```

- [ ] **Step 3: Run production build check**

```bash
cd /Users/nguyenkimquockhanh/Desktop/checked-nextjs && npm run build
```

- [ ] **Step 4: Commit any remaining polish and final integration**

```bash
git add -A
git commit -m "chore(settings): complete settings feature with 100% test pass and green build"
```
