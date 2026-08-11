import { z } from "zod";

export const registrationSchema = z.object({
  tierId: z.coerce.number().int().positive(),
  submissionId: z.coerce.number().int().positive().nullable().optional(),
  mode: z.enum(["onsite", "online"]).default("onsite"),
  fullName: z.string().min(2, "Full name is required").max(160),
  affiliation: z.string().max(200).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  phone: z
    .string()
    .min(6, "Phone number looks too short")
    .max(32)
    .optional()
    .or(z.literal("")),
  dietaryNotes: z.string().max(500).optional().or(z.literal("")),
  needsVisaLetter: z.boolean().default(false),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const profileSchema = z.object({
  name: z.string().min(2).max(160),
  title: z.string().max(40).optional().or(z.literal("")),
  affiliation: z.string().max(200).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
});
