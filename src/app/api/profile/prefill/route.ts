import { NextRequest, NextResponse } from 'next/server';
import { getPrefillData } from '@/services/user.service';

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

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: user context is missing',
        },
        { status: 401 }
      );
    }

    const result = await getPrefillData(userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch prefill data',
        },
        { status: result.error === 'User not found' ? 404 : 500 }
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
    console.error('Profile prefill GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching prefill data',
      },
      { status: 500 }
    );
  }
}
