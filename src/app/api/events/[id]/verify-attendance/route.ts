import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyAttendanceSchema } from "@/lib/validations";
import { markAttendance } from "@/services/registration.service";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, message: "Only organizers can mark attendance" },
        { status: 403 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Organizer account is not approved" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = verifyAttendanceSchema.parse(body);

    let qrToken = "";

    // Support both legacy "registrationId:qrToken" and JSON QR payload format.
    try {
      const parsed = JSON.parse(data.qrData);
      qrToken = parsed?.qrToken || "";
    } catch {
      const [, legacyToken] = data.qrData.split(":");
      qrToken = legacyToken || "";
    }

    if (!qrToken) {
      return NextResponse.json(
        { success: false, message: "Invalid QR code format" },
        { status: 400 }
      );
    }

    const { id: eventIdentifier } = await params;
    const looksLikeEventCode = /^[a-z0-9]{8}$/i.test(eventIdentifier);
    const event = await prisma.event.findFirst({
      where: looksLikeEventCode
        ? { eventCode: eventIdentifier }
        : {
            OR: [{ id: eventIdentifier }, { eventCode: eventIdentifier }],
          },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const result = await markAttendance(event.id, qrToken, user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Attendance marked successfully",
        data: {
          userName: `${result.user.firstName} ${result.user.lastName}`.trim(),
          userImage: result.user.profileImage,
          eventTitle: result.event.title,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to verify attendance",
      },
      { status: error.message?.includes("Invalid") ? 400 : error.message?.includes("not found") ? 404 : error.message?.includes("Unauthorized") ? 403 : 500 }
    );
  }
}
