import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Home, LayoutDashboard, Receipt, Users } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { getActiveConference, requireRole } from "@/lib/server-api";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/submissions", label: "Submissions", icon: FileText },
  { href: "/admin/registrations", label: "Registrations", icon: Receipt },
  { href: "/admin/people", label: "People", icon: Users },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("admin", "reviewer");
  const conference = await getActiveConference();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link href="/admin" className="text-sm font-bold tracking-tight">
            {conference?.shortName ?? "Admin"}
            <span className="ml-2 rounded bg-foreground px-1.5 py-0.5 text-[10px] uppercase text-background">
              {user.role}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Home className="size-4" />
              Public site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
