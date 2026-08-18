import { z } from "zod";

export const authorSchema = z.object({
  name: z.string().min(2, "Name is required").max(160),
  email: z.email("A valid email is required"),
  affiliation: z.string().max(200).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  isCorresponding: z.boolean().default(false),
});

export const submissionDraftSchema = z.object({
  title: z.string().min(6, "Title is too short").max(300),
  abstract: z
    .string()
    .min(100, "Abstracts must be at least 100 characters")
    .max(5000, "Abstracts are limited to 5000 characters"),
  keywords: z
    .array(z.string().min(2).max(60))
    .min(3, "Provide at least three keywords")
    .max(8, "No more than eight keywords"),
  type: z.enum(["abstract", "full_paper", "poster"]),
  trackId: z.coerce.number().int().positive().nullable(),
  authors: z
    .array(authorSchema)
    .min(1, "At least one author is required")
    .max(15)
    .refine(
      (authors) => authors.filter((a) => a.isCorresponding).length === 1,
      "Mark exactly one corresponding author",
    ),
});

export type SubmissionDraftInput = z.infer<typeof submissionDraftSchema>;

export const uploadRequestSchema = z.object({
  submissionId: z.coerce.number().int().positive(),
  kind: z.enum([
    "manuscript",
    "camera_ready",
    "supplementary",
    "copyright_form",
  ]),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(160),
  sizeBytes: z.coerce.number().int().positive(),
});

export const reviewSchema = z.object({
  submissionId: z.coerce.number().int().positive(),
  score: z.coerce.number().int().min(1).max(5),
  recommendation: z.enum([
    "accept",
    "minor_revision",
    "major_revision",
    "reject",
  ]),
  commentsToAuthor: z.string().min(20, "Please give the author some detail"),
  commentsToChair: z.string().optional().or(z.literal("")),
});

export const decisionSchema = z.object({
  submissionId: z.coerce.number().int().positive(),
  decision: z.enum(["accepted", "rejected", "revision_requested"]),
  note: z.string().max(2000).optional().or(z.literal("")),
  shareReviewerComments: z.boolean().default(true),
});
