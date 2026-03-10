import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only organizers can mark attendance' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { registrationId } = body as { registrationId?: string };

    if (!registrationId) {
      return NextResponse.json(
        { success: false, message: 'Registration ID is required' },
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
      select: {
        id: true,
        title: true,
        organiserId: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'SUPERADMIN' && user.id !== event.organiserId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to mark attendance for this event' },
        { status: 403 }
      );
    }

    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        eventId: event.id,
      },
      select: {
        id: true,
        status: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      );
    }

    if (registration.status === 'ATTENDED') {
      return NextResponse.json(
        {
          success: true,
          message: 'Attendance already marked',
          data: {
            registrationId: registration.id,
            status: registration.status,
          },
        },
        { status: 200 }
      );
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        status: 'ATTENDED',
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Attendance marked successfully',
        data: {
          registrationId: updated.id,
          status: updated.status,
          userName: `${registration.user.firstName} ${registration.user.lastName}`.trim(),
          userEmail: registration.user.email,
          eventTitle: event.title,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to mark attendance',
      },
      { status: 500 }
    );
  }
}
