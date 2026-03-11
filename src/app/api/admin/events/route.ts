import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/events
 * Get all events with registration counts
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
        { success: false, message: "Only ADMIN or SUPERADMIN can view events" },
        { status: 403 }
      );
    }

    const events = await prisma.event.findMany({
      select: {
        id: true,
        eventCode: true,
        title: true,
        description: true,
        date: true,
        venue: true,
        status: true,
        isPaid: true,
        capacity: true,
        createdAt: true,
        organiser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        college: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        events,
        count: events.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get admin events error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
