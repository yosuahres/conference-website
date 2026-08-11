import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@shared/ui/components/ui/button";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import {
  getActiveConference,
  getPage,
  getTracks,
  isSubmissionOpen,
} from "@/server/conference/queries";

export const metadata = { title: "Call for Papers" };

export default async function CallForPapersPage() {
  const conference = await getActiveConference();
  if (!conference) notFound();

  const [tracks, page] = await Promise.all([
    getTracks(conference.id),
    // Long-form author guidelines are editable content; the dates and track list
    // below come from the database so they can never drift out of sync.
    getPage(conference.id, "call-for-papers"),
  ]);

  const open = isSubmissionOpen(conference);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Call for Papers</h1>

      <div className="mt-8 rounded-lg border bg-card p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            ["Submissions open", conference.submissionOpensAt],
            ["Submission deadline", conference.submissionDeadline],
            ["Notification", conference.notificationDate],
            ["Camera-ready", conference.cameraReadyDeadline],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label as string}
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {formatDate(value as Date, conference.timezone)}
                </dd>
              </div>
            ))}
        </dl>

        <div className="mt-6 border-t pt-6">
          <Button asChild disabled={!open}>
            <Link href="/dashboard/submissions/new">
              {open ? "Start a submission" : "Submissions are closed"}
            </Link>
          </Button>
        </div>
      </div>

      {tracks.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Topics of interest</h2>
          <ul className="mt-4 space-y-3">
            {tracks.map((track) => (
              <li key={track.id} className="rounded-md border bg-card p-4">
                <p className="text-sm font-medium">{track.name}</p>
                {track.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {track.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {page ? (
        <div
          className="prose-conference mt-12"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
        />
      ) : null}
    </div>
  );
}
