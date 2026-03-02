import { hashPassword } from "@/lib/auth";
import { OrganiserRegisterInput } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

type TransactionClient = Parameters<typeof prisma.$transaction>[0] extends (
  tx: infer T
) => Promise<any>
  ? T
  : never;

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
