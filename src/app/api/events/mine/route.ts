import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEventsByUser } from "@/services/event.service";

// GET /api/events/mine - Get events organised by current user
export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const result = await getEventsByUser(user.id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to fetch your events",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { events: result.data },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch your events",
      },
      { status: 500 }
    );
  }
}
