import type { Metadata } from "next";
import Link from "next/link";

import { getActiveConference } from "@/lib/server-api";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const conference = await getActiveConference();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-8 text-center">
        <p className="text-lg font-bold tracking-tight">
          {conference?.shortName ?? conference?.name ?? "Conference"}
        </p>
        {conference?.edition ? (
          <p className="text-sm text-muted-foreground">{conference.edition}</p>
        ) : null}
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
