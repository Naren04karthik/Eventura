import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload as JoseJWTPayload } from "jose";
import bcryptjs from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "auth_token";

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

const JWT_EXPIRATION = "7d";

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
  return bcryptjs.hash(password, 10);
}

// Compare Password
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

// Set Auth Cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

// Clear Auth Cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get Token from Cookie
export async function getTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value || null;
  } catch (error) {
    return null;
  }
}

// Get Current User from Cookie
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

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

    if (!user) return null;

    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim(),
    };
  } catch (error) {
    console.error('[Auth] Error in getCurrentUser:', error);
    return null;
  }
}
