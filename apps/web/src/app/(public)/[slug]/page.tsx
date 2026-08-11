import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiError, api } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadPage(slug: string) {
  try {
    return await api.conference.page(slug);
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404) return null;
    throw cause;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  return { title: page?.title };
}

/** Catch-all for committee-authored content: About, Venue, Guidelines, … */
export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await loadPage(slug);
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
