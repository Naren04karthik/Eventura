import { NextRequest, NextResponse } from 'next/server';
import { toggleBookmark, isEventBookmarked } from '@/services/bookmark.service';

function resolveUserId(request: NextRequest): string | null {
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId && headerUserId.trim()) {
    return headerUserId.trim();
  }

  const queryUserId = request.nextUrl.searchParams.get('userId');
  if (queryUserId && queryUserId.trim()) {
    return queryUserId.trim();
  }

  return null;
}

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized: user context is missing',
    },
    { status: 401 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return unauthorized();
    }

    const body = await request.json();
    const eventId = body?.eventId;

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'eventId is required and must be a string',
        },
        { status: 400 }
      );
    }

    const result = await toggleBookmark(userId, eventId);
    if (!result.success) {
      const notFound = result.error === 'Event not found';
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to toggle bookmark',
        },
        { status: notFound ? 404 : 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bookmarks toggle POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while toggling bookmark',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return unauthorized();
    }

    const eventId = request.nextUrl.searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: 'eventId query parameter is required',
        },
        { status: 400 }
      );
    }

    const result = await isEventBookmarked(userId, eventId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to check bookmark status',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bookmarks toggle GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while checking bookmark status',
      },
      { status: 500 }
    );
  }
}
