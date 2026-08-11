"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import {
  attempt,
  fail,
  fieldErrorsOf,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  submissionDraftSchema,
  uploadRequestSchema,
} from "@/lib/validation/submission";
import { requireUser } from "@/server/auth/session";
import {
  isSubmissionOpen,
  requireActiveConference,
} from "@/server/conference/queries";
import { db } from "@/server/db";
import {
  submissionAuthors,
  submissionFiles,
  submissions,
  tracks,
} from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { env } from "@/server/env";
import {
  ALLOWED_MANUSCRIPT_TYPES,
  MAX_MANUSCRIPT_BYTES,
  buildSubmissionFileKey,
  createUploadUrl,
} from "@/server/storage";
import { getNextFileVersion } from "./queries";
import { assertTransition, isEditableByAuthor } from "./state";

function buildReference(conferenceSlug: string, id: number) {
  const prefix = conferenceSlug
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 6);
  return `${prefix || "SUB"}-${String(id).padStart(4, "0")}`;
}

/**
 * Creates or updates a draft. Editing is refused once the committee owns the
 * paper — the author gets it back only via `revision_requested`.
 */
export async function saveSubmissionDraft(
  input: unknown,
  submissionId?: number,
): Promise<ActionResult<{ id: number }>> {
  return attempt(async () => {
    const user = await requireUser();
    const conference = await requireActiveConference();

    const parsed = submissionDraftSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Please correct the highlighted fields.",
        fieldErrorsOf(parsed.error),
      );
    }
    const data = parsed.data;

    if (!isSubmissionOpen(conference)) {
      return fail("Submissions are closed for this conference.");
    }

    if (data.trackId !== null) {
      const [track] = await db
        .select({ id: tracks.id })
        .from(tracks)
        .where(
          and(
            eq(tracks.id, data.trackId),
            eq(tracks.conferenceId, conference.id),
          ),
        )
        .limit(1);
      if (!track) return fail("That track does not belong to this conference.");
    }

    const id = await db.transaction(async (tx) => {
      let targetId = submissionId;

      if (targetId) {
        const [existing] = await tx
          .select()
          .from(submissions)
          .where(
            and(
              eq(submissions.id, targetId),
              eq(submissions.submitterId, user.id),
            ),
          )
          .limit(1);

        if (!existing) throw new Error("Submission not found.");
        if (!isEditableByAuthor(existing.status)) {
          throw new Error(
            "This submission is with the committee and can no longer be edited.",
          );
        }

        await tx
          .update(submissions)
          .set({
            title: data.title,
            abstract: data.abstract,
            keywords: data.keywords,
            type: data.type,
            trackId: data.trackId,
            updatedAt: new Date(),
          })
          .where(eq(submissions.id, targetId));
      } else {
        // The reference is derived from the row id, so insert with a throwaway
        // unique value first and rewrite it once the id exists.
        const [created] = await tx
          .insert(submissions)
          .values({
            conferenceId: conference.id,
            submitterId: user.id,
            trackId: data.trackId,
            reference: `tmp-${randomUUID()}`,
            title: data.title,
            abstract: data.abstract,
            keywords: data.keywords,
            type: data.type,
            status: "draft",
          })
          .returning({ id: submissions.id });

        targetId = created!.id;
        await tx
          .update(submissions)
          .set({ reference: buildReference(conference.slug, targetId) })
          .where(eq(submissions.id, targetId));
      }

      // Authors are replaced wholesale — the form always posts the full list.
      await tx
        .delete(submissionAuthors)
        .where(eq(submissionAuthors.submissionId, targetId));

      await tx.insert(submissionAuthors).values(
        data.authors.map((author, index) => ({
          submissionId: targetId!,
          name: author.name,
          email: author.email.toLowerCase(),
          affiliation: author.affiliation || null,
          country: author.country || null,
          isCorresponding: author.isCorresponding ? 1 : 0,
          sortOrder: index,
        })),
      );

      return targetId;
    });

    revalidatePath("/dashboard/submissions");
    return ok({ id });
  });
}

/**
 * Hands the browser a presigned PUT. The row in `submission_files` is written
 * by `confirmUpload` after the transfer succeeds, so an abandoned upload leaves
 * an orphaned object rather than a broken database row.
 */
export async function requestUploadUrl(
  input: unknown,
): Promise<
  ActionResult<{ uploadUrl: string; storageKey: string; version: number }>
> {
  return attempt(async () => {
    const user = await requireUser();
    const conference = await requireActiveConference();

    const parsed = uploadRequestSchema.safeParse(input);
    if (!parsed.success) return fail("Invalid upload request.");
    const { submissionId, kind, fileName, contentType, sizeBytes } =
      parsed.data;

    if (!ALLOWED_MANUSCRIPT_TYPES.includes(contentType as never)) {
      return fail("Only PDF and Word documents are accepted.");
    }
    if (sizeBytes > MAX_MANUSCRIPT_BYTES) {
      return fail("Files must be 25 MB or smaller.");
    }

    const [submission] = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.id, submissionId),
          eq(submissions.submitterId, user.id),
        ),
      )
      .limit(1);

    if (!submission) return fail("Submission not found.");

    const authorOwnsIt =
      kind === "camera_ready"
        ? submission.status === "accepted" ||
          submission.status === "camera_ready_submitted"
        : isEditableByAuthor(submission.status);

    if (!authorOwnsIt) {
      return fail("Uploads are not open for this submission right now.");
    }

    const version = await getNextFileVersion(submissionId, kind);
    const storageKey = buildSubmissionFileKey({
      conferenceSlug: conference.slug,
      submissionId,
      kind,
      version,
      fileName,
    });

    const uploadUrl = await createUploadUrl({ key: storageKey, contentType });
    return ok({ uploadUrl, storageKey, version });
  });
}

export async function confirmUpload(input: {
  submissionId: number;
  kind: "manuscript" | "camera_ready" | "supplementary" | "copyright_form";
  storageKey: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  version: number;
}): Promise<ActionResult<void>> {
  return attempt(async () => {
    const user = await requireUser();

    const [submission] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.id, input.submissionId),
          eq(submissions.submitterId, user.id),
        ),
      )
      .limit(1);

    if (!submission) return fail("Submission not found.");

    await db.insert(submissionFiles).values({
      submissionId: input.submissionId,
      kind: input.kind,
      storageKey: input.storageKey,
      fileName: input.fileName,
      mimeType: input.contentType,
      sizeBytes: input.sizeBytes,
      version: input.version,
    });

    // Uploading the camera-ready is what completes an accepted paper.
    if (input.kind === "camera_ready") {
      await db
        .update(submissions)
        .set({ status: "camera_ready_submitted", updatedAt: new Date() })
        .where(eq(submissions.id, input.submissionId));
    }

    revalidatePath(`/dashboard/submissions/${input.submissionId}`);
    return ok();
  });
}

/** Draft → submitted. Requires a manuscript to be on file. */
export async function submitForReview(
  submissionId: number,
): Promise<ActionResult<void>> {
  return attempt(async () => {
    const user = await requireUser();
    const conference = await requireActiveConference();

    if (!isSubmissionOpen(conference)) {
      return fail("The submission deadline has passed.");
    }

    const [submission] = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.id, submissionId),
          eq(submissions.submitterId, user.id),
        ),
      )
      .limit(1);

    if (!submission) return fail("Submission not found.");
    assertTransition(submission.status, "submitted");

    const [manuscript] = await db
      .select({ id: submissionFiles.id })
      .from(submissionFiles)
      .where(
        and(
          eq(submissionFiles.submissionId, submissionId),
          eq(submissionFiles.kind, "manuscript"),
        ),
      )
      .limit(1);

    if (!manuscript) {
      return fail("Upload your manuscript before submitting.");
    }

    const now = new Date();
    await db
      .update(submissions)
      .set({
        status: "submitted",
        // Set only on the first submission; a resubmitted revision keeps the
        // original timestamp for deadline purposes.
        submittedAt: submission.submittedAt ?? now,
        updatedAt: now,
      })
      .where(eq(submissions.id, submissionId));

    const [track] = submission.trackId
      ? await db
          .select({ name: tracks.name })
          .from(tracks)
          .where(eq(tracks.id, submission.trackId))
          .limit(1)
      : [];

    await sendEmail({
      to: user.email,
      subject: `Submission received — ${submission.reference}`,
      template: "submission-received",
      props: {
        conferenceName: conference.name,
        authorName: user.name,
        reference: submission.reference,
        title: submission.title,
        track: track?.name ?? null,
        submittedAt: formatDateTime(now, conference.timezone),
        notificationDate: conference.notificationDate
          ? formatDate(conference.notificationDate, conference.timezone)
          : null,
        dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/submissions/${submissionId}`,
      },
      relatedType: "submission",
      relatedId: submissionId,
    });

    revalidatePath("/dashboard/submissions");
    revalidatePath(`/dashboard/submissions/${submissionId}`);
    return ok();
  });
}

export async function withdrawSubmission(
  submissionId: number,
): Promise<ActionResult<void>> {
  return attempt(async () => {
    const user = await requireUser();

    const [submission] = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.id, submissionId),
          eq(submissions.submitterId, user.id),
        ),
      )
      .limit(1);

    if (!submission) return fail("Submission not found.");
    assertTransition(submission.status, "withdrawn");

    await db
      .update(submissions)
      .set({ status: "withdrawn", updatedAt: new Date() })
      .where(eq(submissions.id, submissionId));

    revalidatePath("/dashboard/submissions");
    return ok();
  });
}
