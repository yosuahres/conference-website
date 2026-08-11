import Link from "next/link";

import type { SubmissionStatus } from "@shared/types";
import { SubmissionStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import {
  forwardedCookies,
  getActiveConference,
  requireRole,
} from "@/lib/server-api";
import { STATUS_LABELS } from "@/lib/submission-status";

export const metadata = { title: "Submissions" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminSubmissionsPage({
  searchParams,
}: PageProps) {
  await requireRole("admin", "reviewer");
  const conference = await getActiveConference();
  const { status } = await searchParams;

  const filter =
    status && status in STATUS_LABELS
      ? (status as SubmissionStatus)
      : undefined;

  const submissions = await api.submissions.listAll(
    filter,
    await forwardedCookies(),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        <p className="text-sm text-muted-foreground">
          {submissions.length} shown
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        <FilterLink label="All" href="/admin/submissions" active={!filter} />
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <FilterLink
            key={value}
            label={label}
            href={`/admin/submissions?status=${value}`}
            active={status === value}
          />
        ))}
      </nav>

      {submissions.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Nothing matches this filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">Ref</th>
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Author</th>
                <th className="p-3 font-medium">Track</th>
                <th className="p-3 font-medium">Submitted</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map(({ submission, track, submitter }) => (
                <tr key={submission.id} className="hover:bg-accent/30">
                  <td className="whitespace-nowrap p-3 font-mono text-xs">
                    {submission.reference}
                  </td>
                  <td className="max-w-md p-3">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="font-medium hover:underline"
                    >
                      {submission.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {submitter?.name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {track?.name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {submission.submittedAt
                      ? formatDate(submission.submittedAt, conference?.timezone)
                      : "—"}
                  </td>
                  <td className="p-3">
                    <SubmissionStatusBadge status={submission.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
          : "rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
      }
    >
      {label}
    </Link>
  );
}
