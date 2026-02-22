import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["USER", "ORGANIZER"]).default("USER"),
  collegeId: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().uuid("College is required").optional()
  ),
  collegeName: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(2, "College name is required").optional()
  ),
  organizationName: z.string().min(2, "College name is required").optional(),
  contactNumber: z.string().min(6, "Contact number is required").optional(),
  reason: z.string().min(10, "Reason is required").optional(),
}).superRefine((data, ctx) => {
  if (data.role === "USER" && !data.collegeId && !data.collegeName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "College is required", path: ["collegeId"] });
  }
  if (data.role === "ORGANIZER") {
    if (!data.organizationName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "College name is required", path: ["organizationName"] });
    }
    if (!data.contactNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Contact number is required", path: ["contactNumber"] });
    }
    if (!data.reason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reason is required", path: ["reason"] });
    }
  }
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
