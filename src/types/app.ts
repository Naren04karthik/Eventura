export interface AppUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status?: string;
  profileImage?: string | null;
  collegeId?: string | null;
  isProfileComplete?: boolean;
  name?: string;
}
