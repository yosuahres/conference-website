import {
  event,
  invitedSpeakers,
  organizers,
  plenarySpeakers,
  speakers,
  supporters,
  tracks,
  venue,
} from "@/content/site";
import { absoluteUrl, siteDescription, siteName } from "@/lib/seo";

const ALL_SPEAKERS = [...plenarySpeakers, ...speakers, ...invitedSpeakers];

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Values come from our own content module today, but JSON.stringify does
      // not escape `<`, so a literal `</script>` in any future speaker bio or
      // track title would close the block early and turn the remainder into
      // live markup. Escaping the three characters that can break out costs
      // nothing and removes the footgun.
      dangerouslySetInnerHTML={{ __html: toJsonLd(data) }}
    />
  );
}

function toJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/**
 * schema.org markup for the seminar itself. Rendered on the homepage only, so
 * the event resolves to a single canonical entity.
 */
export function EventJsonLd() {
  const place = {
    "@type": "Place",
    name: venue.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.street,
      addressLocality: event.city,
      addressRegion: event.region,
      postalCode: venue.postalCode,
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: venue.coords.lat,
      longitude: venue.coords.lng,
    },
  };

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: absoluteUrl("/"),
        name: siteName,
        alternateName: event.fullName,
        description: siteDescription,
        inLanguage: "en",
      },
      {
        "@type": "Event",
        "@id": absoluteUrl("/#event"),
        name: `${siteName}: ${event.theme}`,
        alternateName: event.fullName,
        description: siteDescription,
        url: absoluteUrl("/"),
        startDate: event.startsAt,
        endDate: event.endsAt,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
        image: [absoluteUrl("/photos/gedung.png")],
        inLanguage: "en",
        isAccessibleForFree: false,
        keywords: tracks.map((track) => track.title).join(", "),
        about: event.theme,
        location: [
          place,
          { "@type": "VirtualLocation", url: absoluteUrl("/") },
        ],
        organizer: organizers.map((org) => ({
          "@type": "Organization",
          name: org.name,
          logo: absoluteUrl(org.logo),
        })),
        sponsor: supporters.map((org) => ({
          "@type": "Organization",
          name: org.name,
          logo: absoluteUrl(org.logo),
        })),
        performer: ALL_SPEAKERS.map((person) => ({
          "@type": "Person",
          name: person.name,
          affiliation: {
            "@type": "Organization",
            name: person.institution,
          },
          image: absoluteUrl(person.photo),
          url: absoluteUrl(`/speakers#${person.slug}`),
        })),
      },
    ],
  };

  return <JsonLd data={data} />;
}
