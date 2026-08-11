import { redirect } from "next/navigation";

import { api } from "@/lib/api";
import { forwardedCookies, requireUser } from "@/lib/server-api";

/** There is at most one live registration, so this is just a redirector. */
export default async function RegistrationIndexPage() {
  await requireUser();
  const registrations = await api.registrations.listMine(
    await forwardedCookies(),
  );

  const latest = registrations[0];
  redirect(
    latest
      ? `/dashboard/registration/${latest.registration.id}`
      : "/dashboard/register",
  );
}
