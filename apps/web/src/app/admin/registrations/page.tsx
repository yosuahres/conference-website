import { RegistrationStatusBadge } from "@/components/status-badge";
import { Button } from "@shared/ui/components/ui/button";
import { formatDate, formatIdr } from "@/lib/format";
import { api } from "@/lib/api";
import {
  forwardedCookies,
  getActiveConference,
  requireRole,
} from "@/lib/server-api";

export const metadata = { title: "Registrations" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export default async function AdminRegistrationsPage() {
  await requireRole("admin");
  const conference = await getActiveConference();
  const registrations = await api.registrations.listAll(
    await forwardedCookies(),
  );

  const paidTotal = registrations
    .filter((row) => row.registration.status === "paid")
    .reduce((sum, row) => sum + row.registration.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Registrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {registrations.length} total · {formatIdr(paidTotal)} collected
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          {/* Served by the API so the CSV streams straight from the source. */}
          <a href={`${API_URL}/registrations/admin/export.csv`}>Export CSV</a>
        </Button>
      </div>

      {registrations.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No registrations yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">Invoice</th>
                <th className="p-3 font-medium">Attendee</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Mode</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Created</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {registrations.map(({ registration, tier }) => (
                <tr key={registration.id} className="hover:bg-accent/30">
                  <td className="whitespace-nowrap p-3 font-mono text-xs">
                    {registration.invoiceNumber}
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{registration.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {registration.affiliation ?? "—"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {tier.name}
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {registration.mode === "online" ? "Online" : "On-site"}
                  </td>
                  <td className="whitespace-nowrap p-3 tabular-nums">
                    {formatIdr(registration.amount)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {formatDate(registration.createdAt, conference?.timezone)}
                  </td>
                  <td className="p-3">
                    <RegistrationStatusBadge status={registration.status} />
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
