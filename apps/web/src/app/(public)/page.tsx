import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { About } from "@/components/site/sections/about";
import { Hero } from "@/components/site/sections/hero";
import { Speakers } from "@/components/site/sections/speakers";
import { Tracks } from "@/components/site/sections/tracks";
import { EventJsonLd } from "@/components/site/structured-data";

// Title, description and social cards are inherited from the root layout; the
// homepage only needs to claim the canonical root URL.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <EventJsonLd />
      <Hero />
      <About />
      <Tracks />
      <Speakers />
      <SiteFooter />
    </>
  );
}
