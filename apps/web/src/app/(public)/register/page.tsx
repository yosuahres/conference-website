import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@shared/ui/components/ui/button";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/submission-status";
import { getActiveConference } from "@/lib/server-api";

export const metadata = { title: "Registration" };

export default async function RegisterPage() {
  const conference = await getActiveConference();
  if (!conference) notFound();

  const tiers = await api.registrations.tiers();
  const open = conference.registrationOpen;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Registration</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Fees below are per person and include conference materials, coffee
        breaks and lunch for on-site attendance. Presenters must register for
        their accepted paper to appear in the programme.
      </p>

      {conference.registrationDeadline ? (
        <p className="mt-4 text-sm">
          <span className="font-medium">Registration closes:</span>{" "}
          {formatDate(conference.registrationDeadline, conference.timezone)}
        </p>
      ) : null}

      {tiers.length === 0 ? (
        <p className="mt-10 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Registration is not open yet. Fees will be published here.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col rounded-lg border bg-card p-6"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[tier.category] ?? tier.category} ·{" "}
                {tier.mode === "online" ? "Online" : "On-site"}
              </p>
              <p className="mt-2 text-base font-semibold">{tier.name}</p>
              <p className="mt-4 text-3xl font-bold tracking-tight">
                {tier.priceFormatted}
              </p>

              {tier.description ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {tier.description}
                </p>
              ) : null}

              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                {tier.validUntil ? (
                  <p>
                    Available until{" "}
                    {formatDate(tier.validUntil, conference.timezone)}
                  </p>
                ) : null}
                {tier.remaining !== null ? (
                  <p>{tier.remaining} places remaining</p>
                ) : null}
              </div>

              <Button asChild className="mt-6 w-full" disabled={!open}>
                <Link href={`/dashboard/register?tier=${tier.id}`}>
                  {open ? "Select" : "Closed"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      <section className="mt-14 rounded-lg border bg-muted/40 p-6">
        <h2 className="text-base font-semibold">Payment</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Payments are processed by Midtrans. Bank transfer, virtual account,
          QRIS, e-wallet and credit card are all supported. Your registration is
          confirmed automatically once the payment clears, and a receipt is
          emailed to you.
        </p>
      </section>
    </div>
  );
}
