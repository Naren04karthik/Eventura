import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, clearAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
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

    // SUPERADMIN cannot be deleted (hardcoded account)
    if (user.id === "SUPERADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete superadmin account",
        },
        { status: 403 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: user.id },
    });

    // Clear auth cookie
    await clearAuthCookie();

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[/api/auth/delete-account] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete account",
      },
      { status: 500 }
    );
  }
}
