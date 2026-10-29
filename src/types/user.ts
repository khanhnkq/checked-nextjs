export interface User {
  id: string;
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
