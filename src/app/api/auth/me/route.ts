import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { user },
      },
      {
        status: 200,
        headers: {
          // Browser caches this for 30s — avoids hitting the DB on every page navigation.
          // stale-while-revalidate lets the page load instantly while refreshing in bg.
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}
