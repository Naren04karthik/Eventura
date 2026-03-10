import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, generateToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Update User record
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        email,
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
        collegeId: true,
      },
    });

    // Update Profile record if exists
    const profileData: any = {};
    
    if (body.whatsapp !== undefined) profileData.whatsapp = String(body.whatsapp).trim();
    if (body.gender !== undefined) profileData.gender = String(body.gender).trim();
    if (body.dateOfBirth !== undefined) {
      profileData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    }
    if (body.college !== undefined) profileData.college = String(body.college).trim();
    if (body.year !== undefined) profileData.year = parseInt(body.year);
    if (body.branch !== undefined) profileData.branch = String(body.branch).trim();
    if (body.customBranch !== undefined) profileData.customBranch = String(body.customBranch).trim();
    if (body.collegeId !== undefined) profileData.collegeId = String(body.collegeId).trim();
    if (body.city !== undefined) profileData.city = String(body.city).trim();
    if (body.state !== undefined) profileData.state = String(body.state).trim();
    if (body.country !== undefined) profileData.country = String(body.country).trim();
    if (body.profilePhoto !== undefined) profileData.profilePhoto = String(body.profilePhoto).trim();

    // Check if profile exists and update it
    if (Object.keys(profileData).length > 0) {
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      if (existingProfile) {
        await prisma.profile.update({
          where: { userId: user.id },
          data: profileData,
        });
      }
    }

    const token = await generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      isProfileComplete: updatedUser.isProfileComplete,
    });

    const response = NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
