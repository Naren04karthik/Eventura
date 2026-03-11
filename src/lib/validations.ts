import { z } from "zod";

// Auth Schemas
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

// Event Schemas
export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  tags: z.string().optional(),
  date: z.string().datetime("Invalid date format").refine(
    (date) => new Date(date) > new Date(),
    "Event date must be in the future"
  ),
  venue: z.string().min(3, "Venue must be at least 3 characters"),
  capacity: z.number().int().positive("Capacity must be a positive number"),
  bannerUrl: z.string().url("Invalid banner URL"),
  isPaid: z.boolean().optional().default(false),
  ticketPrice: z.number().min(0, "Ticket price must be non-negative").optional().default(0),
  registrationType: z.enum(["SOLO", "TEAM"]).optional().default("SOLO"),
  teamRequired: z.boolean().optional().default(false),
  minTeamSize: z.number().int().min(1, "Min team size must be at least 1").optional().default(1),
  maxTeamSize: z.number().int().min(1, "Max team size must be at least 1").optional().default(5),
  customRegistrationFields: z.string().optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  date: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    "Event date must be in the future"
  ).optional(),
  venue: z.string().min(3).optional(),
  capacity: z.number().int().positive().optional(),
  bannerUrl: z.string().url().optional(),
  isPaid: z.boolean().optional(),
  ticketPrice: z.number().min(0).optional(),
  registrationType: z.enum(["SOLO", "TEAM"]).optional(),
  teamRequired: z.boolean().optional(),
  minTeamSize: z.number().int().min(1).optional(),
  maxTeamSize: z.number().int().min(1).optional(),
  customRegistrationFields: z.string().optional(),
});

// Registration Schemas
export const registerForEventSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
});

export const verifyAttendanceSchema = z.object({
  qrData: z.string().min(1, "QR data is required"),
});

// Bookmark Schemas
export const toggleBookmarkSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
});

// Query Schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive()).default("1"),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100)).default("20"),
});

export const exploreEventsSchema = paginationSchema.extend({
  search: z.string().optional(),
  filter: z.enum(["upcoming", "past"]).optional(),
  college: z.string().uuid().optional(),
});

// Admin Request Schema (Contact Us form for admin/organiser)
export const submitAdminRequestSchema = z.object({
  collegeName: z.string().min(3, "College name must be at least 3 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Organiser Registration Schema
export const organiserRegisterSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  organizationName: z.string().min(2, "College name is required"),
  contactNumber: z.string().min(6, "Contact number is required"),
  reason: z.string().min(10, "Reason is required"),
});

// SUPERADMIN Login Schema
export const superadminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Branch enum for profile
export const branchEnum = z.enum([
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
  "AIDS",
  "AIML",
  "BBA",
  "BCA",
  "MBA",
  "MCA",
  "OTHER",
]);

// Profile Completion Schema
export const completeProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  whatsapp: z.string().min(10, "Valid WhatsApp number is required"),
  gender: z.string().optional(),
  dateOfBirth: z.string().refine(
    (date) => {
      const dob = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 15 && age <= 100;
    },
    "You must be at least 15 years old"
  ),
  college: z.string().min(2, "College name is required"),
  year: z.number().int().min(1, "Year must be between 1 and 5").max(5, "Year must be between 1 and 5"),
  branch: branchEnum,
  customBranch: z.string().optional(),
  collegeId: z.string().min(2, "College ID is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  profilePhoto: z.string().optional().refine(
    (val) => !val || val.startsWith('http') || val.startsWith('data:image/'),
    "Invalid profile photo format"
  ),
}).superRefine((data, ctx) => {
  // If branch is OTHER, customBranch is required
  if (data.branch === "OTHER" && !data.customBranch) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify your branch",
      path: ["customBranch"],
    });
  }
  // If branch is not OTHER, customBranch must be null/empty
  if (data.branch !== "OTHER" && data.customBranch) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Custom branch should only be provided when branch is OTHER",
      path: ["customBranch"],
    });
  }
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
export type VerifyAttendanceInput = z.infer<typeof verifyAttendanceSchema>;
export type ExploreEventsInput = z.infer<typeof exploreEventsSchema>;
export type SubmitAdminRequestInput = z.infer<typeof submitAdminRequestSchema>;
export type OrganiserRegisterInput = z.infer<typeof organiserRegisterSchema>;
export type SuperadminLoginInput = z.infer<typeof superadminLoginSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
