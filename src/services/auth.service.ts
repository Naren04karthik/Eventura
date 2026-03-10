import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { buildSuperadminUser, getSuperadminCredentials } from '@/lib/superadmin';

export interface UserLoginPayload {
  email: string;
  password: string;
}

interface AuthResult {
  user: ReturnType<typeof buildSuperadminUser> | {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'ORGANIZER' | 'USER';
    status: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
    profileImage: string | null;
    isProfileComplete: boolean;
    name: string;
  };
  token: string;
}

async function loginConfiguredSuperadmin(data: UserLoginPayload): Promise<AuthResult | null> {
  const superadmin = getSuperadminCredentials();
  const email = data.email.trim().toLowerCase();

  if (!superadmin.email || !superadmin.password || email !== superadmin.email) {
    return null;
  }

  if (data.password !== superadmin.password) {
    throw new Error('Invalid credentials');
  }

  const user = buildSuperadminUser(data.email.trim());
  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: 'SUPERADMIN',
    status: 'ACTIVE',
    isProfileComplete: true,
  });

  return { user, token };
}

export async function loginUser(data: UserLoginPayload) {
  const superadminLogin = await loginConfiguredSuperadmin(data);
  if (superadminLogin) {
    return superadminLogin;
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      profileImage: true,
      isProfileComplete: true,
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await comparePassword(data.password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    isProfileComplete: user.isProfileComplete,
  });

  const { password, ...userWithoutPassword } = user;

  return {
    user: {
      ...userWithoutPassword,
      name: `${user.firstName} ${user.lastName}`.trim(),
    },
    token,
  };
}

export async function loginSuperadmin(email: string, password: string) {
  const result = await loginConfiguredSuperadmin({ email, password });
  if (!result) {
    throw new Error('Invalid credentials');
  }

  return result;
}