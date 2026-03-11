import type { AppUser } from '@/types';

export const SUPERADMIN_USER_ID = 'SUPERADMIN';

const DEFAULT_SUPERADMIN_NAME = 'Superadmin';

export function getSuperadminCredentials() {
  return {
    email: process.env.SUPERADMIN_EMAIL?.trim().toLowerCase(),
    password: process.env.SUPERADMIN_PASSWORD,
  };
}

export function buildSuperadminUser(email: string): AppUser {
  const normalizedEmail = email.trim().toLowerCase();

  return {
    id: SUPERADMIN_USER_ID,
    email: normalizedEmail,
    name: DEFAULT_SUPERADMIN_NAME,
    role: 'SUPERADMIN',
    status: 'ACTIVE',
    profileImage: null,
    collegeId: null,
    isProfileComplete: true,
  };
}