import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendApprovalGrantedEmail, sendApprovalRequestEmail } from "@/lib/email";

/**
 * Submit a request to become an admin for a college
 */
export async function submitAdminRequest(
  collegeName: string,
  firstName: string,
  email: string,
  password: string
) {
  // Check if request already exists
  const existingRequest = await prisma.adminRequest.findUnique({
    where: { email },
  });

  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      throw new Error("An admin request with this email is already pending");
    }
    if (existingRequest.status === "APPROVED") {
      throw new Error("This email is already associated with an approved admin request");
    }
  }

  // Create the request
  const passwordHash = await bcrypt.hash(password, 10);
  const request = await prisma.adminRequest.create({
    data: {
      collegeName,
      firstName,
      email,
      passwordHash,
      status: "PENDING",
    },
  });

  await sendApprovalRequestEmail({
    type: "ADMIN",
    requesterName: firstName,
    requesterEmail: email,
    collegeName,
  });

  return request;
}

/**
 * Get all pending admin requests (SUPERADMIN only)
 */
export async function getPendingAdminRequests() {
  const requests = await prisma.adminRequest.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
}

/**
 * Create admin account from approved request (SUPERADMIN only)
 */
export async function createAdminFromRequest(
  adminRequestId: string,
  superadminId: string
) {
  // Find the request
  const request = await prisma.adminRequest.findUnique({
    where: { id: adminRequestId },
  });

  if (!request) {
    throw new Error("Admin request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  if (!request.passwordHash) {
    throw new Error("Admin request is missing a password");
  }

  // Check if a user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: request.email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  // Find or create college
  let college = await prisma.college.findFirst({
    where: { name: request.collegeName },
  });

  if (!college) {
    college = await prisma.college.create({
      data: {
        name: request.collegeName,
      },
    });
  }

  // Create admin user with firstName as provided, lastName as college name
  const adminUser = await prisma.user.create({
    data: {
      email: request.email,
      password: request.passwordHash,
      firstName: request.firstName,
      lastName: request.collegeName,
      role: "ADMIN",
      collegeId: college.id,
    },
  });

  // Update request status
  await prisma.adminRequest.update({
    where: { id: adminRequestId },
    data: { status: "APPROVED" },
  });

  await sendApprovalGrantedEmail({
    type: "ADMIN",
    recipientEmail: request.email,
    recipientName: request.firstName,
    collegeName: request.collegeName,
  });

  return {
    admin: adminUser,
    college,
  };
}

/**
 * Reject an admin request
 */
export async function rejectAdminRequest(adminRequestId: string) {
  const request = await prisma.adminRequest.findUnique({
    where: { id: adminRequestId },
  });

  if (!request) {
    throw new Error("Admin request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }

  await prisma.adminRequest.update({
    where: { id: adminRequestId },
    data: { status: "REJECTED" },
  });

  return request;
}
