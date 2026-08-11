/**
 * The contract between apps/api and apps/web.
 *
 * These are hand-written rather than inferred from the Drizzle schema on
 * purpose: the API serialises dates to ISO strings over JSON, and a few
 * endpoints return computed fields (`submissionOpen`, `priceFormatted`) that
 * exist nowhere in the database. Inferring would quietly lie about both.
 */

export type UserRole = "attendee" | "reviewer" | "admin";

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  title: string | null;
  affiliation: string | null;
  country: string | null;
  phone: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------- conference --

export interface Conference {
  id: number;
  slug: string;
  name: string;
  shortName: string | null;
  edition: string | null;
  tagline: string | null;
  description: string | null;
  startsOn: string | null;
  endsOn: string | null;
  venueName: string | null;
  venueAddress: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  submissionOpensAt: string | null;
  submissionDeadline: string | null;
  notificationDate: string | null;
  cameraReadyDeadline: string | null;
  registrationDeadline: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  /** Computed by the API from the deadlines above. */
  submissionOpen: boolean;
  registrationOpen: boolean;
}

export interface Track {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface Speaker {
  id: number;
  name: string;
  title: string | null;
  affiliation: string | null;
  country: string | null;
  bio: string | null;
  isKeynote: boolean;
  sortOrder: number;
}

export interface ScheduleDay {
  day: string;
  items: {
    item: {
      id: number;
      title: string;
      description: string | null;
      room: string | null;
      startsAt: string;
      endsAt: string | null;
      day: string;
    };
    speaker: Speaker | null;
  }[];
}

export interface NavPage {
  slug: string;
  title: string;
  navLabel: string | null;
}

export interface ContentPage {
  id: number;
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
}

// ------------------------------------------------------------ submissions --

export type SubmissionType = "abstract" | "full_paper" | "poster";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "accepted"
  | "rejected"
  | "camera_ready_submitted"
  | "withdrawn";

export type SubmissionFileKind =
  | "manuscript"
  | "camera_ready"
  | "supplementary"
  | "copyright_form";

export interface Submission {
  id: number;
  reference: string;
  title: string;
  abstract: string;
  keywords: string[];
  type: SubmissionType;
  status: SubmissionStatus;
  trackId: number | null;
  submittedAt: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAuthor {
  id: number;
  name: string;
  email: string;
  affiliation: string | null;
  country: string | null;
  /** Stored as 0/1 in Postgres; treat non-zero as true. */
  isCorresponding: number;
  sortOrder: number;
}

export interface SubmissionFile {
  id: number;
  kind: SubmissionFileKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  uploadedAt: string;
}

export interface SubmissionReview {
  id: number;
  score: number | null;
  recommendation:
    | "accept"
    | "minor_revision"
    | "major_revision"
    | "reject"
    | null;
  commentsToAuthor: string | null;
  /** Only present for admins. */
  commentsToChair?: string | null;
  submittedAt: string | null;
  dueAt: string | null;
  reviewer: { id: number; name: string };
}

export interface SubmissionListItem {
  submission: Submission;
  track: Track | null;
  submitter?: { id: number; name: string; email: string };
}

export interface SubmissionDetail extends SubmissionListItem {
  submitter: { id: number; name: string; email: string };
  authors: SubmissionAuthor[];
  files: SubmissionFile[];
  reviews: SubmissionReview[];
}

export interface SaveSubmissionInput {
  title: string;
  abstract: string;
  keywords: string[];
  type: SubmissionType;
  trackId: number | null;
  authors: {
    name: string;
    email: string;
    affiliation?: string;
    country?: string;
    isCorresponding: boolean;
  }[];
}

export interface UploadTicket {
  uploadUrl: string;
  storageKey: string;
  version: number;
}

// ----------------------------------------------------------- registration --

export type AttendeeCategory =
  | "presenter"
  | "participant"
  | "student_presenter"
  | "student_participant";

export type AttendanceMode = "onsite" | "online";

export type RegistrationStatus =
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded";

export interface RegistrationTier {
  id: number;
  name: string;
  category: AttendeeCategory;
  mode: AttendanceMode;
  price: number;
  priceFormatted: string;
  currency: string;
  description: string | null;
  validFrom: string | null;
  validUntil: string | null;
  /** Null means unlimited. */
  remaining: number | null;
}

export interface Registration {
  id: number;
  invoiceNumber: string;
  status: RegistrationStatus;
  mode: AttendanceMode;
  amount: number;
  currency: string;
  fullName: string;
  affiliation: string | null;
  country: string | null;
  phone: string | null;
  dietaryNotes: string | null;
  needsVisaLetter: boolean;
  submissionId: number | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Payment {
  id: number;
  providerOrderId: string;
  providerTransactionId: string | null;
  method: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface RegistrationListItem {
  registration: Registration;
  tier: RegistrationTier;
  submission?: Pick<Submission, "id" | "reference" | "title"> | null;
}

export interface RegistrationDetail extends RegistrationListItem {
  payments: Payment[];
}

export interface CreateRegistrationInput {
  tierId: number;
  submissionId?: number | null;
  mode: AttendanceMode;
  fullName: string;
  affiliation?: string;
  country?: string;
  phone?: string;
  dietaryNotes?: string;
  needsVisaLetter: boolean;
}

/** What the API returns after reserving a place — the browser follows the URL. */
export interface PaymentHandoff {
  registrationId?: number;
  snapToken: string;
  redirectUrl: string;
}

export interface RegistrationStats {
  paid: number;
  pending: number;
  cancelled: number;
  refunded: number;
}
