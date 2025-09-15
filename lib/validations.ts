import { z } from "zod"

export const citySchema = z.enum(["CHANDIGARH", "MOHALI", "ZIRAKPUR", "PANCHKULA", "OTHER"])
export const propertyTypeSchema = z.enum(["APARTMENT", "VILLA", "PLOT", "OFFICE", "RETAIL"])
export const bhkSchema = z.enum(["ONE", "TWO", "THREE", "FOUR", "STUDIO"])
export const purposeSchema = z.enum(["BUY", "RENT"])
export const timelineSchema = z.enum([
  "ZERO_TO_THREE_MONTHS",
  "THREE_TO_SIX_MONTHS",
  "MORE_THAN_SIX_MONTHS",
  "EXPLORING",
])
export const sourceSchema = z.enum(["WEBSITE", "REFERRAL", "WALK_IN", "CALL", "OTHER"])
export const statusSchema = z.enum([
  "NEW",
  "QUALIFIED",
  "CONTACTED",
  "VISITED",
  "NEGOTIATION",
  "CONVERTED",
  "DROPPED",
])

// base object (extendable)
const buyerBaseSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must be less than 80 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().regex(/^\d{10,15}$/, "Phone must be 10-15 digits"),
  city: citySchema,
  propertyType: propertyTypeSchema,
  bhk: bhkSchema.optional(),
  purpose: purposeSchema,
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  timeline: timelineSchema,
  source: sourceSchema,
  status: statusSchema.optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  tags: z.array(z.string()).optional(),
})

// now apply refinements (keeps it extendable)
export const buyerSchema = buyerBaseSchema
  .refine(
    (data) => {
      if ((data.propertyType === "APARTMENT" || data.propertyType === "VILLA") && !data.bhk) {
        return false
      }
      return true
    },
    {
      message: "BHK is required for Apartment and Villa property types",
      path: ["bhk"],
    },
  )
  .refine(
    (data) => {
      if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
        return false
      }
      return true
    },
    {
      message: "Maximum budget must be greater than or equal to minimum budget",
      path: ["budgetMax"],
    },
  )

// csv schema can now extend the base
export const csvBuyerSchema = buyerBaseSchema.extend({
  status: statusSchema, // make status required for CSV import
})

export const searchParamsSchema = z.object({
  page: z.string().optional().default("1"),
  search: z.string().optional(),
  city: citySchema.optional(),
  propertyType: propertyTypeSchema.optional(),
  status: statusSchema.optional(),
  timeline: timelineSchema.optional(),
})

// Helper function to check for duplicate emails
export const checkEmailUniqueness = async (email: string, userId: string, excludeId?: string) => {
  if (!email || email.trim() === "") return true // Allow empty emails
  
  const { prisma } = await import("./prisma")
  
  const existingBuyer = await prisma.buyer.findFirst({
    where: {
      email: email.trim(),
      ownerId: userId,
      ...(excludeId && { id: { not: excludeId } })
    }
  })
  
  return !existingBuyer // Return true if no duplicate found
}
