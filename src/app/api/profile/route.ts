import { NextRequest, NextResponse } from 'next/server';
import { getFullUserProfile, updateUserProfile } from '@/services/user.service';

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

function badRequest(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 400 }
  );
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

    const result = await getFullUserProfile(userId);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch profile',
        },
        { status: result.error === 'User not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: result.data?.user ?? null,
        profile: result.data?.profile ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching profile',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    if (!userId) {
      return unauthorized();
    }

    const body = await request.json();

    if (body.firstName !== undefined && typeof body.firstName !== 'string') {
      return badRequest('firstName must be a string');
    }

    if (body.lastName !== undefined && typeof body.lastName !== 'string') {
      return badRequest('lastName must be a string');
    }

    if (body.year !== undefined && body.year !== null) {
      const isNumber = typeof body.year === 'number' && Number.isInteger(body.year);
      if (!isNumber || body.year < 1 || body.year > 5) {
        return badRequest('year must be an integer between 1 and 5');
      }
    }

    if (body.gender !== undefined && body.gender !== null) {
      const allowed = ['M', 'F', 'O'];
      if (typeof body.gender !== 'string' || !allowed.includes(body.gender)) {
        return badRequest('gender must be one of M, F, O');
      }
    }

    if (body.dateOfBirth) {
      const dob = new Date(body.dateOfBirth);
      if (Number.isNaN(dob.getTime())) {
        return badRequest('dateOfBirth must be a valid date string');
      }

      if (dob.getTime() > Date.now()) {
        return badRequest('dateOfBirth cannot be in the future');
      }
    }

    const result = await updateUserProfile(userId, body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to update profile',
        },
        { status: result.error === 'User not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.data?.message || 'Profile updated successfully',
        profile: result.data?.profile ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while updating profile',
      },
      { status: 500 }
    );
  }
}
