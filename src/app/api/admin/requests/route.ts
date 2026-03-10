import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getPendingAdminRequests,
  createAdminFromRequest,
  rejectAdminRequest,
} from "@/services/admin.service";

/**
 * GET /api/admin/requests
 * Get all pending admin requests (SUPERADMIN only)
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

    if (user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { success: false, message: "Only SUPERADMIN can view admin requests" },
        { status: 403 }
      );
    }

    const requests = await getPendingAdminRequests();

    return NextResponse.json(
      {
        success: true,
        data: requests,
        count: requests.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get admin requests error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch admin requests",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/requests
 * Approve or reject admin request (SUPERADMIN only)
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

    if (user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { success: false, message: "Only SUPERADMIN can process admin requests" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, message: "Request ID and action are required" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const result = await createAdminFromRequest(requestId, user.id);
      return NextResponse.json(
        {
          success: true,
          message: "Admin account created successfully",
          data: {
            admin: {
              id: result.admin.id,
              email: result.admin.email,
              firstName: result.admin.firstName,
              lastName: result.admin.lastName,
              role: result.admin.role,
              college: result.college,
            },
          },
        },
        { status: 201 }
      );
    } else if (action === "reject") {
      const rejected = await rejectAdminRequest(requestId);
      return NextResponse.json(
        {
          success: true,
          message: "Admin request rejected",
          data: rejected,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action. Use 'approve' or 'reject'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Admin request action error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process admin request",
      },
      { status: 500 }
    );
  }
}
