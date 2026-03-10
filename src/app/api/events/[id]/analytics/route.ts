import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let stage = "init";
  try {
    stage = "auth";
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    stage = "resolve_event";
    const { id: eventIdentifier } = await params;
    const looksLikeEventCode = /^[a-z0-9]{8}$/i.test(eventIdentifier);

    // Resolve event by eventCode (preferred short URL) or UUID for backward compatibility.
    const event = await prisma.event.findFirst({
      where: looksLikeEventCode
        ? { eventCode: eventIdentifier }
        : {
            OR: [{ id: eventIdentifier }, { eventCode: eventIdentifier }],
          },
      select: {
        id: true,
        title: true,
        capacity: true,
        organiserId: true,
        date: true,
        venue: true,
        registrationType: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    stage = "permission";
    // Check if user is organizer or superadmin
    if (event.organiserId !== user.id && user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    stage = "load_registrations";
    // Fetch all registrations for this event
    const registrations = await prisma.registration.findMany({
      where: { eventId: event.id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            college: {
              select: {
                name: true,
              },
            },
          },
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    stage = "compute_metrics";
    // Calculate statistics
    const totalRegistrations = registrations.length;
    
    const statusBreakdown = {
      PENDING: 0,
      CONFIRMED: 0,
      ATTENDED: 0,
      CANCELLED: 0,
    };

    registrations.forEach((reg: { status: 'PENDING' | 'CONFIRMED' | 'ATTENDED' | 'CANCELLED' }) => {
      statusBreakdown[reg.status]++;
    });

    // College distribution
    const collegeMap = new Map<string, number>();
    registrations.forEach((reg: { user: { college?: { name?: string } | null } }) => {
      const college = reg.user.college?.name || "Unknown";
      collegeMap.set(college, (collegeMap.get(college) || 0) + 1);
    });

    const collegeDistribution = Array.from(collegeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Registration timeline (group by date)
    const dateMap = new Map<string, number>();
    registrations.forEach((reg: { createdAt: Date | string }) => {
      const date = new Date(reg.createdAt).toISOString().split("T")[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    const registrationTimeline = Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Attendance rate
    const attendedCount = statusBreakdown.ATTENDED;
    const attendanceRate =
      totalRegistrations > 0
        ? ((attendedCount / totalRegistrations) * 100).toFixed(1)
        : "0";

    stage = "respond";
    return NextResponse.json({
      success: true,
      data: {
        event: {
          title: event.title,
          capacity: event.capacity,
          date: event.date,
          venue: event.venue,
          registrationType: event.registrationType,
        },
        statistics: {
          totalRegistrations,
          capacity: event.capacity || 0,
          availableSlots: Math.max((event.capacity || 0) - totalRegistrations, 0),
          attendanceRate,
          attendedCount,
        },
        statusBreakdown,
        collegeDistribution,
        registrationTimeline,
        registrations: registrations.map((reg: any) => ({
          id: reg.id,
          userName: `${reg.user.firstName} ${reg.user.lastName}`,
          userEmail: reg.user.email,
          college: reg.user.college?.name || "Unknown",
          status: reg.status,
          attendanceMarkedAt: null,
          createdAt: reg.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get event analytics error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch analytics",
        error:
          process.env.NODE_ENV === "development"
            ? `${stage}: ${errorMessage}`
            : undefined,
      },
      { status: 500 }
    );
  }
}
