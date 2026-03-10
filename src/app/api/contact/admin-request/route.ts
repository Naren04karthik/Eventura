import { NextRequest, NextResponse } from "next/server";
import { submitAdminRequest } from "@/services/admin.service";
import { submitAdminRequestSchema } from "@/lib/validations";

/**
 * POST /api/contact/admin-request
 * Submit admin request from "Contact Us" form
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = submitAdminRequestSchema.parse(body);

    const request = await submitAdminRequest(
      data.collegeName,
      data.firstName,
      data.email,
      data.password
    );

    return NextResponse.json(
      {
        success: true,
        message: "Admin request submitted successfully. You will be contacted once reviewed.",
        data: {
          id: request.id,
          collegeName: request.collegeName,
          email: request.email,
          status: request.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Admin request error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to submit admin request",
      },
      { status: 500 }
    );
  }
}
