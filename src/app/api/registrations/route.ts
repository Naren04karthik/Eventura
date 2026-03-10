import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserRegistrations } from "@/services/registration.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const registrations = await getUserRegistrations(user.id);

    return NextResponse.json(
      {
        success: true,
        data: { registrations },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch registrations",
      },
      { status: 500 }
    );
  }
}
