import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users
 * Get admin-visible users.
 * SUPERADMIN: admin accounts.
 * ADMIN: users from the same college.
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

    if (user.role === "SUPERADMIN") {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: "ADMIN",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          college: {
            select: {
              name: true,
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
          data: adminUsers,
          count: adminUsers.length,
        },
        { status: 200 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Only ADMIN or SUPERADMIN can view users" },
        { status: 403 }
      );
    }

    const adminRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { collegeId: true },
    });

    const adminCollegeId = user.collegeId || adminRecord?.collegeId;

    if (!adminCollegeId) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    const collegeUsers = await prisma.user.findMany({
      where: {
        collegeId: adminCollegeId,
        role: {
          in: ["USER", "ORGANIZER"],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: collegeUsers,
        count: collegeUsers.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get admin users error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch admin users",
      },
      { status: 500 }
    );
  }
}
