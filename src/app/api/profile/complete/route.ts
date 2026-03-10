import { NextRequest, NextResponse } from "next/server";
import { generateToken, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeProfileSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if profile already completed
    if (user.isProfileComplete) {
      const token = await generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        isProfileComplete: true,
      });

      const response = NextResponse.json({
        message: "Profile already completed",
      });

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = completeProfileSchema.parse(body);

    // Create profile and update user in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.profile.create({
        data: {
          userId: user.id,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          whatsapp: validatedData.whatsapp,
          gender: validatedData.gender || null,
          dateOfBirth: new Date(validatedData.dateOfBirth),
          college: validatedData.college,
          year: validatedData.year,
          branch: validatedData.branch,
          customBranch: validatedData.branch === "OTHER" ? validatedData.customBranch || null : null,
          collegeId: validatedData.collegeId,
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          profilePhoto: validatedData.profilePhoto || null,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { isProfileComplete: true },
      });
    });

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isProfileComplete: true,
    });

    const response = NextResponse.json({
      message: "Profile completed successfully",
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Complete profile error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to complete profile" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user data for prefilling the form
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with college data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        college: true,
        profile: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      college: userData.college?.name || "",
      collegeId: userData.profile?.collegeId || userData.collegeId || "",
      isProfileComplete: userData.isProfileComplete,
      profile: userData.profile,
    });

    if (userData.isProfileComplete) {
      const token = await generateToken({
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        isProfileComplete: true,
      });

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Get profile data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}
