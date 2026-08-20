import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

// The route list is a constant, so this is already computed once per build.
// Saying so explicitly is what lets `output: "export"` emit it as a file.
export const dynamic = "force-static";

/**
 * Every publicly indexable route. Anything behind sign-in stays out, and is
 * blocked again in robots.ts.
 */
const ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/call-for-papers", changeFrequency: "weekly", priority: 0.9 },
  { path: "/submission", changeFrequency: "weekly", priority: 0.9 },
  { path: "/important-dates", changeFrequency: "weekly", priority: 0.8 },
  { path: "/speakers", changeFrequency: "monthly", priority: 0.8 },
  { path: "/committee", changeFrequency: "monthly", priority: 0.7 },
  { path: "/venue", changeFrequency: "monthly", priority: 0.6 },
] as const satisfies readonly {
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
}[];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
