import { prisma } from "@/lib/prisma";
import { sendEventRegistrationSuccessEmail } from "@/lib/email";
import crypto from "crypto";

/**
 * Register user for event
 */
export async function registerForEvent(
  userId: string,
  eventId: string,
  customFieldsData?: Record<string, any>,
  paymentScreenshot?: string,
  transactionId?: string
) {
  // Check event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Check event date is in future
  if (event.date < new Date()) {
    throw new Error("Event registration closed");
  }

  // Check user not already registered
  const existing = await prisma.registration.findFirst({
    where: { userId, eventId, status: "CONFIRMED" },
  });

  if (existing) {
    throw new Error("Already registered for this event");
  }

  // Check capacity
  const registrationCount = await prisma.registration.count({
    where: { eventId, status: "CONFIRMED" },
  });

  if (event.capacity !== null && registrationCount >= event.capacity) {
    throw new Error("Event is full");
  }

  // Generate QR token
  const qrToken = crypto.randomUUID();

  // Create registration
  const registration = await prisma.registration.create({
    data: {
      userId,
      eventId,
      qrCode: qrToken,
      status: "CONFIRMED",
      customFieldsData: customFieldsData ? JSON.stringify(customFieldsData) : null,
      paymentScreenshot: paymentScreenshot || null,
      transactionId: transactionId || null,
    },
    include: {
      event: {
        select: { title: true, date: true },
      },
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });


  await sendEventRegistrationSuccessEmail(registration.user.email, event.title);

  return registration;
}

/**
 * Get user's registrations
 */
export async function getUserRegistrations(userId: string) {
  return prisma.registration.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          eventCode: true,
          title: true,
          date: true,
          venue: true,
          bannerUrl: true,
          capacity: true,
        },
      },
    },
    orderBy: {
      event: { date: "desc" },
    },
  });
}

/**
 * Get event registrations (organizer view)
 */
export async function getEventRegistrations(eventId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [total, registrations] = await Promise.all([
    prisma.registration.count({ where: { eventId } }),
    prisma.registration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    success: true,
    data: {
      total,
      page,
      limit,
      registrations,
    },
  };
}

/**
 * Mark attendance for registration
 */
export async function markAttendance(
  eventId: string,
  qrToken: string,
  organiserId: string
) {
  // Verify organiser owns event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.organiserId !== organiserId) {
    throw new Error("Unauthorized: You don't own this event");
  }

  // Find registration
  const registration = await prisma.registration.findFirst({
    where: { eventId, qrCode: qrToken },
    include: {
      user: {
        select: { firstName: true, lastName: true, profileImage: true },
      },
    },
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  if (registration.status === 'ATTENDED') {
    throw new Error("Attendance already marked");
  }

  // Mark attendance
  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { status: 'ATTENDED' },
    include: {
      user: {
        select: { firstName: true, lastName: true, profileImage: true },
      },
      event: {
        select: { title: true },
      },
    },
  });

  return updated;
}

/**
 * Cancel registration
 */
export async function cancelRegistration(
  registrationId: string,
  userId: string
) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  if (registration.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return prisma.registration.update({
    where: { id: registrationId },
    data: { status: "CANCELLED" },
  });
}
