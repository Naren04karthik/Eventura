import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload as JoseJWTPayload } from "jose";
import bcryptjs from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { buildSuperadminUser, SUPERADMIN_USER_ID } from "./superadmin";

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

const JWT_EXPIRATION = "7d";
const COOKIE_NAME = "auth_token";

// JWT Payload Interface
export interface JWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "ORGANIZER" | "USER";
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";
  isProfileComplete: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: "SUPERADMIN" | "ADMIN" | "ORGANIZER" | "USER";
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";
  profileImage?: string | null;
  collegeId?: string | null;
  isProfileComplete: boolean;
}

// Generate JWT Token
export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);

  return token;
}

// Verify JWT Token
export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Hash Password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcryptjs.hash(password, saltRounds);
}

// Compare Password
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

// Get Current User from Cookie
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    // Handle SUPERADMIN (hardcoded, not in DB)
    if (payload.userId === SUPERADMIN_USER_ID && payload.role === "SUPERADMIN") {
      return buildSuperadminUser(payload.email) as AuthUser;
    }

    // Fetch fresh user from DB to prevent stale data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        profileImage: true,
        collegeId: true,
        isProfileComplete: true,
      },
    });

    if (!user) {
      return null;
    }

    // Return user with name field (combine firstName and lastName)
    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim(),
    };
  } catch (error) {
    console.error('[Auth] Error in getCurrentUser:', error);
    return null;
  }
}

// Set Auth Cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  const isSecure = process.env.SECURE_COOKIE === 'true' || (process.env.NODE_ENV === 'production' && process.env.SECURE_COOKIE !== 'false');
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

// Clear Auth Cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get Token from Cookie (for API routes)
export async function getTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value || null;
  } catch (error) {
    return null;
  }
}

