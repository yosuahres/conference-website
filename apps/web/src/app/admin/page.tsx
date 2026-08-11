import Link from "next/link";

import { formatIdr } from "@/lib/format";
import { requireActiveConference } from "@/server/conference/queries";
import {
  getRegistrationStats,
  listRegistrations,
} from "@/server/registrations/queries";
import { listSubmissions } from "@/server/submissions/queries";
import { STATUS_LABELS } from "@/server/submissions/state";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const conference = await requireActiveConference();

  const [submissions, registrationStats, registrations] = await Promise.all([
    listSubmissions(conference.id),
    getRegistrationStats(conference.id),
    listRegistrations(conference.id),
  ]);

  const byStatus = submissions.reduce<Record<string, number>>((acc, row) => {
    acc[row.submission.status] = (acc[row.submission.status] ?? 0) + 1;
    return acc;
  }, {});

  const revenue = registrations
    .filter((row) => row.registration.status === "paid")
    .reduce((sum, row) => sum + row.registration.amount, 0);

  const awaitingDecision = submissions.filter(
    (row) =>
      row.submission.status === "submitted" ||
      row.submission.status === "under_review",
  ).length;

  const tiles = [
    {
      label: "Submissions",
      value: submissions.length,
      href: "/admin/submissions",
    },
    {
      label: "Awaiting decision",
      value: awaitingDecision,
      href: "/admin/submissions?status=submitted",
    },
    {
      label: "Paid registrations",
      value: registrationStats.paid,
      href: "/admin/registrations",
    },
    {
      label: "Awaiting payment",
      value: registrationStats.pending,
      href: "/admin/registrations",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">{conference.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{tile.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Submissions by status</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <div key={status} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium tabular-nums">
                  {byStatus[status] ?? 0}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Registration revenue</h2>
          <p className="mt-4 text-3xl font-bold">{formatIdr(revenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Confirmed payments only.
          </p>
          <dl className="mt-6 space-y-2 text-sm">
            {[
              ["Paid", registrationStats.paid],
              ["Awaiting payment", registrationStats.pending],
              ["Cancelled", registrationStats.cancelled],
              ["Refunded", registrationStats.refunded],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between">
                <dt className="text-muted-foreground">{label as string}</dt>
                <dd className="font-medium tabular-nums">{value as number}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
