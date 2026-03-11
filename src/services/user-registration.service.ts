import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";

export interface UserRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileImage?: string;
  role?: "USER" | "ORGANIZER";
  collegeId?: string;
  collegeName?: string;
  organizationName?: string;
  contactNumber?: string;
  reason?: string;
}

export async function registerUser(data: UserRegisterPayload) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(data.password);
  const role = data.role ?? "USER";

  if (role === "ORGANIZER") {
    const organizerCollegeName = data.organizationName || data.collegeName;

    if (!organizerCollegeName || !data.contactNumber || !data.reason) {
      throw new Error("Organizer college details are required");
    }

    const organisationUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: hashedPassword,
          profileImage: data.profileImage || null,
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
          profileImage: true,
          isProfileComplete: true,
        },
      });

      await tx.organizerRequest.create({
        data: {
          userId: user.id,
          organizationName: organizerCollegeName,
          contactNumber: data.contactNumber!,
          reason: data.reason!,
        },
      });

      return user;
    });

    const token = await generateToken({
      userId: organisationUser.id,
      email: organisationUser.email,
      role: organisationUser.role,
      status: organisationUser.status,
      isProfileComplete: organisationUser.isProfileComplete,
    });

    return { user: organisationUser, token };
  }

  let resolvedCollegeId = data.collegeId || null;
  const collegeName = data.collegeName?.trim();

  if (!resolvedCollegeId && collegeName) {
    const existingCollege = await prisma.college.findFirst({
      where: {
        name: {
          equals: collegeName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingCollege) {
      resolvedCollegeId = existingCollege.id;
    } else {
      const createdCollege = await prisma.college.create({
        data: { name: collegeName },
        select: { id: true },
      });
      resolvedCollegeId = createdCollege.id;
    }
  }

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      profileImage: data.profileImage || null,
      role: "USER",
      status: "ACTIVE",
      collegeId: resolvedCollegeId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      profileImage: true,
      isProfileComplete: true,
    },
  });

  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    isProfileComplete: user.isProfileComplete,
  });

  return { user, token };
}