import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is organizer or super admin
    if (user.role !== 'ORGANIZER' && user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only organizers and admins can mark attendance' },
        { status: 403 }
      );
    }

    const { qrToken } = await req.json();

    if (!qrToken) {
      return NextResponse.json(
        { error: 'QR token is required' },
        { status: 400 }
      );
    }

    // Find registration by QR code
    const registration = await prisma.registration.findFirst({
      where: {
        qrCode: qrToken,
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
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
            organiserId: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 404 }
      );
    }

    // Check if user is organizer of this event or superadmin
    const isSuperAdmin = user.role === 'SUPERADMIN';
    const isOrganizer = registration.event.organiserId === user.id;

    if (!isSuperAdmin && !isOrganizer) {
      return NextResponse.json(
        { error: 'Unauthorized to mark attendance for this event' },
        { status: 403 }
      );
    }

    // Mark attendance
    const updatedRegistration = await prisma.registration.update({
      where: {
        id: registration.id,
      },
      data: {
        status: 'ATTENDED',
      },
      select: {
        status: true,
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

    return NextResponse.json({
      success: true,
      message: registration.status === 'ATTENDED' ? 'Attendance already marked' : 'Attendance marked successfully',
      registration: {
        studentName: `${updatedRegistration.user.firstName} ${updatedRegistration.user.lastName}`,
        email: updatedRegistration.user.email,
        eventTitle: updatedRegistration.event.title,
        registeredAt: registration.createdAt,
        markedAt: registration.status === 'ATTENDED' ? null : new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
