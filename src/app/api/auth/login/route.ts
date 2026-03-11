import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import { loginUser } from "@/services/auth.service";
import { setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const data = loginSchema.parse(body);

    // Login user
    const { user, token } = await loginUser(data);

    console.log('[/api/auth/login] Login successful for:', user.email);
    console.log('[/api/auth/login] Token generated, setting cookie...');

    // Set auth cookie
    await setAuthCookie(token);

    console.log('[/api/auth/login] Cookie set successfully');

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: { user },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Login failed",
      },
      { status: 401 }
    );
  }
}
