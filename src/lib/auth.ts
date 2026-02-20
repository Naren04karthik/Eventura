import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload as JoseJWTPayload } from "jose";

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
