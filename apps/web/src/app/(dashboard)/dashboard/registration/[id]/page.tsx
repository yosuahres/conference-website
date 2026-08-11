import { notFound } from "next/navigation";

import { RegistrationStatusBadge } from "@/components/status-badge";
import { formatDateTime, formatIdr } from "@/lib/format";
import { ApiError, api } from "@/lib/api";
import {
  forwardedCookies,
  getActiveConference,
  requireUser,
} from "@/lib/server-api";
import { PaymentActions } from "./payment-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Registration" };

export default async function RegistrationDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const conference = await getActiveConference();
  const { id } = await params;

  const detail = await api.registrations
    .get(Number(id), await forwardedCookies())
    .catch((cause) => {
      if (cause instanceof ApiError && cause.status === 404) return null;
      throw cause;
    });
  if (!detail || !conference) notFound();

  const { registration, tier, submission, payments } = detail;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {registration.invoiceNumber}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {tier.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {conference.name}
          </p>
        </div>
        <RegistrationStatusBadge status={registration.status} />
      </div>

      {registration.status === "pending_payment" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm font-medium">Payment required</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your place is reserved but not confirmed. Complete the payment to
            secure it — confirmation is automatic once the payment clears.
          </p>
          <div className="mt-4">
            <PaymentActions registrationId={registration.id} />
          </div>
        </div>
      ) : null}

      {registration.status === "paid" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-medium">Registration confirmed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            A receipt was emailed to {user.email}. Bring your invoice number to
            the registration desk.
          </p>
        </div>
      ) : null}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {(
            [
              ["Attendee", registration.fullName],
              ["Affiliation", registration.affiliation],
              ["Country", registration.country],
              ["Phone", registration.phone],
              [
                "Attendance",
                registration.mode === "online" ? "Online" : "On-site",
              ],
              ["Amount", formatIdr(registration.amount)],
              [
                "Paper",
                submission
                  ? `${submission.reference} — ${submission.title}`
                  : null,
              ],
              ["Dietary notes", registration.dietaryNotes],
              [
                "Visa letter",
                registration.needsVisaLetter ? "Requested" : null,
              ],
            ] as const
          )
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-0.5">{value}</dd>
              </div>
            ))}
        </dl>
      </section>

      {payments.length > 0 ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Payment attempts</h2>
          <ul className="mt-4 divide-y text-sm">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <p className="font-medium">{payment.providerOrderId}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.method ?? "—"} ·{" "}
                    {formatDateTime(payment.createdAt, conference.timezone)}
                  </p>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {payment.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
