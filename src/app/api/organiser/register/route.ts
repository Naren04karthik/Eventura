import { NextRequest, NextResponse } from "next/server";
import { registerOrganiser } from "@/services/organiser.service";
import { organiserRegisterSchema } from "@/lib/validations";

/**
 * POST /api/organiser/register
 * Self-register as ORGANISER (requires ADMIN approval)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = organiserRegisterSchema.parse(body);
    const user = await registerOrganiser(data);

    return NextResponse.json(
      {
        success: true,
        message: "Organizer registration submitted",
        data: { user },
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

    console.error("Organiser registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to register as organiser",
      },
      { status: 500 }
    );
  }
}
