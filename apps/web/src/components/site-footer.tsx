import Link from "next/link";

import { formatDateRange } from "@/lib/format";
import { getActiveConference } from "@/server/conference/queries";

export async function SiteFooter() {
  const conference = await getActiveConference();
  if (!conference) return null;

  return (
    <footer className="mt-20 border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold">{conference.name}</p>
          {conference.tagline ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {conference.tagline}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">
            {formatDateRange(
              conference.startsOn,
              conference.endsOn,
              conference.timezone,
            )}
            {conference.venueName ? ` · ${conference.venueName}` : ""}
            {conference.city ? `, ${conference.city}` : ""}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Authors
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/call-for-papers" className="hover:underline">
                Call for Papers
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/submissions/new"
                className="hover:underline"
              >
                Submit a paper
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:underline">
                Registration fees
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contact
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {conference.contactEmail ? (
              <li>
                <a
                  href={`mailto:${conference.contactEmail}`}
                  className="hover:underline"
                >
                  {conference.contactEmail}
                </a>
              </li>
            ) : null}
            {conference.venueAddress ? (
              <li className="text-muted-foreground">
                {conference.venueAddress}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t py-6">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {conference.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
