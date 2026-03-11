import { prisma } from "@/lib/prisma";
import { CreateEventInput, UpdateEventInput } from "@/lib/validations";
import { ServiceResponse, EventFilterInput } from "@/types/service";

/**
 * Generate a unique 8-character event code (digits + lowercase letters)
 */
async function generateUniqueEventCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';

  while (attempts < maxAttempts) {
    // Generate a random 8-character code
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if it already exists
    const existing = await prisma.event.findUnique({
      where: { eventCode: code },
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error("Failed to generate unique event code after multiple attempts");
}

/**
 * Create a new event (ORGANIZER only)
 */
export async function createEvent(
  data: CreateEventInput,
  organiserId: string,
  collegeId: string
): Promise<ServiceResponse> {
  try {
    // Verify organiser owns this college
    const organiser = await prisma.user.findUnique({
      where: { id: organiserId },
    });

    if (!organiser || organiser.role !== "ORGANIZER") {
      throw new Error("Unauthorized: Only organizers can create events");
    }

    if (organiser.status !== "ACTIVE") {
      throw new Error("Organizer account is not approved");
    }

    if (organiser.collegeId !== collegeId) {
      throw new Error("Organiser must belong to the event's college");
    }

    // Validate future date
    const eventDate = new Date(data.date);
    if (eventDate <= new Date()) {
      throw new Error("Event date must be in the future");
    }

    // Generate unique event code
    const eventCode = await generateUniqueEventCode();

    // Create event
    const event = await prisma.event.create({
      data: {
        eventCode,
        title: data.title,
        description: data.description,
        tags: data.tags,
        date: eventDate,
        venue: data.venue,
        capacity: data.capacity,
        bannerUrl: data.bannerUrl,
        isPaid: data.isPaid,
        ticketPrice: data.ticketPrice,
        registrationType: data.registrationType,
        teamRequired: data.teamRequired,
        minTeamSize: data.minTeamSize,
        maxTeamSize: data.maxTeamSize,
        customRegistrationFields: data.customRegistrationFields,
        organiserId,
        collegeId,
      },
      include: {
        organiser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        college: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: event,
    };
  } catch (error) {
    console.error('Create event error:', error);
    return {
      success: false,
      error: 'Failed to create event',
    };
  }
}

// Get Event by ID
export async function getEventById(eventId: string): Promise<ServiceResponse> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organiser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        college: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        registrations: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    return {
      success: true,
      data: event,
    };
  } catch (error) {
    console.error('Get event by ID error:', error);
    return {
      success: false,
      error: 'Failed to fetch event',
    };
  }
}

// Get Event by Event Code
export async function getEventByCode(eventCode: string): Promise<ServiceResponse> {
  try {
    const event = await prisma.event.findUnique({
      where: { eventCode },
      include: {
        organiser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: {
                profilePhoto: true,
              },
            },
          },
        },
        college: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        registrations: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    return {
      success: true,
      data: event,
    };
  } catch (error) {
    console.error('Get event by code error:', error);
    return {
      success: false,
      error: 'Failed to fetch event',
    };
  }
}

// Get All Events with Filters
export async function getEvents(
  filters: EventFilterInput = {},
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> {
  try {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.collegeId) {
      where.collegeId = filters.collegeId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { venue: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: {
          date: 'asc',
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Get events error:', error);
    return {
      success: false,
      error: 'Failed to fetch events',
    };
  }
}

// Update Event
export async function updateEvent(
  eventId: string,
  userId: string,
  input: UpdateEventInput
): Promise<ServiceResponse> {
  try {
    // Check if event exists and user is the creator
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    if (existingEvent.organiserId !== userId) {
      return {
        success: false,
        error: 'You are not authorized to update this event',
      };
    }

    // Prepare update data
    const updateData: any = { ...input };

    if (input.date) {
      updateData.date = new Date(input.date);
    }

    if (input.venue) {
      updateData.venue = input.venue;
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
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
      },
    });

    return {
      success: true,
      data: event,
    };
  } catch (error) {
    console.error('Update event error:', error);
    return {
      success: false,
      error: 'Failed to update event',
    };
  }
}

// Delete Event
export async function deleteEvent(eventId: string, userId: string): Promise<ServiceResponse> {
  try {
    // Check if event exists and user is the creator
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return {
        success: false,
        error: 'Event not found',
      };
    }

    if (existingEvent.organiserId !== userId) {
      return {
        success: false,
        error: 'You are not authorized to delete this event',
      };
    }

    // Delete event (cascades to registrations and bookmarks)
    await prisma.event.delete({
      where: { id: eventId },
    });

    return {
      success: true,
      data: { message: 'Event deleted successfully' },
    };
  } catch (error) {
    console.error('Delete event error:', error);
    return {
      success: false,
      error: 'Failed to delete event',
    };
  }
}

// Get Events Created by User
export async function getEventsByUser(userId: string): Promise<ServiceResponse> {
  try {
    const events = await prisma.event.findMany({
      where: { organiserId: userId },
      include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    console.error('Get events by user error:', error);
    return {
      success: false,
      error: 'Failed to fetch user events',
    };
  }
}
