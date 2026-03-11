import { prisma } from "@/lib/prisma";
import { ServiceResponse } from "@/types/service";

export async function getAnalyticsData(): Promise<ServiceResponse> {
  try {
    // Total users by role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        id: true,
      },
    });

    // Total events
    const totalEvents = await prisma.event.count();

    // Total registrations
    const totalRegistrations = await prisma.registration.count();

    // Total colleges
    const totalColleges = await prisma.college.count();

    // Event status breakdown
    const eventsByStatus = await prisma.event.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Registrations by status
    const registrationsByStatus = await prisma.registration.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Top 5 events by registrations
    const topEvents = await prisma.event.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        date: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        registrations: {
          _count: "desc",
        },
      },
    });

    // User status breakdown
    const usersByStatus = await prisma.user.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Recent registrations (last 10)
    const recentRegistrations = await prisma.registration.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        summary: {
          totalUsers: usersByRole.reduce((sum: number, r: { role: string; _count: { id: number } }) => sum + r._count.id, 0),
          totalEvents,
          totalRegistrations,
          totalColleges,
        },
        usersByRole,
        usersByStatus,
        eventsByStatus,
        registrationsByStatus,
        topEvents: topEvents.map((e: { id: string; title: string; date: Date; _count: { registrations: number } }) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          registrationCount: e._count.registrations,
        })),
        recentRegistrations: recentRegistrations.map((r: { id: string; status: string; createdAt: Date; user: { firstName: string; lastName: string; email: string }; event: { title: string } }) => ({
          id: r.id,
          userName: `${r.user.firstName} ${r.user.lastName}`,
          userEmail: r.user.email,
          eventTitle: r.event.title,
          status: r.status,
          registeredAt: r.createdAt,
        })),
      },
    };
  } catch (error) {
    console.error("Analytics error:", error);
    return {
      success: false,
      error: "Failed to fetch analytics data",
    };
  }
}
