import type { Metadata } from "next";

import { event } from "@/content/site";

/**
 * Canonical origin for the deployed site. NEXT_PUBLIC_APP_URL wins so local and
 * preview builds emit their own URLs; the real domain is the fallback for when
 * the variable is missing in production.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || event.website)
  .trim()
  .replace(/\/+$/, "");

export const siteName = `${event.shortName} ${event.edition}`;

/** Browser tab and homepage title: the short name on its own. */
export const siteTitle = siteName;

/** Social cards have room for the expansion the tab title leaves out. */
export const siteSocialTitle = `${siteName} · ${event.fullName}`;

export const siteDescription = `The 6th ${event.fullName} (${siteName}): ${event.theme}. ${event.dates} at ${event.venue}, ${event.region}, ${event.country}.`;

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMeta = {
  /** Slots into the `%s · ISPhOA 2026` template from the root layout. */
  title: string;
  description: string;
  /** Root-relative, resolved against metadataBase. */
  path: string;
};

/**
 * Title, description, canonical and social cards for one public page.
 *
 * Next merges metadata shallowly, so a page that sets `openGraph` replaces the
 * root layout's copy wholesale. Everything the card needs is repeated here;
 * only the image comes from the file-based `opengraph-image`.
 */
export function pageMetadata({ title, description, path }: PageMeta): Metadata {
  const socialTitle = `${title} · ${siteName}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName,
      locale: "en_US",
      title: socialTitle,
      description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}
