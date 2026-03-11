import { hashPassword } from "@/lib/auth";
import { OrganiserRegisterInput } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { sendApprovalGrantedEmail, sendApprovalRequestEmail } from "@/lib/email";

type TransactionClient = Parameters<typeof prisma.$transaction>[0] extends (
  tx: infer T
) => Promise<any>
  ? T
  : never;

/**
 * Organiser self-registration (creates PENDING account)
 * Account requires ADMIN approval before dashboard access
 */
export async function registerOrganiser(data: OrganiserRegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(data.password);

  const organiserUser = await prisma.$transaction(async (tx: TransactionClient) => {
    const user = await tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: "ORGANIZER",
        status: "PENDING",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    await tx.organizerRequest.create({
      data: {
        userId: user.id,
        organizationName: data.organizationName,
        contactNumber: data.contactNumber,
        reason: data.reason,
      },
    });

    return user;
  });

  await sendApprovalRequestEmail({
    type: "ORGANIZER",
    requesterName: `${organiserUser.firstName} ${organiserUser.lastName}`.trim(),
    requesterEmail: organiserUser.email,
    organizationName: data.organizationName,
    reason: data.reason,
  });

  return organiserUser;
}

export async function checkOrganiserStatus(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true },
  });

  if (!user || user.role !== "ORGANIZER") {
    throw new Error("Organizer account not found");
  }

  return user.status;
}

export async function getPendingOrganisers() {
  return prisma.organizerRequest.findMany({
    where: {
      user: {
        role: "ORGANIZER",
        status: "PENDING",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function approveOrganiser(requestId: string, reviewedBy: string, collegeId?: string) {
  const request = await prisma.organizerRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!request) {
    throw new Error("Organizer request not found");
  }

  if (request.user.status !== "PENDING") {
    throw new Error("Organizer request is not pending");
  }

  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    const user = await tx.user.update({
      where: { id: request.userId },
      data: { 
        status: "ACTIVE",
        collegeId: collegeId || null,
      },
    });

    const updatedRequest = await tx.organizerRequest.update({
      where: { id: requestId },
      data: {
        reviewedBy,
        reviewedAt: new Date(),
      },
    });

    return { user, request: updatedRequest };
  });

  await sendApprovalGrantedEmail({
    type: "ORGANIZER",
    recipientEmail: result.user.email,
    recipientName: `${result.user.firstName} ${result.user.lastName}`.trim(),
    organizationName: request.organizationName,
  });

  return result;
}

export async function rejectOrganiser(requestId: string, reviewedBy: string) {
  const request = await prisma.organizerRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!request) {
    throw new Error("Organizer request not found");
  }

  if (request.user.status !== "PENDING") {
    throw new Error("Organizer request is not pending");
  }

  return prisma.$transaction(async (tx: TransactionClient) => {
    const user = await tx.user.update({
      where: { id: request.userId },
      data: { status: "REJECTED" },
    });

    const updatedRequest = await tx.organizerRequest.update({
      where: { id: requestId },
      data: {
        reviewedBy,
        reviewedAt: new Date(),
      },
    });

    return { user, request: updatedRequest };
  });
}
