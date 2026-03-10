import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { isLive } = await request.json();

    // Check if event exists and user is the organizer
    const event = await prisma.event.findUnique({
      where: { id },
      select: { organiserId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organiserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the event organizer can change live status' },
        { status: 403 }
      );
    }

    // Update live status
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { isLive: isLive === true },
      select: {
        id: true,
        isLive: true,
        title: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: isLive ? 'Event is now live' : 'Event is no longer live',
    });
  } catch (error) {
    console.error('Error updating event live status:', error);
    return NextResponse.json(
      { error: 'Failed to update live status' },
      { status: 500 }
    );
  }
}
