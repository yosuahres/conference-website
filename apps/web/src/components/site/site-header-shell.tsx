"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { brand, nav } from "@/content/site";
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
}: {
  wordmark: string;
  edition: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Label of the mobile nav group being drilled into, if any.
  const [group, setGroup] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) setGroup(null);
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const openGroup = nav.find(
    (item) => item.label === group && "children" in item,
  );

  return (
    <>
      <header
        className={`surface-light sticky top-0 z-50 border-b bg-paper ${
          open ? "border-transparent xl:border-line" : "border-line"
        }`}
      >
        <Container
          className={`relative flex items-center xl:h-[4.5rem] xl:items-end ${
            open ? "h-28" : "h-16"
          }`}
        >
          {/* While the mobile menu is open the logo takes the centre of the
              bar, leaving the close button alone on the right. */}
          <Link
            href="/"
            className={`flex shrink-0 flex-col items-start ${
              open
                ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 xl:static xl:translate-x-0 xl:translate-y-0"
                : ""
            }`}
          >
            <Image
              src={open ? brand.logo : brand.logoMain}
              alt={edition ? `${wordmark} ${edition}` : wordmark}
              width={open ? brand.logoWidth : brand.logoMainWidth}
              height={open ? brand.logoHeight : brand.logoMainHeight}
              priority
              sizes="(min-width: 1280px) 200px, 120px"
              className={open ? "h-24 w-auto" : "h-10 w-auto xl:h-14"}
            />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={`-mr-3 ml-auto shrink-0 self-center rounded-full p-3 xl:hidden ${
              open ? "text-black" : ""
            }`}
          >
            <Icon
              name={open ? "close" : "menu"}
              strokeWidth={2.4}
              className="size-6"
            />
          </button>
        </Container>

        <Container className="hidden h-8 xl:block">
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
        className="surface-light fixed inset-x-0 bottom-0 top-28 z-40 overflow-y-auto bg-paper xl:hidden"
      >
        <Container className="pb-10 pt-8">
          <nav aria-label="Mobile" className="text-black">
            {openGroup && "children" in openGroup ? (
              <>
                <button
                  type="button"
                  onClick={() => setGroup(null)}
                  className="flex w-full items-center justify-end gap-1 py-4 text-right font-display text-2xl font-semibold tracking-[-0.02em] text-subtle"
                >
                  <Icon
                    name="chevron"
                    strokeWidth={1.2}
                    className="size-8 rotate-90"
                  />
                  Back
                </button>

                {openGroup.children.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    target="_blank"
                    rel="noopener"
                    onClick={() => setOpen(false)}
                    className="block py-4 text-right font-display text-3xl font-semibold tracking-[-0.02em]"
                  >
                    {child.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>
                ))}
              </>
            ) : (
              nav.map((item) =>
                // A group has no destination of its own; tapping it swaps this
                // list for its children.
                "children" in item ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setGroup(item.label)}
                    className="flex w-full items-center justify-end gap-0 py-4 text-right font-display text-2xl font-semibold tracking-[-0.02em]"
                  >
                    {item.label}
                    <Icon
                      name="chevron"
                      strokeWidth={1.2}
                      className="-ml-0.5 size-8"
                    />
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, item) ? "page" : undefined}
                    className="block py-4 text-right font-display text-2xl font-semibold tracking-[-0.02em]"
                  >
                    {item.label}
                  </Link>
                ),
              )
            )}
          </nav>
        </Container>
      </div>
    </>
  );
}
