import { NextRequest, NextResponse } from "next/server";
import { getEventByCode } from "@/services/event.service";

// GET /api/events/code/[code] - Get event by event code
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Event code is required" },
        { status: 400 }
      );
    }

    const result = await getEventByCode(code);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Event not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get event by code error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch event",
      },
      { status: 500 }
    );
  }
}
