import {
  earlyBirdUntil,
  event,
  keyDates,
  submissionWindow,
} from "@/content/site";

export type KeyDate = (typeof keyDates)[number];

export function nextDeadline(now = Date.now()): KeyDate | null {
  return keyDates.find((entry) => new Date(entry.iso).getTime() > now) ?? null;
}

export function activeDeadlineNumber(now = Date.now()): string | null {
  return nextDeadline(now)?.n ?? null;
}

export function isSubmissionOpen(now = Date.now()): boolean {
  return (
    now >= new Date(submissionWindow.opensAt).getTime() &&
    now <= new Date(submissionWindow.closesAt).getTime()
  );
}

export function isEarlyBird(now = Date.now()): boolean {
  return now <= new Date(earlyBirdUntil).getTime();
}

export function isRegistrationOpen(now = Date.now()): boolean {
  return now < new Date(event.endsAt).getTime();
}

export function submitHref(now = Date.now()): string {
  return isSubmissionOpen(now)
    ? "/dashboard/submissions/new"
    : "/call-for-papers";
}
