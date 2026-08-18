import Link from "next/link";
import { notFound } from "next/navigation";

import type { SubmissionFile } from "@shared/types";
import { Button } from "@shared/ui/components/ui/button";
import { SubmissionStatusBadge } from "@/components/status-badge";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";
import { ApiError, api } from "@/lib/api";
import {
  forwardedCookies,
  getActiveConference,
  requireUser,
} from "@/lib/server-api";
import { isEditableByAuthor } from "@/lib/submission-status";
import { FileUpload } from "./file-upload";
import { SubmissionActions } from "./submission-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

function pickLatest(files: SubmissionFile[]) {
  const latest = new Map<string, SubmissionFile>();
  for (const file of files) {
    const current = latest.get(file.kind);
    if (!current || file.version > current.version) latest.set(file.kind, file);
  }
  return latest;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  await requireUser();
  const conference = await getActiveConference();
  const { id } = await params;

  const detail = await api.submissions
    .get(Number(id), await forwardedCookies())
    .catch((cause) => {
      if (cause instanceof ApiError && cause.status === 404) return null;
      throw cause;
    });
  if (!detail || !conference) notFound();

  const { submission, track, authors, files, reviews } = detail;
  const latest = pickLatest(files);
  const editable = isEditableByAuthor(submission.status);
  const accepted =
    submission.status === "accepted" ||
    submission.status === "camera_ready_submitted";

  const visibleReviews = submission.decidedAt
    ? reviews.filter((review) => review.commentsToAuthor)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {submission.reference}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {submission.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {track ? `${track.name} · ` : ""}
            {submission.type.replace("_", " ")}
            {submission.submittedAt
              ? ` · submitted ${formatDate(submission.submittedAt, conference.timezone)}`
              : ""}
          </p>
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </div>

      {submission.status === "revision_requested" ? (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-950/40">
          <p className="text-sm font-medium">Revisions requested</p>
          {submission.decisionNote ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {submission.decisionNote}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            Edit the paper, upload a revised manuscript, then submit again.
          </p>
        </div>
      ) : null}

      {accepted ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-medium">Accepted for presentation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload the camera-ready version
            {conference.cameraReadyDeadline
              ? ` by ${formatDate(conference.cameraReadyDeadline, conference.timezone)}`
              : ""}{" "}
            and complete your presenter registration.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/dashboard/register">Register as presenter</Link>
            </Button>
            <FileUpload
              submissionId={submission.id}
              kind="camera_ready"
              label="camera-ready"
            />
          </div>
        </div>
      ) : null}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Abstract</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
          {submission.abstract}
        </p>
        {submission.keywords.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {submission.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-muted px-3 py-1 text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Authors</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {authors.map((author) => (
            <li key={author.id} className="flex flex-wrap gap-x-2">
              <span className="font-medium">{author.name}</span>
              <span className="text-muted-foreground">{author.email}</span>
              {author.affiliation ? (
                <span className="text-muted-foreground">
                  · {author.affiliation}
                </span>
              ) : null}
              {author.isCorresponding ? (
                <span className="text-xs text-muted-foreground">
                  (corresponding)
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Files</h2>
          {editable ? (
            <FileUpload
              submissionId={submission.id}
              kind="manuscript"
              label="manuscript"
            />
          ) : null}
        </div>

        {files.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No files uploaded yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {[...latest.values()].map((file) => (
              <li key={file.id} className="py-3">
                <p className="truncate text-sm font-medium">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {file.kind.replace("_", " ")} · v{file.version} ·{" "}
                  {formatBytes(file.sizeBytes)} ·{" "}
                  {formatDateTime(file.uploadedAt, conference.timezone)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {visibleReviews.length > 0 ? (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Reviewer comments</h2>
          <ol className="mt-4 space-y-4">
            {visibleReviews.map((review, index) => (
              <li key={review.id} className="rounded-md border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Reviewer {index + 1}
                  {review.score ? ` · score ${review.score}/5` : ""}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {review.commentsToAuthor}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {editable ? (
          <Button asChild variant="outline">
            <Link href={`/dashboard/submissions/${submission.id}/edit`}>
              Edit details
            </Link>
          </Button>
        ) : null}
        <SubmissionActions
          submissionId={submission.id}
          canSubmit={editable}
          canWithdraw={
            submission.status !== "withdrawn" &&
            submission.status !== "rejected"
          }
          hasManuscript={latest.has("manuscript")}
        />
      </div>
    </div>
  );
}
