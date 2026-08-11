import Link from "next/link";
import { FileText, LayoutDashboard, Receipt, UserCog } from "lucide-react";

import { requireUser } from "@/server/auth/session";
import { getActiveConference } from "@/server/conference/queries";
import { SignOutButton } from "@/components/sign-out-button";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/submissions", label: "Submissions", icon: FileText },
  { href: "/dashboard/registration", label: "Registration", icon: Receipt },
  { href: "/dashboard/profile", label: "Profile", icon: UserCog },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser("/dashboard");
  const conference = await getActiveConference();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="text-sm font-bold tracking-tight">
            {conference?.shortName ?? conference?.name ?? "Conference"}
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            ) : null}
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-8">
        <aside className="hidden w-52 shrink-0 md:block">
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
