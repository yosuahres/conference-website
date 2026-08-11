import type { SubmissionStatus } from "@/server/db/schema";

/**
 * Allowed status transitions. Postgres only knows the enum; the ordering rules
 * live here so both the author actions and the admin actions get the same
 * answer to "can this move?".
 */
const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  draft: ["submitted", "withdrawn"],
  submitted: [
    "under_review",
    "revision_requested",
    "accepted",
    "rejected",
    "withdrawn",
  ],
  under_review: ["revision_requested", "accepted", "rejected", "withdrawn"],
  revision_requested: ["submitted", "withdrawn"],
  accepted: ["camera_ready_submitted", "withdrawn"],
  rejected: [],
  camera_ready_submitted: ["accepted"],
  withdrawn: [],
};

export function canTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`A submission cannot move from "${from}" to "${to}".`);
  }
}

/** Authors may edit content only while the paper is theirs to change. */
export const EDITABLE_STATUSES: SubmissionStatus[] = [
  "draft",
  "revision_requested",
];

export function isEditableByAuthor(status: SubmissionStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

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

/** Tailwind classes for the status badge, kept next to the labels. */
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
