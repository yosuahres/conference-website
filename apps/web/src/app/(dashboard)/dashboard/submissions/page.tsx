import Link from "next/link";

import { Button } from "@shared/ui/components/ui/button";
import { SubmissionStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import {
  requireActiveConference,
  isSubmissionOpen,
} from "@/server/conference/queries";
import { getMySubmissions } from "@/server/submissions/queries";

export const metadata = { title: "Submissions" };

export default async function SubmissionsPage() {
  const user = await requireUser();
  const conference = await requireActiveConference();
  const submissions = await getMySubmissions(user.id, conference.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        {isSubmissionOpen(conference) ? (
          <Button asChild size="sm">
            <Link href="/dashboard/submissions/new">New submission</Link>
          </Button>
        ) : null}
      </div>

      {!isSubmissionOpen(conference) ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          Submissions are closed. Existing papers remain visible below.
        </p>
      ) : null}

      {submissions.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Nothing here yet. Start a submission to see it listed.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
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
                    {` · updated ${formatDate(submission.updatedAt, conference.timezone)}`}
                  </p>
                </div>
                <SubmissionStatusBadge status={submission.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
