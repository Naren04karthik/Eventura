import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markAttendance } from "@/services/registration.service";
import { attendanceMarkSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "ORGANIZER") {
      return NextResponse.json({ success: false, message: "Only organizers can mark attendance" }, { status: 403 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ success: false, message: "Organizer account is not approved" }, { status: 403 });
    }

    const body = await req.json();
    const { registrationId } = attendanceMarkSchema.parse(body);
    const { id: eventIdentifier } = await params;

    const result = await markAttendance(eventIdentifier, registrationId, user.id);

    return NextResponse.json(
      { success: true, message: "Attendance marked successfully", data: result },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to mark attendance" },
      { status: error.message?.includes("Unauthorized") ? 403 : 400 }
    );
  }
}