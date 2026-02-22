/**
 * User Profile Service
 * Handles user profile operations: fetch, update, completion tracking
 * Manages user data and profile information across the app
 */

import { prisma } from "@/lib/prisma";

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  whatsapp?: string;
  gender?: string;
  dateOfBirth?: string;
  year?: number;
  branch?: string;
  customBranch?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  totalFields: number;
  filledFields: number;
}

/**
 * Get user by ID with basic info
 * Returns user profile, email, role, status
 */
export async function getUserById(userId: string): Promise<ServiceResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const user = await prisma.user.findUnique({
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
        profileImage: true,
        isProfileComplete: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Get user error:", error);
    return {
      success: false,
      error: "Failed to fetch user",
    };
  }
}

/**
 * Get complete user profile with all details
 * Includes both user basic info and extended profile data
 */
export async function getFullUserProfile(userId: string): Promise<ServiceResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const user = await prisma.user.findUnique({
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
        updatedAt: true,
        profileImage: true,
        isProfileComplete: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Fetch extended profile data
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        whatsapp: true,
        gender: true,
        dateOfBirth: true,
        year: true,
        branch: true,
        customBranch: true,
        city: true,
        state: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: {
        user,
        profile: profile || null,
      },
    };
  } catch (error) {
    console.error("Get full profile error:", error);
    return {
      success: false,
      error: "Failed to fetch complete profile",
    };
  }
}

/**
 * Update user profile - creates or updates profile data
 * Handles both user basic info and extended profile separately
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateProfilePayload
): Promise<ServiceResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Prepare and apply user basic info updates
    const userUpdateData: any = {};
    if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
    if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;
    if (data.profileImage !== undefined) userUpdateData.profileImage = data.profileImage;
    if (data.profileImage === null) userUpdateData.profileImage = null;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // Prepare and apply profile data updates
    const profileUpdateData: any = {};
    if (data.whatsapp !== undefined) profileUpdateData.whatsapp = data.whatsapp || null;
    if (data.gender !== undefined) profileUpdateData.gender = data.gender || null;
    if (data.dateOfBirth !== undefined) profileUpdateData.dateOfBirth = data.dateOfBirth || null;
    if (data.year !== undefined) profileUpdateData.year = data.year || null;
    if (data.branch !== undefined) profileUpdateData.branch = data.branch || null;
    if (data.customBranch !== undefined) profileUpdateData.customBranch = data.customBranch || null;
    if (data.city !== undefined) profileUpdateData.city = data.city || null;
    if (data.state !== undefined) profileUpdateData.state = data.state || null;
    if (data.country !== undefined) profileUpdateData.country = data.country || null;

    // Upsert profile (create if doesn't exist, update if exists)
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: profileUpdateData,
      create: {
        userId,
        ...profileUpdateData,
      },
    });

    return {
      success: true,
      data: {
        message: "Profile updated successfully",
        profile,
      },
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

/**
 * Check if user profile is complete
 * Returns completion percentage and list of missing fields
 */
export async function getProfileCompletion(userId: string): Promise<ServiceResponse<CompletionStatus>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Define required and optional fields
    const requiredFields = [
      'firstName',
      'lastName',
      'whatsapp',
      'branch',
      'year',
      'city',
      'state',
      'country',
    ];

    const optionalFields = ['profileImage', 'gender', 'dateOfBirth', 'customBranch'];

    // Check which required fields are filled
    const filledRequired = [
      !!user?.firstName,
      !!user?.lastName,
      !!profile?.whatsapp,
      !!profile?.branch,
      !!profile?.year,
      !!profile?.city,
      !!profile?.state,
      !!profile?.country,
    ].filter(Boolean).length;

    const missingRequired = requiredFields.filter((field) => {
      if (field === 'firstName') return !user?.firstName;
      if (field === 'lastName') return !user?.lastName;
      if (field === 'whatsapp') return !profile?.whatsapp;
      if (field === 'branch') return !profile?.branch;
      if (field === 'year') return !profile?.year;
      if (field === 'city') return !profile?.city;
      if (field === 'state') return !profile?.state;
      if (field === 'country') return !profile?.country;
      return true;
    });

    // Calculate overall completion
    const totalFields = requiredFields.length + optionalFields.length;
    const filledOptional = [
      !!user?.profileImage,
      !!profile?.gender,
      !!profile?.dateOfBirth,
      !!profile?.customBranch,
    ].filter(Boolean).length;

    const totalFilled = filledRequired + filledOptional;
    const completionPercentage = Math.round((totalFilled / totalFields) * 100);

    return {
      success: true,
      data: {
        isComplete: missingRequired.length === 0,
        completionPercentage,
        missingFields: missingRequired,
        totalFields,
        filledFields: totalFilled,
      },
    };
  } catch (error) {
    console.error("Get profile completion error:", error);
    return {
      success: false,
      error: "Failed to check profile completion",
    };
  }
}

/**
 * Mark profile as complete for registration prefill purposes
 */
export async function markProfileComplete(userId: string): Promise<ServiceResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isProfileComplete: true,
      },
      select: {
        id: true,
        isProfileComplete: true,
      },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Mark profile complete error:", error);
    return {
      success: false,
      error: "Failed to mark profile as complete",
    };
  }
}

/**
 * Get profile data optimized for registration prefill
 * Returns only fields needed for registration forms
 */
export async function getPrefillData(userId: string): Promise<ServiceResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        collegeId: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        whatsapp: true,
        gender: true,
        dateOfBirth: true,
        year: true,
        branch: true,
        city: true,
        state: true,
        country: true,
      },
    });

    return {
      success: true,
      data: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        collegeId: user?.collegeId,
        whatsapp: profile?.whatsapp,
        gender: profile?.gender,
        dateOfBirth: profile?.dateOfBirth,
        year: profile?.year,
        branch: profile?.branch,
        city: profile?.city,
        state: profile?.state,
        country: profile?.country,
      },
    };
  } catch (error) {
    console.error("Get prefill data error:", error);
    return {
      success: false,
      error: "Failed to fetch prefill data",
    };
  }
}
