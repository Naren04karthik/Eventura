import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export interface CreateOrganiserPayload {
  firstName: string;
  lastName: string;
  email: string;
  collegeId: string;
}

export async function createOrganiser(
  data: CreateOrganiserPayload,
  adminId: string
) {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can create organisers");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await hashPassword(tempPassword);

  const organiser = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      role: "ORGANIZER",
      status: "ACTIVE",
      collegeId: data.collegeId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      collegeId: true,
    },
  });

  return organiser;
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      collegeId: true,
      createdAt: true,
    },
  });
}