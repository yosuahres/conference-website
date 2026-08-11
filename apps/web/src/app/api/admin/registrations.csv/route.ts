import { getCurrentUser } from "@/server/auth/session";
import { requireActiveConference } from "@/server/conference/queries";
import { listRegistrations } from "@/server/registrations/queries";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "Invoice",
  "Status",
  "Name",
  "Affiliation",
  "Country",
  "Phone",
  "Category",
  "Mode",
  "Amount",
  "Currency",
  "Dietary notes",
  "Visa letter",
  "Created",
  "Paid",
];

/** Escapes a value for CSV, guarding against spreadsheet formula injection. */
function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export async function GET() {
  // A plain route handler, so the role check cannot lean on the admin layout.
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const conference = await requireActiveConference();
  const registrations = await listRegistrations(conference.id);

  const rows = registrations.map(({ registration, tier }) =>
    [
      registration.invoiceNumber,
      registration.status,
      registration.fullName,
      registration.affiliation,
      registration.country,
      registration.phone,
      tier.name,
      registration.mode,
      registration.amount,
      registration.currency,
      registration.dietaryNotes,
      registration.needsVisaLetter ? "yes" : "no",
      registration.createdAt.toISOString(),
      registration.paidAt?.toISOString() ?? "",
    ]
      .map(cell)
      .join(","),
  );

  const csv = [COLUMNS.map(cell).join(","), ...rows].join("\r\n");

  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${conference.slug}-registrations.csv"`,
    },
  });
}
