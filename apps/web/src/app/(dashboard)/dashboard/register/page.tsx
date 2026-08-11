import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@shared/ui/components/ui/button";
import { requireUser } from "@/server/auth/session";
import {
  isRegistrationOpen,
  requireActiveConference,
} from "@/server/conference/queries";
import {
  getAvailableTiers,
  getMyRegistrations,
} from "@/server/registrations/queries";
import { getRegisterableSubmissions } from "@/server/submissions/queries";
import { RegistrationForm } from "./registration-form";

export const metadata = { title: "Register" };

interface PageProps {
  searchParams: Promise<{ tier?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const user = await requireUser("/dashboard/register");
  const conference = await requireActiveConference();

  // An existing registration takes precedence — send them to it rather than
  // letting them create a second one that the action would reject anyway.
  const existing = await getMyRegistrations(user.id, conference.id);
  const active = existing.find(
    (row) =>
      row.registration.status === "paid" ||
      row.registration.status === "pending_payment",
  );
  if (active) redirect(`/dashboard/registration/${active.registration.id}`);

  if (!isRegistrationOpen(conference)) {
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
    getAvailableTiers(conference.id),
    getRegisterableSubmissions(user.id, conference.id),
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
        tiers={tiers.map((tier) => ({
          id: tier.id,
          name: tier.name,
          category: tier.category,
          mode: tier.mode,
          price: tier.price,
          description: tier.description,
        }))}
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
