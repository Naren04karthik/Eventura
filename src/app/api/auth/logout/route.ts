import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    // Clear the auth_token cookie by deleting and expiring it explicitly
    response.cookies.delete("auth_token");
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
      },
      { status: 500 }
    );
  }
}
