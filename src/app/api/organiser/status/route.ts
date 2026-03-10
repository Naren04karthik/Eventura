import { NextRequest, NextResponse } from "next/server";
import { checkOrganiserStatus } from "@/services/organiser.service";

/**
 * GET /api/organiser/status?email=...
 * Check approval status of organiser registration
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email parameter is required",
        },
        { status: 400 }
      );
    }

    const status = await checkOrganiserStatus(email);

    return NextResponse.json(
      {
        success: true,
        data: { status },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Organiser status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to check organiser status",
      },
      { status: 500 }
    );
  }
}
