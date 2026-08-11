import { cn } from "@shared/ui/lib/utils";
import type { SubmissionStatus } from "@/server/db/schema";
import { STATUS_LABELS, STATUS_STYLES } from "@/server/submissions/state";

export function SubmissionStatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const REGISTRATION_LABELS = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
} as const;

const REGISTRATION_STYLES = {
  pending_payment:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  paid: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
} as const;

export function RegistrationStatusBadge({
  status,
  className,
}: {
  status: keyof typeof REGISTRATION_LABELS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        REGISTRATION_STYLES[status],
        className,
      )}
    >
      {REGISTRATION_LABELS[status]}
    </span>
  );
}
