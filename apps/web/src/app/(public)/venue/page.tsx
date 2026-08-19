import Image from "next/image";

import { Icon } from "@/components/site/icon";
import { Container } from "@/components/site/ui";
import { event, venue } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Venue",
  description: `${event.shortName} ${event.edition} is held at ${venue.name}, ${event.city}, ${event.region}, ${event.country}, ${event.dates}. Venue address and map.`,
  path: "/venue",
});

const pin = `${venue.coords.lat},${venue.coords.lng}`;

export default function VenuePage() {
  return (
    <>
      {/* Outside surface-light on purpose: the banner sits on the dark
          site-ground palette so its wash matches the home hero. */}
      <div className="relative h-[46vh] min-h-[280px] w-full overflow-hidden bg-paper md:h-[62vh]">
        <Image
          src="/photos/gedung.png"
          alt={`${venue.name}, ${event.city}`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.55]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(115%_85%_at_50%_16%,rgb(var(--site-beam)/0.22),transparent_62%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-shell/55 via-shell/25 to-paper"
        />
      </div>

      <div className="surface-light flex-1 border-t border-line bg-mist">
        <Container className="py-16 md:py-20">
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
            {venue.name}
          </h1>

          <p className="mt-5 flex items-start gap-2.5 text-[0.95rem] leading-[1.6] text-subtle">
            <Icon name="pin" className="mt-0.5 size-4 shrink-0 text-navy" />
            <span>{venue.addressLines.join(", ")}</span>
          </p>

          <p className="mt-8 text-[1rem] leading-[1.8]">
            {event.shortName} {event.edition} takes place here on {event.dates}.{" "}
            {event.format}.
          </p>

          <div className="relative mt-12 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-mist md:aspect-[21/9]">
            <iframe
              title={`Map showing ${venue.name}, ${event.city}`}
              src={`https://maps.google.com/maps?q=${pin}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 size-full border-0"
            />
          </div>
        </Container>
      </div>
    </>
  );
}
