import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function resolveOrganizerId(req: NextRequest) {
  return req.headers.get('x-user-id') || req.nextUrl.searchParams.get('organiserId');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizerId = resolveOrganizerId(req);

    if (!organizerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Organizer identity is required',
        },
        { status: 401 }
      );
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { id: true, organiserId: true, isLive: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Event not found',
        },
        { status: 404 }
      );
    }

    if (existingEvent.organiserId !== organizerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Not authorized to toggle live status for this event',
        },
        { status: 403 }
      );
    }

    const event = await prisma.event.update({
      where: { id },
      data: { isLive: !existingEvent.isLive },
      select: {
        id: true,
        eventCode: true,
        title: true,
        isLive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: event.isLive ? 'Event is now live' : 'Event is no longer live',
        data: { event },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle live status';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
