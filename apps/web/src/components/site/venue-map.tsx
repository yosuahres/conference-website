import { event, venue } from "@/content/site";
import { Icon } from "./icon";

const query = encodeURIComponent(venue.mapQuery);
const pin = `${venue.coords.lat},${venue.coords.lng}`;

export function VenueMap() {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
      <div>
        <p className="eyebrow">{venue.eyebrow}</p>

        <h3 className="mt-5 font-display text-[clamp(1.35rem,2.6vw,1.85rem)] font-semibold leading-[1.2] tracking-[-0.025em]">
          {venue.name}
        </h3>

        <address className="mt-4 text-[0.9rem] not-italic leading-[1.7] text-subtle">
          {venue.addressLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>

        <p className="mt-5 flex items-center gap-2.5 text-[0.85rem] text-subtle">
          <Icon name="globe" className="size-4 shrink-0 text-navy" />
          {event.format}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${venue.placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[0.85rem] font-medium text-paper transition-colors hover:bg-navy"
          >
            Open in Google Maps
            <Icon name="external" className="size-[15px]" />
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${query}&destination_place_id=${venue.placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-[0.85rem] font-medium transition-colors hover:border-ink"
          >
            Get directions
            <Icon name="arrow" className="size-[15px]" />
          </a>
        </div>
      </div>

      <figure>
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-mist sm:aspect-[16/9]">
          <iframe
            title={`Map showing ${venue.name}, ${event.city}`}
            src={`https://maps.google.com/maps?q=${pin}&z=16&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full border-0"
          />
        </div>
        <figcaption className="mt-3 text-[0.72rem] text-faint">
          {venue.name} · {event.city}, {event.region}
        </figcaption>
      </figure>
    </div>
  );
}
