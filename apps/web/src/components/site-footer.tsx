import Image from "next/image";
import Link from "next/link";

import {
  brand,
  event,
  footerBlurb,
  footerColumns,
  secretariat,
} from "@/content/site";
import { Icon } from "./site/icon";
import { Container, StubLink } from "./site/ui";

export function SiteFooter() {
  return (
    <footer className="surface-light border-t border-line bg-mist">
      <Container className="pb-16 pt-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Image
              src={brand.logoMain}
              alt={`${event.shortName} ${event.edition}`}
              width={brand.logoMainWidth}
              height={brand.logoMainHeight}
              sizes="(min-width: 768px) 280px, 220px"
              className="h-[72px] w-auto mix-blend-multiply md:h-24"
            />
            <p className="mt-5 max-w-xs text-[0.83rem] leading-[1.75] text-subtle">
              {footerBlurb}
            </p>
          </div>

          <div>
            <p className="font-display text-[1.25rem] font-semibold tracking-[-0.02em]">
              Get In Touch
            </p>
            <div className="rule mt-3 w-20" />

            <address className="mt-6 space-y-3.5 text-[0.85rem] not-italic leading-[1.7] text-subtle">
              <div className="flex items-start gap-2.5">
                <Icon
                  name="pin"
                  className="mt-1 size-3.5 shrink-0 text-faint"
                />
                <span>
                  {secretariat.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Icon
                  name="signal"
                  className="mt-1 size-3.5 shrink-0 text-faint"
                />
                <span>
                  Telp/Fax:{" "}
                  <a
                    href={secretariat.phoneHref}
                    className="transition-colors hover:text-ink"
                  >
                    {secretariat.phoneLabel}
                  </a>
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Icon
                  name="mail"
                  className="mt-1 size-3.5 shrink-0 text-faint"
                />
                <a
                  href={`mailto:${secretariat.email}`}
                  className="underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  {secretariat.email}
                </a>
              </div>
            </address>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="font-display text-[1.25rem] font-semibold tracking-[-0.02em]">
                {column.heading}
              </p>
              <div className="rule mt-3 w-20" />
              <ul className="mt-6 space-y-3 text-[0.85rem]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="text-subtle transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <StubLink>{link.label}</StubLink>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>
    </footer>
  );
}
