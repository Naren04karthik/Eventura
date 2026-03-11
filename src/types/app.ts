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

export interface ProfileInfo {
  whatsapp?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  college?: string | null;
  year?: number | null;
  branch?: string | null;
  customBranch?: string | null;
  collegeId?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profilePhoto?: string | null;
}

export interface CollegeOption {
  id: string;
  name: string;
}