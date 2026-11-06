# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 4
## Monthly History Grid & Streak Gamification (Màn Hình Profile)
### Dự án: Checked Next.js (`checked-nextjs`) — Chuẩn Parity 1:1 với `ProfileView.swift`

> **Mục tiêu**: Xây dựng 2 component hiển thị lịch sử và gamification trên màn hình Profile:
> 1. **Thẻ Lịch Sử Tháng (`CalendarHistoryCard`)**: Tái hiện nguyên bản `calendarCard` trên iOS — Lưới 7 cột hiển thị toàn bộ các ngày trong tháng, ô ảnh vuông 1:1, số ngày mờ tinh tế khi chưa có bài đăng, ảnh thumbnail thực phẩm/hóa đơn khi có bài đăng kèm dot badge màu Matcha Glow đếm số bài post trong ngày.
> 2. **Viên Thuốc Gamification (`ProfileStatsFooter`)**: Tái hiện `statsFooter` trên iOS — Capsule pill đếm số bài đã kiểm tra (`❤️ X Checked`) và chuỗi ngày liên tục (`🔥 Yd chuỗi`).
>
> **Quy tắc thiết kế cốt lõi**:
> - **Zero Border, Zero Blur, Zero Shadow**: Tuyệt đối không dùng `border-*`, `blur-*`, `shadow-*`. Thẻ nền `bg-surface`, bo góc `rounded-card` (24px).
> - **Tonal Layering**: Nền thẻ trắng `#FFFFFF` trên canvas Oat Milk `#EDE9DF`, ô ngày trống dùng tint `bg-text-primary/5`.
> - **Gamification Badges**: Dot badge màu xanh Matcha Glow `#D4EB70` với chữ đen đậm (`text-black font-extrabold`) đặt ở góc trên bên phải của ô ngày có ảnh. Viên thuốc thành tích bo tròn `rounded-full` với icon Trái tim xanh Matcha và Ngọn lửa cam `#FF8A00`.

---

### Bảng Đối Chiếu Kiến Trúc Chi Tiết (iOS vs Next.js)

| Thành phần trên iOS (`ProfileView.swift`) | Component Next.js (`checked-nextjs`) | Chi tiết đặc tả & CSS tokens |
| :--- | :--- | :--- |
| `calendarCard` (Button style: `PressedScaleButtonStyle`) | `CalendarHistoryCard.tsx` | Khối thẻ `bg-surface rounded-card select-none active:scale-[0.98] transition-transform` |
| Header lịch tháng | `iconLabel(icon: "calendar", label: currentMonthString)` | Icon `Calendar` tròn 26x26 xám mờ 5% + nhãn tháng dạng tiếng Việt (vd: `"Tháng 10, 2026"`) + `ChevronRight` |
| Lưới 7 cột (`LazyVGrid`) | `grid grid-cols-7 gap-2 px-5 pb-5` | Lưới 7 cột đều nhau, khoảng cách 8px (`gap-2`), đệm ngang và đáy 20px |
| Ô ngày trống (`dayCalendarData[day] == nil`) | `aspect-square rounded-[8px] bg-text-primary/5` | Ô vuông 1:1, bo góc 8px, hiển thị số ngày `day` ở giữa (11px font-bold font-display text-text-secondary/40) |
| Ô ngày có bài đăng (`dayCalendarData[day] != nil`) | `aspect-square rounded-[8px] relative overflow-hidden` | Ảnh thumbnail `object-cover w-full h-full`, bo góc 8px |
| Dot Badge đếm bài đăng (`dayPostBadge`) | Dot Badge ở góc trên phải (`absolute -top-1 -right-1`) | Tròn 16x16 (nếu `< 10`) hoặc Capsule (nếu $\ge 10$) nền `bg-primary`, chữ số màu đen 10px font-extrabold |
| `statsFooter` (`_buildStatsFooter`) | `ProfileStatsFooter.tsx` | Capsule pill `bg-text-primary/5 rounded-full px-4 py-2.5 inline-flex items-center gap-1.5` |
| Trái tim Checked | `Image(systemName: "heart.fill")` | Icon `Heart` size 14 `fill-primary text-primary` + `" {checkedCount} Checked \| "` (13px bold font-display text-text-primary) |
| Ngọn lửa chuỗi ngày | `Image(systemName: "flame.fill")` màu cam | Icon `Flame` size 14 `fill-[#FF8A00] text-[#FF8A00]` + `" {streakDays}d chuỗi"` (13px bold font-display text-text-primary) |
| Skeleton Loading State | `SkeletonBone(width: 160, height: 36, cornerRadius: 18)` | Khung giả lập capsule khi `isLoading === true && checkedCount === 0` |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 4

```
src/
└── components/
    └── profile/
        ├── ProfileStatsFooter.tsx         # Capsule Pill Gamification (Checked & Chuỗi ngày)
        ├── CalendarHistoryCard.tsx        # Thẻ Lưới Lịch Sử Tháng 7 Cột
        ├── index.ts                       # Re-export ProfileStatsFooter & CalendarHistoryCard
        └── __tests__/
            ├── profile-stats-footer.test.tsx    # Unit test suite cho ProfileStatsFooter
            └── calendar-history-card.test.tsx   # Unit test suite cho CalendarHistoryCard
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

- [x] **Task 1: Xây dựng Component `ProfileStatsFooter.tsx`** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/ProfileStatsFooter.tsx`
  - **Mô tả**:
    - Nhận props:
      ```typescript
      export interface ProfileStatsFooterProps {
        checkedCount: number;
        streakDays: number;
        isLoading?: boolean;
        className?: string;
      }
      ```
    - Bố cục:
      - Khi `isLoading && checkedCount === 0`: render `SkeletonBone` width 160, height 36, rounded-full.
      - Bình thường: Capsule pill `bg-text-primary/5 rounded-full px-4 py-2.5 inline-flex items-center justify-center select-none`.
      - Phần tử bên trong:
        - Icon `Heart` size 14 `fill-primary text-primary`.
        - Text: ` {checkedCount} Checked | ` (13px font-bold font-display text-text-primary).
        - Icon `Flame` size 14 `fill-[#FF8A00] text-[#FF8A00]`.
        - Text: ` {streakDays}d chuỗi` (13px font-bold font-display text-text-primary).
  - **Verifiable**: Render đúng số đếm, hiển thị skeleton bone khi loading, không vi phạm quy tắc Zero Border. 4/4 unit tests passed.

- [x] **Task 2: Xây dựng Component `CalendarHistoryCard.tsx`** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/CalendarHistoryCard.tsx`
  - **Mô tả**:
    - Nhận props:
      ```typescript
      export interface CalendarHistoryCardProps {
        currentMonthTitle?: string;
        daysInMonth: number;
        dayCalendarData: Record<number, DayCalendarData>;
        isLoading?: boolean;
        onClick?: () => void;
        onDayClick?: (day: number, data?: DayCalendarData) => void;
        className?: string;
      }
      ```
    - Bố cục:
      - Thẻ bao ngoài: `bg-surface rounded-card select-none active:scale-[0.98] transition-transform duration-100 ease-out cursor-pointer`.
      - Header:
        - Circle 26x26 `bg-text-primary/5` chứa icon `Calendar` size 13 stroke 2.2.
        - Nhãn: `currentMonthTitle` (14px medium text-text-secondary).
        - Icon `ChevronRight` size 14 xám mờ bên phải.
        - Padding: 20px (`p-5`).
      - Lưới Lịch Tháng:
        - `grid grid-cols-7 gap-2 px-5 pb-5`.
        - Vòng lặp `day = 1...daysInMonth`:
          - Container ô ngày: `aspect-square relative rounded-[8px] overflow-hidden`.
          - Khi KHÔNG có dữ liệu (`!dayCalendarData[day]`):
            - Nền: `bg-text-primary/5 flex items-center justify-center`.
            - Số ngày: `text-[11px] font-bold font-display text-text-secondary/40`.
          - Khi CÓ dữ liệu (`dayCalendarData[day]`):
            - Render ảnh thumbnail `<img>` với `src=item.latestImageUrl`, `object-cover w-full h-full`.
            - Fallback skeleton nếu ảnh lỗi hoặc đang nạp.
            - Dot Badge ở góc trên phải:
              - Vị trí: `absolute -top-1 -right-1 z-10`.
              - Nếu `postCount < 10`: hình tròn `w-4 h-4 rounded-full bg-primary flex items-center justify-center`.
              - Nếu `postCount >= 10`: capsule `h-4 px-1 rounded-full bg-primary flex items-center justify-center`.
              - Text số lượng: `text-[10px] font-extrabold font-display text-black leading-none`.
      - Tương tác: Kích hoạt `haptics.click()` khi người dùng nhấn vào thẻ hoặc chọn một ngày.
  - **Verifiable**: Kiểm tra hiển thị đủ số ô ngày trong tháng, render đúng ảnh và dot badge số lượng, hiển thị số mờ khi chưa có bài đăng. 6/6 unit tests passed.

- [x] **Task 3: Cập nhật Barrel Export (`src/components/profile/index.ts`)** (ĐÃ HOÀN THÀNH)
  - **File**: `src/components/profile/index.ts`
  - **Mô tả**: Re-export `ProfileStatsFooter` và `CalendarHistoryCard` cùng các type props.
  - **Verifiable**: Có thể import tất cả 6 components Profile từ `@/components/profile`. Test `index.test.ts` passed.

- [x] **Task 4: Xây dựng Bộ Unit Test Suites cho Phase 4** (ĐÃ HOÀN THÀNH)
  - **Files**:
    - `src/components/profile/__tests__/profile-stats-footer.test.tsx` (6 tests passed)
    - `src/components/profile/__tests__/calendar-history-card.test.tsx` (9 tests passed)
  - **Mô tả**:
    - `profile-stats-footer.test.tsx`:
      - Test hiển thị skeleton khi `isLoading=true` và `checkedCount=0`.
      - Test hiển thị đúng `X Checked` và `Yd chuỗi`.
      - Test icon trái tim Matcha Glow và icon ngọn lửa cam.
      - Test hiển thị `0 Checked | 0d chuỗi` khi người dùng mới (`isLoading=false`).
      - Test aria-label tiếp cận và custom className.
    - `calendar-history-card.test.tsx`:
      - Test render đúng tiêu đề tháng và tổng số ngày trong lưới (vd: 31 ô).
      - Test fallback `formatCurrentMonthVi()` khi không truyền tiêu đề.
      - Test render số ngày mờ cho các ô chưa có ảnh.
      - Test render ảnh thumbnail và dot badge đếm số bài post (`postCount` < 10 hình tròn, >= 10 hình viên thuốc).
      - Test không render dot badge khi `postCount = 0`.
      - Test kích hoạt callback `onClick`, `onDayClick` (với `stopPropagation`) và rung haptic.
      - Test phím Enter và Space (keyboard a11y) và custom className.
  - **Verifiable**: Toàn bộ 15/15 unit tests của Phase 4 pass 100%.

- [x] **Task 5: Kiểm tra Tổng thể Phase 4 (Verification Phase)** (ĐÃ HOÀN THÀNH)
  - **Lệnh thực thi**:
    ```bash
    npx vitest run src/components/profile # 7/7 test files, 43/43 tests passed
    npx tsc --noEmit                     # 0 errors
    npm test                             # 46/46 test files, 301/301 tests passed
    npm run build                        # 15/15 static pages compiled successfully
    ```
  - **Tiêu chuẩn hoàn thành**:
    - 100% tests của Phase 4 passed.
    - Toàn bộ test suites toàn dự án passed (không có regression).
    - TypeScript biên dịch 0 lỗi.
    - Build Next.js production thành công.
