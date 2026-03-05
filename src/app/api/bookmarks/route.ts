import { NextRequest, NextResponse } from 'next/server';
import { getUserBookmarks, clearAllBookmarks } from '@/services/bookmark.service';

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

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return unauthorized();
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    const offsetParam = request.nextUrl.searchParams.get('offset');

    const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? Number.parseInt(offsetParam, 10) : 0;

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'limit must be a number between 1 and 100',
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(offset) || offset < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'offset must be a non-negative number',
        },
        { status: 400 }
      );
    }

    const result = await getUserBookmarks(userId, limit, offset);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch bookmarks',
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
    console.error('Bookmarks GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching bookmarks',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return unauthorized();
    }

    const result = await clearAllBookmarks(userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to clear bookmarks',
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
    console.error('Bookmarks DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while clearing bookmarks',
      },
      { status: 500 }
    );
  }
}
