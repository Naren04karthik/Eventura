import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { registerUser } from "@/services/user.service";
import { setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const data = registerSchema.parse(body);

    // Register user
    const { user, token } = await registerUser(data);

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        data: { user },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    
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

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Registration failed",
      },
      { status: 500 }
    );
  }
}
