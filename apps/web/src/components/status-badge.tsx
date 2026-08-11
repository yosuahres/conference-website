import type { RegistrationStatus, SubmissionStatus } from "@shared/types";
import { cn } from "@shared/ui/lib/utils";
import {
  REGISTRATION_LABELS,
  REGISTRATION_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/submission-status";

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

export function RegistrationStatusBadge({
  status,
  className,
}: {
  status: RegistrationStatus;
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
