import { notFound } from "next/navigation";

import { SubmissionStatusBadge } from "@/components/status-badge";
import { formatBytes, formatDateTime } from "@/lib/format";
import { ApiError, api } from "@/lib/api";
import {
  forwardedCookies,
  getActiveConference,
  requireRole,
} from "@/lib/server-api";
import { DecisionForm } from "./decision-form";
import { DownloadButton } from "./download-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSubmissionPage({ params }: PageProps) {
  const user = await requireRole("admin", "reviewer");
  const conference = await getActiveConference();
  const { id } = await params;

  const detail = await api.submissions
    .get(Number(id), await forwardedCookies())
    .catch((cause) => {
      if (cause instanceof ApiError && cause.status === 404) return null;
      throw cause;
    });
  if (!detail || !conference) notFound();

  const { submission, track, submitter, authors, files, reviews } = detail;
  const isAdmin = user.role === "admin";

  const decidable = [
    "submitted",
    "under_review",
    "revision_requested",
  ].includes(submission.status);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">
            {submission.reference}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {submission.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {submitter.name} · {submitter.email}
            {track ? ` · ${track.name}` : ""}
          </p>
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Abstract</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
          {submission.abstract}
        </p>
        {submission.keywords.length > 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Keywords: {submission.keywords.join(", ")}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Authors</h2>
        <ol className="mt-3 space-y-1.5 text-sm">
          {authors.map((author) => (
            <li key={author.id}>
              <span className="font-medium">{author.name}</span>{" "}
              <span className="text-muted-foreground">
                {author.email}
                {author.affiliation ? ` · ${author.affiliation}` : ""}
                {author.isCorresponding ? " · corresponding" : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Files</h2>
        {files.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No files uploaded.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.kind.replace("_", " ")} · v{file.version} ·{" "}
                    {formatBytes(file.sizeBytes)} ·{" "}
                    {formatDateTime(file.uploadedAt, conference.timezone)}
                  </p>
                </div>
                <DownloadButton fileId={file.id} label="Download" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No reviewers assigned yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{review.reviewer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.submittedAt
                      ? `${review.recommendation?.replace("_", " ")} · ${review.score}/5`
                      : "Pending"}
                  </p>
                </div>
                {review.commentsToAuthor ? (
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      To author
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {review.commentsToAuthor}
                    </p>
                  </div>
                ) : null}
                {isAdmin && review.commentsToChair ? (
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Confidential to chair
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {review.commentsToChair}
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && decidable ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Decision</h2>
          <div className="mt-4">
            <DecisionForm submissionId={submission.id} />
          </div>
        </section>
      ) : null}

      {submission.decidedAt ? (
        <p className="text-xs text-muted-foreground">
          Decision recorded{" "}
          {formatDateTime(submission.decidedAt, conference.timezone)}.
        </p>
      ) : null}
    </div>
  );
}
