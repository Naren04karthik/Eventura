import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function resolveOrganizerId(req: NextRequest) {
  return req.headers.get('x-user-id') || req.nextUrl.searchParams.get('organiserId');
}

export async function GET(req: NextRequest) {
  try {
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

    const events = await prisma.event.findMany({
      where: { organiserId: organizerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { events },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch organizer events';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
