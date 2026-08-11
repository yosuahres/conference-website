import Link from "next/link";

import { Button } from "@shared/ui/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { getActiveConference, getNavPages } from "@/server/conference/queries";
import { MobileNav } from "./mobile-nav";

const STATIC_LINKS = [
  { href: "/call-for-papers", label: "Call for Papers" },
  { href: "/speakers", label: "Speakers" },
  { href: "/program", label: "Programme" },
  { href: "/register", label: "Registration" },
];

export async function SiteHeader() {
  const conference = await getActiveConference();
  const [user, cmsPages] = await Promise.all([
    getCurrentUser(),
    conference ? getNavPages(conference.id) : Promise.resolve([]),
  ]);

  const links = [
    ...STATIC_LINKS,
    ...cmsPages.map((page) => ({
      href: `/${page.slug}`,
      label: page.navLabel ?? page.title,
    })),
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">
            {conference?.shortName ?? conference?.name ?? "Conference"}
          </span>
          {conference?.edition ? (
            <span className="text-xs text-muted-foreground">
              {conference.edition}
            </span>
          ) : null}
        </Link>

        <nav className="hidden flex-1 items-center gap-5 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                {user.role === "admin" ? "Admin" : "My account"}
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard/submissions/new">Submit paper</Link>
              </Button>
            </>
          )}
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
