import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { registerForEvent } from "@/services/registration.service";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

const getAuthenticatedUser = async (req: NextRequest) => {
  // Primary source: signed auth cookie.
  const cookieUser = await getCurrentUser();
  if (cookieUser) return cookieUser;

  // Fallback source: middleware-injected identity headers.
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      profileImage: true,
      collegeId: true,
      isProfileComplete: true,
    },
  });

  if (!dbUser) return null;

  return {
    ...dbUser,
    name: `${dbUser.firstName} ${dbUser.lastName}`.trim(),
  };
};

const buildQrPayload = (registration: {
  id: string;
  qrCode: string | null;
  eventId: string;
  event?: { title?: string | null } | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string | null;
  } | null;
}) => {
  return JSON.stringify({
    registrationId: registration.id,
    qrToken: registration.qrCode,
    eventId: registration.eventId,
    eventTitle: registration.event?.title || null,
    user: registration.user
      ? {
          id: registration.user.id,
          name: `${registration.user.firstName} ${registration.user.lastName}`.trim(),
          email: registration.user.email,
          profileImage: registration.user.profileImage || null,
        }
      : null,
  });
};

const toQrDataUrl = async (payload: string) => {
  return QRCode.toDataURL(payload, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const registration = await prisma.registration.findFirst({
      where: {
        eventId: id,
        userId: user.id,
        status: "CONFIRMED",
      },
      include: {
        event: {
          select: { title: true },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: true, isRegistered: false, message: "No active registration found", data: null },
        { status: 200 }
      );
    }

    if (!registration.qrCode) {
      return NextResponse.json(
        { success: true, isRegistered: true, message: "Registered but QR not yet generated", data: null },
        { status: 200 }
      );
    }

    const qrPayload = buildQrPayload(registration);
    const qrCode = await toQrDataUrl(qrPayload);

    return NextResponse.json(
      {
        success: true,
        isRegistered: true,
        data: {
          registrationId: registration.id,
          qrCode,
          qrData: qrPayload,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch registration",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (user.role !== "USER" && user.role !== "ORGANIZER") {
      return NextResponse.json(
        { success: false, message: "Only users and organizers can register for events" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { customFieldsData, paymentScreenshot, transactionId } = body;

    const registration = await registerForEvent(
      user.id,
      id,
      customFieldsData,
      paymentScreenshot,
      transactionId
    );
    const registrationWithUser = await prisma.registration.findUnique({
      where: { id: registration.id },
      include: {
        event: {
          select: { title: true },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!registrationWithUser || !registrationWithUser.qrCode) {
      throw new Error("Failed to create QR data for registration");
    }

    const qrPayload = buildQrPayload(registrationWithUser);
    const qrCode = await toQrDataUrl(qrPayload);

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        data: {
          registration,
          qrCode,
          qrData: qrPayload,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Registration failed",
      },
      { status: error.message?.includes("not found") ? 404 : error.message?.includes("Already") ? 409 : 400 }
    );
  }
}
