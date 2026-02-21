import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type UpdateEventBody = {
  title?: string;
  description?: string;
  date?: string;
  venue?: string;
  collegeId?: string;
  bannerUrl?: string;
  capacity?: number | null;
  isPaid?: boolean;
  ticketPrice?: number | null;
  registrationType?: string;
  teamRequired?: boolean;
  minTeamSize?: number;
  maxTeamSize?: number;
  tags?: string;
  customRegistrationFields?: string;
  organiserId?: string;
};

function resolveOrganizerId(req: NextRequest, bodyOrganizerId?: string) {
  return req.headers.get('x-user-id') || bodyOrganizerId || req.nextUrl.searchParams.get('organiserId');
}

// built a put request for event updation and removal 

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateEventBody;
    const organizerId = resolveOrganizerId(req, body.organiserId);

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
      select: { id: true, organiserId: true },
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
          message: 'Not authorized to update this event',
        },
        { status: 403 }
      );
    }

    const updateData: {
      title?: string;
      description?: string | null;
      date?: Date;
      venue?: string;
      collegeId?: string | null;
      bannerUrl?: string | null;
      capacity?: number | null;
      isPaid?: boolean;
      ticketPrice?: string | null;
      registrationType?: string;
      teamRequired?: boolean;
      minTeamSize?: number;
      maxTeamSize?: number;
      tags?: string | null;
      customRegistrationFields?: string | null;
    } = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.collegeId !== undefined) updateData.collegeId = body.collegeId;
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.isPaid !== undefined) updateData.isPaid = body.isPaid;
    if (body.registrationType !== undefined) updateData.registrationType = body.registrationType;
    if (body.teamRequired !== undefined) updateData.teamRequired = body.teamRequired;
    if (body.minTeamSize !== undefined) updateData.minTeamSize = body.minTeamSize;
    if (body.maxTeamSize !== undefined) updateData.maxTeamSize = body.maxTeamSize;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.customRegistrationFields !== undefined) {
      updateData.customRegistrationFields = body.customRegistrationFields;
    }

    if (body.date !== undefined) {
      const parsedDate = new Date(body.date);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid event date',
          },
          { status: 400 }
        );
      }
      updateData.date = parsedDate;
    }

    if (body.isPaid === false) {
      updateData.ticketPrice = null;
    } else if (body.ticketPrice !== undefined) {
      updateData.ticketPrice = String(body.ticketPrice);
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Event updated successfully',
        data: { event },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update event';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      select: { id: true, organiserId: true },
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
          message: 'Not authorized to delete this event',
        },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Event deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete event';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
