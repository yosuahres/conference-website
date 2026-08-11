import Link from "next/link";

import { Button } from "@shared/ui/components/ui/button";
import {
  RegistrationStatusBadge,
  SubmissionStatusBadge,
} from "@/components/status-badge";
import { formatDate, formatIdr } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import {
  getActiveConference,
  isRegistrationOpen,
  isSubmissionOpen,
} from "@/server/conference/queries";
import { getMyRegistrations } from "@/server/registrations/queries";
import { getMySubmissions } from "@/server/submissions/queries";

export const metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await requireUser();
  const conference = await getActiveConference();

  if (!conference) {
    return (
      <p className="text-sm text-muted-foreground">
        No active conference is configured yet.
      </p>
    );
  }

  const [submissions, registrations] = await Promise.all([
    getMySubmissions(user.id, conference.id),
    getMyRegistrations(user.id, conference.id),
  ]);

  const registration = registrations[0];
  const hasAccepted = submissions.some(
    (row) =>
      row.submission.status === "accepted" ||
      row.submission.status === "camera_ready_submitted",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{conference.name}</p>
      </div>

      {hasAccepted && !registration ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-medium">
            Your paper has been accepted — complete your registration
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Accepted papers appear in the programme only after the presenter has
            registered and paid.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/dashboard/register">Register now</Link>
          </Button>
        </div>
      ) : null}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Your submissions</h2>
          {isSubmissionOpen(conference) ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/submissions/new">New submission</Link>
            </Button>
          ) : null}
        </div>

        {submissions.length === 0 ? (
          <p className="mt-4 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            You have not submitted anything yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border bg-card">
            {submissions.map(({ submission, track }) => (
              <li key={submission.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/submissions/${submission.id}`}
                      className="font-medium hover:underline"
                    >
                      {submission.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {submission.reference}
                      {track ? ` · ${track.name}` : ""}
                      {submission.submittedAt
                        ? ` · submitted ${formatDate(submission.submittedAt, conference.timezone)}`
                        : ""}
                    </p>
                  </div>
                  <SubmissionStatusBadge status={submission.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Registration</h2>
          {!registration && isRegistrationOpen(conference) ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/register">Register</Link>
            </Button>
          ) : null}
        </div>

        {!registration ? (
          <p className="mt-4 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            You are not registered for this conference yet.
          </p>
        ) : (
          <div className="mt-4 rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{registration.tier.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {registration.registration.invoiceNumber} ·{" "}
                  {formatIdr(registration.registration.amount)}
                </p>
              </div>
              <RegistrationStatusBadge
                status={registration.registration.status}
              />
            </div>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link
                href={`/dashboard/registration/${registration.registration.id}`}
              >
                {registration.registration.status === "pending_payment"
                  ? "Complete payment"
                  : "View details"}
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
