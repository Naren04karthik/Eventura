import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createEventSchema, exploreEventsSchema } from "@/lib/validations";
import { createEvent, getEvents } from "@/services/event.service";
import { prisma } from "@/lib/prisma";

// GET /api/events - Browse all events
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
      filter: searchParams.get("filter") || undefined,
      college: searchParams.get("college") || undefined,
    };

    const data = exploreEventsSchema.parse(queryParams);
    
    const result = await getEvents({
      search: data.search,
      filter: data.filter,
      collegeId: data.college,
    }, data.page, data.limit);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to fetch events",
        },
        { status: 500 }
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
    console.error("Get events error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch events",
      },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event (ORGANIZER only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (user.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, message: "Only organizers can create events" },
        { status: 403 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Organizer account is not approved" },
        { status: 403 }
      );
    }

    let organizerCollegeId = user.collegeId;

    // Backfill missing organizer college for legacy approvals.
    if (!organizerCollegeId) {
      const latestRequest = await prisma.organizerRequest.findFirst({
        where: { userId: user.id },
        orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
        select: { organizationName: true },
      });

      const collegeName = latestRequest?.organizationName?.trim();

      if (collegeName) {
        const existingCollege = await prisma.college.findFirst({
          where: {
            name: {
              equals: collegeName,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

        const resolvedCollege =
          existingCollege ||
          (await prisma.college.create({
            data: { name: collegeName },
            select: { id: true },
          }));

        await prisma.user.update({
          where: { id: user.id },
          data: { collegeId: resolvedCollege.id },
        });

        organizerCollegeId = resolvedCollege.id;
      }
    }

    if (!organizerCollegeId) {
      return NextResponse.json(
        {
          success: false,
          message: "User must belong to a college. Ask admin to re-approve with a college.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = createEventSchema.parse(body);

    const result = await createEvent(data, user.id, organizerCollegeId);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to create event",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully",
        data: { event: result.data },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create event error:", error);
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create event",
      },
      { status: 500 }
    );
  }
}
