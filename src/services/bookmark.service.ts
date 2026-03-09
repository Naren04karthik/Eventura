/**
 * Bookmark Service
 * Handles all bookmark-related operations: toggle, fetch, check, and manage
 * Provides core functionality for saving favorite events
 */

import { prisma } from "@/lib/prisma";

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Toggle bookmark for an event
 * Adds bookmark if doesn't exist, removes if it does
 * Returns bookmark status and total bookmark count
 */
export async function toggleBookmark(
  userId: string,
  eventId: string
): Promise<ServiceResponse> {
  try {
    if (!userId || !eventId) {
      return {
        success: false,
        error: "User ID and Event ID are required",
      };
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Check if bookmark already exists
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    let bookmarked = false;
    let action = "removed";

    if (existing) {
      // Remove existing bookmark
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      bookmarked = false;
      action = "removed";
    } else {
      // Create new bookmark
      await prisma.bookmark.create({
        data: {
          userId,
          eventId,
        },
      });
      bookmarked = true;
      action = "added";
    }

    // Get updated bookmark count for event
    const totalBookmarks = await prisma.bookmark.count({
      where: { eventId },
    });

    return {
      success: true,
      data: {
        bookmarked,
        action,
        eventTitle: event.title,
        totalBookmarks,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return {
      success: false,
      error: "Failed to toggle bookmark",
    };
  }
}

/**
 * Get all bookmarked events for a user
 * Returns full event details with pagination support
 */
export async function getUserBookmarks(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ServiceResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    // Validate pagination parameters
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = Math.max(offset, 0);

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            eventCode: true,
            title: true,
            description: true,
            date: true,
            venue: true,
            bannerUrl: true,
            capacity: true,
            visibility: true,
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
      take,
      skip,
    });

    const total = await prisma.bookmark.count({
      where: { userId },
    });

    return {
      success: true,
      data: {
        bookmarks: bookmarks.map((b) => b.event),
        pagination: {
          total,
          limit: take,
          offset: skip,
          hasMore: skip + take < total,
          pages: Math.ceil(total / take),
        },
      },
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
 * Check if an event is bookmarked by a user
 * Returns boolean bookmark status
 */
export async function isEventBookmarked(
  userId: string,
  eventId: string
): Promise<ServiceResponse> {
  try {
    if (!userId || !eventId) {
      return {
        success: false,
        error: "User ID and Event ID are required",
      };
    }

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
      data: {
        bookmarked: !!bookmark,
        bookmarkId: bookmark?.id || null,
      },
    };
  } catch (error) {
    console.error("Check bookmark error:", error);
    return {
      success: false,
      error: "Failed to check bookmark status",
    };
  }
}

/**
 * Check bookmark status for multiple events at once
 * Returns map of eventId -> boolean for batch operations
 */
export async function checkMultipleBookmarks(
  userId: string,
  eventIds: string[]
): Promise<ServiceResponse> {
  try {
    if (!userId || !eventIds?.length) {
      return {
        success: false,
        error: "User ID and Event IDs are required",
      };
    }

    // Remove duplicates
    const uniqueIds = [...new Set(eventIds)];

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        eventId: { in: uniqueIds },
      },
      select: { eventId: true },
    });

    const bookmarkedIds = bookmarks.map((b) => b.eventId);
    const bookmarkMap = uniqueIds.reduce(
      (acc, id) => {
        acc[id] = bookmarkedIds.includes(id);
        return acc;
      },
      {} as Record<string, boolean>
    );

    return {
      success: true,
      data: bookmarkMap,
    };
  } catch (error) {
    console.error("Check multiple bookmarks error:", error);
    return {
      success: false,
      error: "Failed to check bookmarks",
    };
  }
}

/**
 * Get bookmark count for a specific event
 * Useful for displaying bookmark count on event cards
 */
export async function getEventBookmarkCount(eventId: string): Promise<ServiceResponse> {
  try {
    if (!eventId) {
      return {
        success: false,
        error: "Event ID is required",
      };
    }

    const count = await prisma.bookmark.count({
      where: { eventId },
    });

    return {
      success: true,
      data: { count, eventId },
    };
  } catch (error) {
    console.error("Get bookmark count error:", error);
    return {
      success: false,
      error: "Failed to fetch bookmark count",
    };
  }
}

/**
 * Delete a bookmark by ID
 * Direct removal for admin or user operations
 */
export async function deleteBookmark(bookmarkId: string): Promise<ServiceResponse> {
  try {
    if (!bookmarkId) {
      return {
        success: false,
        error: "Bookmark ID is required",
      };
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      return {
        success: false,
        error: "Bookmark not found",
      };
    }

    await prisma.bookmark.delete({
      where: { id: bookmarkId },
    });

    return {
      success: true,
      data: {
        message: "Bookmark deleted successfully",
        bookmarkId,
      },
    };
  } catch (error) {
    console.error("Delete bookmark error:", error);
    return {
      success: false,
      error: "Failed to delete bookmark",
    };
  }
}

/**
 * Clear all bookmarks for a user
 * Use with caution - removes all user's bookmarks
 */
export async function clearAllBookmarks(userId: string): Promise<ServiceResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const deleted = await prisma.bookmark.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      data: {
        message: "All bookmarks cleared",
        deletedCount: deleted.count,
        userId,
      },
    };
  } catch (error) {
    console.error("Clear bookmarks error:", error);
    return {
      success: false,
      error: "Failed to clear bookmarks",
    };
  }
}
