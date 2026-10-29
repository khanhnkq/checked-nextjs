# 📦 DATA MODELS & TYPESCRIPT DTOS SPECIFICATION

Tài liệu này định nghĩa toàn bộ cấu trúc dữ liệu Type-safe bằng TypeScript, ánh xạ 1:1 tương thích với các model Swift trong `checked-ios` và DTO của `checked-backend` (Spring Boot).

---

## 1. THỰC THỂ NGƯỜI DÙNG & TÀI KHOẢN (USER & AUTH)

```typescript
export interface User {
  id: string; // UUID v4
  email: string;
  username: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  profileCompleted: boolean;
  isGoldMember: boolean;
  bio?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn?: number;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}
```

---

## 2. BÀI ĐĂNG KHOẢNH KHẮC & PHẢN HỒI (PHOTOS & FEED)

```typescript
export type TransactionType = 'EXPENSE' | 'INCOME';
export type RecipientScope = 'ALL_FRIENDS' | 'SELECTED_FRIENDS';

export interface PhotoPost {
  id: string; // UUID
  senderId: string;
  senderName: string; // senderDisplayName
  senderAvatarUrl?: string | null;
  imageUrl: string;
  thumbnailUrl: string; // Ảnh vuông tối ưu 320x320
  caption?: string | null;
  takenAt?: string;
  createdAt: string;
  
  // Dữ liệu tài chính gắn kèm ảnh
  amount?: number | null;
  transactionType?: TransactionType;
  categoryId?: string | null;
  categoryName?: string | null;
  note?: string | null;
  
  // Dữ liệu vị trí & phạm vi
  locationName?: string | null;
  recipientScope?: RecipientScope;
  recipientCount?: number;
  
  // Phản hồi cảm xúc
  reactions?: PhotoReactionSummary[];
  userReaction?: string | null; // Emoji tôi đã thả nếu có
}

export interface PhotoReactionSummary {
  emoji: string;
  count: number;
}
```

---

## 3. THỰC THỂ TÀI CHÍNH & DÒNG TIỀN (EXPENSES & BUDGET)

```typescript
export interface CategorySpend {
  id: string;
  categoryName: string;
  iconName: string;
  amount: number;
  percentage: number; // 0 - 100
}

export interface CashflowSummary {
  monthKey: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  budgetLimit?: number | null;
  budgetRemaining?: number | null;
  budgetUsedPct?: number | null;
  budgetExceeded?: boolean | null;
  incomeByCategory: CategorySpend[];
  expenseByCategory: CategorySpend[];
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  note?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  transactionType: TransactionType;
  occurredAt: string;
  photoId?: string | null;
  photoThumbnailUrl?: string | null;
}

export interface MonthlyBudget {
  monthKey: string;
  amountLimit: number;
  spent: number;
  remaining: number;
  exceeded: boolean;
  alertThresholdPct: number; // Mặc định 80
}
```

---

## 4. THỰC THỂ DINH DƯỠNG & CALO (NUTRITION & MEALS)

```typescript
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface FoodRecognitionData {
  dishName: string;
  category: string;
  categoryIcon: string;
  calories?: number | null;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatGrams?: number | null;
  confidenceScore?: number;
}

export interface CalorieDailyLog {
  date: string; // YYYY-MM-DD
  consumedCalories: number;
  targetCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Record<MealType, MealEntry[]>;
}

export interface MealEntry {
  id: string;
  dishName: string;
  calories: number;
  mealType: MealType;
  photoId?: string | null;
  photoUrl?: string | null;
  loggedAt: string;
}
```

---

## 5. THỰC THỂ TIN NHẮN & HỘI THOẠI (CHAT & WEBSOCKET)

```typescript
export interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  photoUrl?: string | null;
  replyToMessage?: ReplyMessageSummary | null;
  sentAt: string;
  isRead: boolean;
  isRevoked: boolean;
}

export interface ReplyMessageSummary {
  id: string;
  senderName: string;
  content: string;
  photoThumbnailUrl?: string | null;
}
```

---

## 6. THỰC THỂ BẠN BÈ & QUAN HỆ (FRIENDSHIP)

```typescript
export type FriendshipStatus = 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'BLOCKED' | 'NONE';

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isGoldMember: boolean;
}

export interface FriendshipQuotaInfo {
  currentCount: number;
  maxLimit: number; // Mặc định 20
  isGoldMember: boolean;
}

export interface FriendRequestItem {
  id: string; // Request ID
  sender: Friend;
  createdAt: string;
}
```

