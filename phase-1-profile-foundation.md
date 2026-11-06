# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT: PHASE 1
## Foundation, Data Contracts & Post Aggregator Engine (Màn Hình Profile)
### Dự án: Checked Next.js (`checked-nextjs`) — Chuẩn Parity 1:1 với `ProfileView.swift`

> **Mục tiêu**: Xây dựng toàn bộ nền tảng logic, hợp đồng dữ liệu (Types), bộ định dạng tiền tệ & thời gian chuẩn tiếng Việt, client API Năng lượng (Calorie), thuật toán gom nhóm ảnh bài post theo ngày trong tháng và thuật toán tính chuỗi ngày liên tiếp (Streak) của người dùng.
>
> **Quy tắc bắt buộc**:
> - **Zero Regression**: Không làm hỏng các test suites hiện tại (109+ tests đang pass).
> - **Max 700 lines/file**: Hook và helper chia tách rõ ràng, mỗi file dưới 200 dòng.
> - **TDD Cycle (Red - Green - Refactor)**: Viết test case trước hoặc song song, chạy test xác minh kết quả.

---

### Bảng Đối Chiếu Kiến Trúc Chi Tiết (iOS vs Backend vs Next.js)

| Khái niệm trên iOS (`ProfileView.swift`) | Backend (`checked-backend`) | Client Web (`checked-nextjs`) | Chi tiết kỹ thuật |
| :--- | :--- | :--- | :--- |
| `DayCalendarData` | Dữ liệu tổng hợp từ 2 APIs | `src/types/profile.ts` | `{ latestImageUrl: string; latestDate: Date; postCount: number }` |
| `updateCalendarData(...)` | `GET /api/v1/photos/my-photos`<br/>`GET /api/v1/expenses?type=ALL` | `calendar-aggregator.ts` | Lọc ảnh theo `yyyyMM`, khử trùng lặp `photoId` + `imageUrl`, nhóm theo ngày trong tháng |
| `calculateStreak(...)` | Tính toán client-side | `calculateStreakDays(...)` | Đếm lùi liên tiếp từ ngày hiện tại; nếu hôm nay chưa post thì xét từ hôm qua |
| `formatCurrency(...)` | Double | `formatCurrency(number)` | Định dạng chuẩn VND: `150.000 ₫` |
| `currentMonthString` | Locale `vi_VN` `"LLLL yyyy"` | `formatCurrentMonthVi(date)` | Tự động viết hoa: `"Tháng 10 2026"` |
| `currentMonthKey` | Format `"yyyyMM"` | `formatMonthKey(date)` | Ví dụ: `"202610"` |
| `CalorieRepository` | `CalorieController.java` (`/api/v1/calories/*`) | `src/lib/api/calorie-api.ts` | Client Typed API cho Goal và Daily Summary |
| Two-tier fetch | `loadCached` + `fetchRemote` | `useProfileData.ts` | Tầng 1 (Tóm tắt nhanh) + Tầng 2 (Chi tiết lịch sử) |

---

### Cấu Trúc Thư Mục & File Tạo Mới trong Phase 1

```
src/
├── types/
│   └── profile.ts                         # Type contracts cho Profile & Calorie
├── lib/
│   ├── utils/
│   │   ├── formatters.ts                  # Bổ sung formatCurrentMonthVi, formatMonthKey, formatDateKey
│   │   └── __tests__/
│   │       └── formatters.test.ts         # Test suite định dạng tiền tệ & ngày tháng
│   ├── api/
│   │   ├── calorie-api.ts                 # Typed client API & React Query hooks cho Calorie
│   │   └── __tests__/
│   │       └── calorie-api.test.ts        # Mock test cho Calorie API client
│   └── profile/
│       ├── calendar-aggregator.ts         # Thuật toán gom nhóm ảnh theo ngày & tính streak
│       └── __tests__/
│           └── calendar-aggregator.test.ts# Test cases gom ảnh và tính chuỗi ngày
└── hooks/
    ├── useProfileData.ts                  # Hook chính điều phối dữ liệu Profile 2 tầng
    └── __tests__/
        └── useProfileData.test.tsx        # Integration test cho hook useProfileData
```

---

### Danh Sách Công Việc Chi Tiết (Tasks)

- [x] **Task 1: Định nghĩa Data Contracts (`src/types/profile.ts`)**
  - **File**: `src/types/profile.ts`
  - **Mô tả**:
    - `DayCalendarData`: Dữ liệu cho từng ô lịch trên lưới 7 cột:
      ```typescript
      export interface DayCalendarData {
        latestImageUrl: string;
        latestDate: Date;
        postCount: number;
      }
      ```
    - `ProfileSummaryState`: Trạng thái tổng hợp cho màn hình Profile:
      ```typescript
      export interface ProfileSummaryState {
        totalSpent: number;
        budgetLimit: number | null;
        alertPct: number;
        savingsTarget: number | null;
        percentUsed: number;
        remaining: number;
        isBudgetExceeded: boolean;
        todayCalories: number;
        targetCalories: number;
        calorieExceeded: boolean;
        caloriePercentage: number;
        checkedCount: number;
        streakDays: number;
      }
      ```
    - Các interface Calorie tương thích với `checked-backend`:
      ```typescript
      export interface DailyCalorieSummary {
        date?: string;
        dailyTargetCalories: number;
        consumedCalories: number;
        remainingCalories: number;
        isExceeded: boolean;
        percentage: number;
      }

      export interface CalorieGoalResponse {
        dailyTargetCalories: number;
      }

      export interface CalorieGoalRequest {
        dailyTargetCalories: number;
      }
      ```
  - **Verifiable**: Export qua `src/types/index.ts`, TypeScript biên dịch không lỗi type (Đã hoàn thành, 100% type-safe, 35/35 test suites passed).

- [x] **Task 2: Mở rộng Tiện Ích Định Dạng (`src/lib/utils/formatters.ts`)**
  - **File**: `src/lib/utils/formatters.ts`
  - **Mô tả**: Bổ sung các hàm format chuẩn hóa cho Profile:
    1. `formatCurrentMonthVi(dateInput?: Date | string): string`:
       - Chuyển đổi sang chuỗi tiếng Việt viết hoa: `"Tháng 10 2026"`.
    2. `formatMonthKey(dateInput?: Date | string): string`:
       - Trả về mã tháng 6 chữ số `"yyyyMM"`, ví dụ `"202610"`.
    3. `formatDateKey(dateInput?: Date | string): string`:
       - Trả về mã ngày `"yyyy-MM-dd"`, ví dụ `"2026-10-30"`.
    4. `getDaysInMonth(year: number, monthIndex: number): number`:
       - Tính chính xác số ngày trong tháng (28, 29, 30, hoặc 31 ngày).
  - **Verifiable**: Viết unit test trong `src/lib/utils/__tests__/formatters.test.ts`, kiểm tra xử lý đúng mọi tháng trong năm và năm nhuận (Đã hoàn thành, 18/18 tests pass, tổng dự án 238/238 tests pass).

- [x] **Task 3: Xây dựng Calorie API Client (`src/lib/api/calorie-api.ts`)**
  - **File**: `src/lib/api/calorie-api.ts`
  - **Mô tả**:
    - Gọi API qua `customFetcher`:
      - `getCalorieGoal(signal?: AbortSignal): Promise<CalorieGoalResponse>` $\rightarrow$ `GET /api/v1/calories/goal`.
      - `updateCalorieGoal(data: CalorieGoalRequest): Promise<CalorieGoalResponse>` $\rightarrow$ `PUT /api/v1/calories/goal`.
      - `getDailyCalorieSummary(date?: string, signal?: AbortSignal): Promise<DailyCalorieSummary>` $\rightarrow$ `GET /api/v1/calories/daily`.
    - TanStack Query hooks:
      - `useGetCalorieGoal(options?)`
      - `useUpdateCalorieGoal(options?)`
      - `useGetDailyCalorieSummary(date?, options?)`
  - **Verifiable**: Viết test mock `customFetcher` kiểm tra URL, method, headers và data trả về (Đã hoàn thành, 5/5 tests pass, tổng dự án 243/243 tests pass).

- [x] **Task 4: Post Aggregator & Thuật Toán Tính Streak (`src/lib/profile/calendar-aggregator.ts`)**
  - **File**: `src/lib/profile/calendar-aggregator.ts`
  - **Mô tả**:
    1. `aggregateCalendarData(entries, myPhotos, targetDate)`:
       - Hợp nhất các bản ghi từ `myPhotos` (`PhotoResponse`) và `expenseEntries` (`ExpenseItemResponse`).
       - Chuẩn hóa: lấy `imageUrl = thumbnailUrl ?? imageUrl`, `date = takenAt ?? createdAt`.
       - Khử trùng lặp ảnh dựa trên `Set<id>` và `Set<imageUrl>`.
       - Lọc chỉ lấy các bài đăng thuộc đúng tháng và năm của `targetDate`.
       - Nhóm vào `Record<number, DayCalendarData>` theo `day` (1 đến `daysInMonth`).
       - Với mỗi ngày: sắp xếp thời gian giảm dần (`b.date - a.date`), lấy bài mới nhất `latestImageUrl`, `latestDate`, và tổng số `postCount`.
       - Tính `checkedCount = Math.max(totalMonthPosts, myPhotos.length)`.
    2. `calculateStreakDays(dayCalendarData, todayDayNumber)`:
       - Nếu ngày hôm nay `todayDayNumber` đã có post $\rightarrow$ bắt đầu từ hôm nay.
       - Nếu hôm nay chưa có post $\rightarrow$ xét từ hôm qua `todayDayNumber - 1`.
       - Vòng lặp đếm lùi liên tiếp: chừng nào `dayCalendarData[currentDay]` có dữ liệu thì `streak++`, `currentDay--`.
       - Gặp ngày đầu tiên đứt quãng thì dừng.
       - Kết quả trả về tối thiểu là 1 nếu đã có bài post trong quá khứ.
  - **Verifiable**: Viết bộ test `src/lib/profile/__tests__/calendar-aggregator.test.ts` kiểm tra 6 trường hợp (Đã hoàn thành, 10/10 tests pass, tổng dự án 253/253 tests pass).

- [x] **Task 5: Xây dựng Hook `useProfileData.ts` (Two-Tier Data Fetching)**
  - **File**: `src/hooks/useProfileData.ts`
  - **Mô tả**:
    - **Tầng 1 (Critical Summary Queries)**:
      - `useGetCashflowSummary({ monthKey })`
      - `useGetBudget(monthKey)`
      - `useGetSavingsGoal(monthKey)`
      - `useGetCalorieGoal()`
      - `useGetDailyCalorieSummary(todayDateKey)`
    - **Tầng 2 (Detailed Calendar Queries)**:
      - `useGetExpenseEntries({ monthKey, type: 'ALL', pageable: { page: 0, size: 50 } })`
      - `useGetMyPhotos({ pageable: { page: 0, size: 50 } })`
    - **Logic tính toán**:
      - `percentUsed`: `budgetLimit && budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0`.
      - `remaining`: `(budgetLimit ?? 0) - totalSpent`.
      - `isBudgetExceeded`: `budgetLimit !== null && remaining < 0`.
      - Gọi `aggregateCalendarData` và `calculateStreakDays`.
    - **Mutations tiện ích**:
      - `updateBudgetMutation`: gọi `upsertBudget` và `upsertSavingsGoal`, invalidate queries liên quan.
      - `updateCalorieGoalMutation`: gọi `updateCalorieGoal`, invalidate queries calo.
    - Trả về: `summaryState`, `dayCalendarData`, `isLoadingSummary`, `isLoadingCalendar`, `refreshData`, `updateBudget`, `updateCalorieGoal`.
  - **Verifiable**: Viết integration test trong `src/hooks/__tests__/useProfileData.test.tsx` với mock query client (Đã hoàn thành, 5/5 tests pass, tổng dự án 258/258 tests pass).

- [x] **Task 6: Kiểm tra Tổng thể Phase 1 (Verification Phase)**
  - **Lệnh thực thi**:
    ```bash
    npm test -- formatters
    npm test -- calorie-api
    npm test -- calendar-aggregator
    npm test -- useProfileData
    npm run build
    ```
  - **Tiêu chuẩn hoàn thành**:
    - 100% test files của Phase 1 passed.
    - Không làm hỏng bất kỳ test suite nào của các phase trước (39/39 test files, 258/258 tests passed).
    - TypeScript kiểm tra 0 lỗi biên dịch, `npm run build` thành công 15/15 static pages. (Đã hoàn thành 100%).

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria cho Phase 1)
1. Các hàm định dạng tiền tệ trả về chuỗi `150.000 ₫`, định dạng tháng trả về chuỗi `"Tháng 10 2026"`.
2. Thuật toán `aggregateCalendarData` bóc tách chính xác ảnh mới nhất trong ngày và đếm số lượng bài đăng mà không bị trùng lặp giữa Expense và Photos.
3. Thuật toán `calculateStreakDays` phản ánh chuẩn xác chuỗi ngày liên tiếp theo quy tắc của `checked-ios`.
4. API Calorie client kết nối đúng các endpoint `/api/v1/calories/*` của `checked-backend`.
5. Hook `useProfileData` điều phối mượt mà cả 2 tầng dữ liệu mà không gây nghẽn network hay re-render vô tận.
