import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getPendingOrganisers,
  approveOrganiser,
  rejectOrganiser,
} from "@/services/organiser.service";

/**
 * GET /api/admin/organisers
 * Get pending organiser applications (ADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Only ADMIN can view organiser requests" },
        { status: 403 }
      );
    }

    const requests = await getPendingOrganisers();

    return NextResponse.json(
      {
        success: true,
        data: requests,
        count: requests.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get pending organisers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch pending organisers",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/organisers
 * Approve or reject organiser applications (ADMIN only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Only ADMIN can manage organiser requests" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body?.action as string | undefined;
    const requestId = body?.requestId as string | undefined;
    const collegeId = body?.collegeId as string | undefined;

    if (!action || !requestId) {
      return NextResponse.json(
        { success: false, message: "Action and requestId are required" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      if (!collegeId) {
        return NextResponse.json(
          { success: false, message: "College selection is required for approval" },
          { status: 400 }
        );
      }
      await approveOrganiser(requestId, user.id, collegeId);
      return NextResponse.json(
        { success: true, message: "Organizer approved" },
        { status: 200 }
      );
    }

    if (action === "REJECT") {
      await rejectOrganiser(requestId, user.id);
      return NextResponse.json(
        { success: true, message: "Organizer rejected" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Organiser request action error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process organiser request",
      },
      { status: 500 }
    );
  }
}
