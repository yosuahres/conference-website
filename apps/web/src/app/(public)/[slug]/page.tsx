import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { renderMarkdown } from "@/lib/markdown";
import { getActiveConference, getPage } from "@/server/conference/queries";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const conference = await getActiveConference();
  if (!conference) return {};
  const { slug } = await params;
  const page = await getPage(conference.id, slug);
  return { title: page?.title };
}

/** Catch-all for committee-authored content: About, Venue, Guidelines, … */
export default async function CmsPage({ params }: PageProps) {
  const conference = await getActiveConference();
  if (!conference) notFound();

  const { slug } = await params;
  const page = await getPage(conference.id, slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
      <div
        className="prose-conference mt-8"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
      />
    </article>
  );
}
