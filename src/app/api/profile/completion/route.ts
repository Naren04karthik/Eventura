import { NextRequest, NextResponse } from 'next/server';
import { getProfileCompletion, markProfileComplete } from '@/services/user.service';

function resolveUserId(request: NextRequest): string | null {
  const fromHeader = request.headers.get('x-user-id');
  if (fromHeader && fromHeader.trim()) {
    return fromHeader.trim();
  }

  const fromQuery = request.nextUrl.searchParams.get('userId');
  if (fromQuery && fromQuery.trim()) {
    return fromQuery.trim();
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

    const result = await getProfileCompletion(userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch profile completion',
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
    console.error('Profile completion GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while checking profile completion',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return unauthorized();
    }

    const result = await markProfileComplete(userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to mark profile complete',
        },
        { status: result.error === 'User ID is required' ? 400 : 500 }
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
    console.error('Profile completion POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while marking profile complete',
      },
      { status: 500 }
    );
  }
}
