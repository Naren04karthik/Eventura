import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function submitAdminRequest(
  collegeName: string,
  firstName: string,
  email: string,
  password: string
) {
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

  return request;
}
