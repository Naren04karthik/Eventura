import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
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

    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { success: false, message: "Only ADMIN or SUPERADMIN can view stats" },
        { status: 403 }
      );
    }

    // Get all statistics in parallel
    const [totalUsers, totalEvents, totalRegistrations, totalFeedback] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.registration.count(),
      prisma.contact_messages.count(),
    ]);

    return NextResponse.json(
      {
        success: true,
        totalUsers,
        totalEvents,
        totalRegistrations,
        totalFeedback,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get admin stats error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin stats",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
