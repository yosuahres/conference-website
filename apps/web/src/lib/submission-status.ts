import type { RegistrationStatus, SubmissionStatus } from "@shared/types";

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  revision_requested: "Revision requested",
  accepted: "Accepted",
  rejected: "Not accepted",
  camera_ready_submitted: "Camera-ready received",
  withdrawn: "Withdrawn",
};

export const STATUS_STYLES: Record<SubmissionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  under_review:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  revision_requested:
    "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  accepted:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  camera_ready_submitted:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  withdrawn: "bg-muted text-muted-foreground line-through",
};

/** Authors may edit only while the paper is theirs; mirrors the API's rule. */
export const EDITABLE_STATUSES: SubmissionStatus[] = [
  "draft",
  "revision_requested",
];

export function isEditableByAuthor(status: SubmissionStatus) {
  return EDITABLE_STATUSES.includes(status);
}

export const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const REGISTRATION_STYLES: Record<RegistrationStatus, string> = {
  pending_payment:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  paid: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
};

export const CATEGORY_LABELS: Record<string, string> = {
  presenter: "Presenter",
  participant: "Participant",
  student_presenter: "Student presenter",
  student_participant: "Student participant",
};
