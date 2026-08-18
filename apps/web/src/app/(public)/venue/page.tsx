import Image from "next/image";

import { Icon } from "@/components/site/icon";
import { Container } from "@/components/site/ui";
import { event, venue } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Venue",
  description: `${event.shortName} ${event.edition} is held at ${venue.name}, ${event.city}, ${event.region}, ${event.country}, ${event.dates}. Address, map and travel notes from Minangkabau International Airport.`,
  path: "/venue",
});

const mapQuery = encodeURIComponent(venue.mapQuery);
const centre = `${venue.coords.lat},${venue.coords.lng}`;

export default function VenuePage() {
  return (
    <div className="surface-light">
      <div className="relative h-[46vh] min-h-[280px] w-full bg-paper md:h-[62vh]">
        <Image
          src="/photos/gedung.png"
          alt={`${venue.name}, ${event.city}`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
      </div>

      <Container className="py-16 md:py-20">
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
          {venue.name}
        </h1>

        <p className="mt-5 flex items-start gap-2.5 text-[0.95rem] leading-[1.6] text-beam">
          <Icon name="pin" className="mt-0.5 size-4 shrink-0" />
          <span>{venue.addressLines.join(", ")}</span>
        </p>

        <div className="mt-8">
          <p className="text-[1rem] leading-[1.8]">
            {venue.name} ({venue.campus}) hosts {event.shortName}{" "}
            {event.edition} on {event.dates}. {event.format}.
          </p>
          {venue.travel.map((line) => (
            <p
              key={line}
              className="mt-5 text-[1rem] leading-[1.8] text-subtle"
            >
              {line}
            </p>
          ))}
        </div>

        <div className="relative mt-12 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-mist md:aspect-[21/9]">
          <iframe
            title={`Map showing ${venue.name}, ${event.city}`}
            src={`https://maps.google.com/maps?q=${mapQuery}&ll=${centre}&z=16&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full border-0"
          />
        </div>
      </Container>
    </div>
  );
}
