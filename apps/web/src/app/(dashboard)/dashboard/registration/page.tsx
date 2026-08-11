import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth/session";
import { requireActiveConference } from "@/server/conference/queries";
import { getMyRegistrations } from "@/server/registrations/queries";

/** There is at most one live registration, so this is just a redirector. */
export default async function RegistrationIndexPage() {
  const user = await requireUser();
  const conference = await requireActiveConference();
  const registrations = await getMyRegistrations(user.id, conference.id);

  const latest = registrations[0];
  redirect(
    latest
      ? `/dashboard/registration/${latest.registration.id}`
      : "/dashboard/register",
  );
}
