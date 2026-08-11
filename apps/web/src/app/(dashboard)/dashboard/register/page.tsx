import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@shared/ui/components/ui/button";
import { api } from "@/lib/api";
import {
  forwardedCookies,
  getActiveConference,
  requireUser,
} from "@/lib/server-api";
import { RegistrationForm } from "./registration-form";

export const metadata = { title: "Register" };

interface PageProps {
  searchParams: Promise<{ tier?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const user = await requireUser("/dashboard/register");
  const conference = await getActiveConference();
  const cookieHeader = await forwardedCookies();

  // An existing registration takes precedence — send them to it rather than
  // letting them start a second one the API would reject anyway.
  const existing = await api.registrations.listMine(cookieHeader);
  const active = existing.find(
    (row) =>
      row.registration.status === "paid" ||
      row.registration.status === "pending_payment",
  );
  if (active) redirect(`/dashboard/registration/${active.registration.id}`);

  if (!conference?.registrationOpen) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold">Registration is closed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact the organising committee if you believe this is an error.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const [tiers, acceptedPapers, { tier: tierParam }] = await Promise.all([
    api.registrations.tiers(),
    api.submissions.registerable(cookieHeader),
    searchParams,
  ]);

  if (tiers.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold">No categories available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registration fees have not been published yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Registration</h1>
        <p className="mt-1 text-sm text-muted-foreground">{conference.name}</p>
      </div>

      <RegistrationForm
        tiers={tiers}
        acceptedPapers={acceptedPapers}
        defaultTierId={tierParam ? Number(tierParam) : undefined}
        user={{
          name: user.name,
          affiliation: user.affiliation,
          country: user.country,
          phone: user.phone,
        }}
      />
    </div>
  );
}
