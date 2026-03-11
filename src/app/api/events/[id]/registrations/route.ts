// API Route: GET /api/events/[id]/registrations - Get event registrations (organizers)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id]/registrations - Get event registrations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventIdentifier } = await params;
    const looksLikeEventCode = /^[a-z0-9]{8}$/i.test(eventIdentifier);

    // Get user ID from headers (set by middleware)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    // Resolve event by short code or UUID, then authorize organizer access.
    const event = await prisma.event.findFirst({
      where: looksLikeEventCode
        ? { eventCode: eventIdentifier }
        : {
            OR: [{ id: eventIdentifier }, { eventCode: eventIdentifier }],
          },
      select: {
        id: true,
        eventCode: true,
        title: true,
        organiserId: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      );
    }

    const role = request.headers.get('x-user-role');
    const isSuperAdmin = role === 'SUPERADMIN';

    if (!isSuperAdmin && event.organiserId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'You are not authorized to view registrations for this event',
        },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const skip = (page - 1) * limit;

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where: { eventId: event.id } }),
      prisma.registration.findMany({
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
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          total,
          page,
          limit,
          registrations,
          event: {
            id: event.id,
            eventCode: event.eventCode,
            title: event.title,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get event registrations API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message || 'Internal server error' : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
