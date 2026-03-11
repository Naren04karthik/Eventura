import { NextRequest, NextResponse } from "next/server";
import { loginSuperadmin } from "@/services/auth.service";
import { superadminLoginSchema } from "@/lib/validations";
import { setAuthCookie } from "@/lib/auth";

/**
 * POST /api/auth/superadmin/login
 * SUPERADMIN login with hardcoded credentials
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = superadminLoginSchema.parse(body);

    const { user, token } = await loginSuperadmin(data.email, data.password);
    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: "SUPERADMIN login successful",
        data: { user },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("SUPERADMIN login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "SUPERADMIN login failed",
      },
      { status: 500 }
    );
  }
}
