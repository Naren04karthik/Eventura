import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';

export interface UserLoginPayload {
  email: string;
  password: string;
}

export async function loginUser(data: UserLoginPayload) {
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
