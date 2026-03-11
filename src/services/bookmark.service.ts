import { prisma } from "@/lib/prisma";
import { ServiceResponse } from "@/types/service";

/**
 * Toggle bookmark for event - adds or removes bookmark
 */
export async function toggleBookmark(
  userId: string,
  eventId: string
): Promise<ServiceResponse> {
  try {
    // Check event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Check if bookmark exists
    const existing = await prisma.bookmark.findFirst({
      where: { userId, eventId },
    });

    if (existing) {
      // Delete bookmark
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      return {
        success: true,
        data: { bookmarked: false, message: "Bookmark removed" },
      };
    } else {
      // Create bookmark
      await prisma.bookmark.create({
        data: {
          userId,
          eventId,
        },
      });

      return {
        success: true,
        data: { bookmarked: true, message: "Bookmark added" },
      };
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return {
      success: false,
      error: "Failed to toggle bookmark",
    };
  }
}

/**
 * Get user's bookmarked events with full event details
 */
export async function getUserBookmarks(userId: string): Promise<ServiceResponse> {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            organiser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            college: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                registrations: true,
                bookmarks: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: bookmarks,
    };
  } catch (error) {
    console.error("Get user bookmarks error:", error);
    return {
      success: false,
      error: "Failed to fetch bookmarks",
    };
  }
}

/**
 * Check if a specific event is bookmarked by user
 */
export async function isEventBookmarked(
  userId: string,
  eventId: string
): Promise<ServiceResponse> {
  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return {
      success: true,
      data: { bookmarked: !!bookmark },
    };
  } catch (error) {
    console.error("Check bookmark error:", error);
    return {
      success: false,
      error: "Failed to check bookmark status",
    };
  }
}
