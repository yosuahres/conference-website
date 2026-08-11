import Link from "next/link";

import { formatIdr } from "@/lib/format";
import { api } from "@/lib/api";
import {
  forwardedCookies,
  getActiveConference,
  requireRole,
} from "@/lib/server-api";
import { STATUS_LABELS } from "@/lib/submission-status";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  await requireRole("admin");
  const conference = await getActiveConference();
  const cookieHeader = await forwardedCookies();

  if (!conference) {
    return (
      <p className="text-sm text-muted-foreground">
        No active conference is configured yet.
      </p>
    );
  }

  const [submissions, stats, registrations] = await Promise.all([
    api.submissions.listAll(undefined, cookieHeader),
    api.registrations.stats(cookieHeader),
    api.registrations.listAll(cookieHeader),
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
      value: stats.paid,
      href: "/admin/registrations",
    },
    {
      label: "Awaiting payment",
      value: stats.pending,
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
            {(
              [
                ["Paid", stats.paid],
                ["Awaiting payment", stats.pending],
                ["Cancelled", stats.cancelled],
                ["Refunded", stats.refunded],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
