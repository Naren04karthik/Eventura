import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// added a route for creating new event 
type CreateEventBody = {
  title?: string;
  description?: string;
  date?: string;
  venue?: string;
  organiserId?: string;
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
};

function buildEventCode() {
  return Math.random().toString(36).slice(2, 10);
}

async function generateUniqueEventCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = buildEventCode();
    const existing = await prisma.event.findUnique({
      where: { eventCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error('Failed to generate unique event code');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateEventBody;

    if (!body.title || !body.date || !body.venue || !body.organiserId) {
      return NextResponse.json(
        {
          success: false,
          message: 'title, date, venue and organiserId are required',
        },
        { status: 400 }
      );
    }

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

    const eventCode = await generateUniqueEventCode();

    const event = await prisma.event.create({
      data: {
        eventCode,
        title: body.title,
        description: body.description,
        date: parsedDate,
        venue: body.venue,
        organiserId: body.organiserId,
        collegeId: body.collegeId,
        bannerUrl: body.bannerUrl,
        capacity: body.capacity ?? null,
        isPaid: Boolean(body.isPaid),
        ticketPrice: body.isPaid ? String(body.ticketPrice ?? 0) : null,
        registrationType: body.registrationType ?? 'SOLO',
        teamRequired: Boolean(body.teamRequired),
        minTeamSize: body.minTeamSize ?? 1,
        maxTeamSize: body.maxTeamSize ?? 5,
        tags: body.tags,
        customRegistrationFields: body.customRegistrationFields,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Event created successfully',
        data: { event },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create event';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
