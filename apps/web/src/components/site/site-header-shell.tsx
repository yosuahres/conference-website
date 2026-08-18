"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { brand, event, mobileNav, nav } from "@/content/site";
import { Icon } from "./icon";
import { Container } from "./ui";

const navLink =
  "relative flex h-full items-center gap-1.5 whitespace-nowrap text-[0.95rem] font-semibold text-subtle transition-colors hover:text-ink";
const navLinkActive = "text-ink";

function TabRule() {
  return (
    <span
      aria-hidden
      className="absolute -inset-x-1 -bottom-px h-[3px] bg-ink"
    />
  );
}

function matches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActive(pathname: string, item: (typeof nav)[number]) {
  // A dropdown item has no destination of its own; it is active when one of
  // its children is.
  const hrefs =
    "children" in item ? item.children.map((child) => child.href) : [item.href];
  return hrefs.some((href) => matches(pathname, href));
}

export function SiteHeaderShell({
  wordmark,
  edition,
  submissionOpen,
}: {
  wordmark: string;
  edition: string | null;
  submissionOpen: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const submitHref = submissionOpen
    ? "/dashboard/submissions/new"
    : "/call-for-papers";

  return (
    <>
      <header className="surface-light sticky top-0 z-50 border-b border-line bg-paper">
        <Container className="relative flex h-16 items-center xl:h-24">
          <Link href="/" className="flex shrink-0 flex-col items-start">
            <Image
              src={brand.logoMain}
              alt={edition ? `${wordmark} ${edition}` : wordmark}
              width={brand.logoMainWidth}
              height={brand.logoMainHeight}
              priority
              sizes="(min-width: 1280px) 200px, 120px"
              className="h-10 w-auto xl:h-14"
            />
            <span className="mt-1.5 hidden text-[0.8rem] text-subtle sm:block">
              {event.dates} | {event.city}, {event.country}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="absolute right-0 -mr-2 rounded-full p-2 xl:hidden"
          >
            <Icon name={open ? "close" : "menu"} className="size-5" />
          </button>
        </Container>

        <Container className="hidden h-12 border-t border-line xl:block">
          <nav
            className="flex h-full items-center justify-start gap-9"
            aria-label="Primary"
          >
            {nav.map((item) => {
              const active = isActive(pathname, item);

              return "children" in item ? (
                <div
                  key={item.label}
                  className="group relative flex h-full items-center"
                >
                  <button
                    type="button"
                    aria-haspopup="true"
                    className={`${navLink} cursor-default group-hover:text-ink ${
                      active ? navLinkActive : ""
                    }`}
                  >
                    {item.label}
                    <Icon
                      name="caret"
                      className="size-3.5 transition-transform group-hover:translate-y-0.5"
                    />
                    {active ? <TabRule /> : null}
                  </button>

                  <div className="invisible absolute -left-7 top-full z-50 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="min-w-[300px] border border-line border-t-[3px] border-t-ink bg-paper py-3 shadow-xl">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            target="_blank"
                            rel="noopener"
                            aria-current={
                              matches(pathname, child.href) ? "page" : undefined
                            }
                            className={`block cursor-pointer whitespace-nowrap px-7 py-3.5 text-left text-[0.95rem] transition-colors hover:text-ink ${
                              matches(pathname, child.href)
                                ? "text-ink"
                                : "text-subtle"
                            }`}
                          >
                            {child.label}
                            <span className="sr-only">
                              {" "}
                              (opens in a new tab)
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${navLink} ${active ? navLinkActive : ""}`}
                >
                  {item.label}
                  {active ? <TabRule /> : null}
                </Link>
              );
            })}
          </nav>
        </Container>
      </header>

      <div
        id="mobile-menu"
        hidden={!open}
        className="surface-light fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-paper xl:hidden"
      >
        <Container className="py-4">
          <nav aria-label="Mobile">
            {nav.map((item) => (
              <div key={item.label}>
                {"children" in item ? (
                  // Heading only; the destinations are the children below.
                  <p
                    className={`border-b border-line py-4 font-display text-xl font-medium tracking-[-0.02em] ${
                      isActive(pathname, item) ? "text-beam" : ""
                    }`}
                  >
                    {item.label}
                  </p>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, item) ? "page" : undefined}
                    className={`flex items-center justify-between border-b border-line py-4 font-display text-xl font-medium tracking-[-0.02em] ${
                      isActive(pathname, item) ? "text-beam" : ""
                    }`}
                  >
                    {item.label}
                    <Icon name="arrow" className="size-4 text-faint" />
                  </Link>
                )}

                {"children" in item
                  ? item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        target="_blank"
                        rel="noopener"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between border-b border-line py-3.5 pl-5 text-[0.95rem] font-medium text-subtle"
                      >
                        <span>
                          {child.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </span>
                        <Icon name="arrow" className="size-3.5 text-faint" />
                      </Link>
                    ))
                  : null}
              </div>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-2.5 pb-10">
            <Link
              href={submitHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-sm font-medium text-paper"
            >
              {submissionOpen ? "Submit Paper" : "Call for Papers"}
              <Icon name="arrow" className="size-4" />
            </Link>
            <button
              type="button"
              aria-disabled="true"
              title="Coming soon. Registration has not opened yet"
              className="flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-line px-5 py-3.5 text-sm font-medium opacity-55"
            >
              Register Now
              <span className="rounded-full bg-shell px-1.5 py-px text-[0.6rem] font-semibold uppercase tracking-wider text-subtle">
                Soon
              </span>
            </button>
            <p className="mt-3 text-center text-xs text-faint">
              {event.locality}
            </p>
          </div>
        </Container>
      </div>

      <nav
        aria-label="Quick"
        className="surface-light fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {mobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={matches(pathname, item.href) ? "page" : undefined}
            className={`-mt-px flex-1 border-t-2 py-3 text-center text-[0.68rem] font-medium ${
              matches(pathname, item.href)
                ? "border-ink text-ink"
                : "border-transparent text-subtle"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
