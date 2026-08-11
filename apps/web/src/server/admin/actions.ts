"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import {
  attempt,
  fail,
  fieldErrorsOf,
  ok,
  type ActionResult,
} from "@/lib/action-result";
import { formatDate } from "@/lib/format";
import { decisionSchema, reviewSchema } from "@/lib/validation/submission";
import { requireAdmin, requireReviewer } from "@/server/auth/session";
import { requireActiveConference } from "@/server/conference/queries";
import { db } from "@/server/db";
import { reviews, submissions, users } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { env } from "@/server/env";
import { assertTransition } from "@/server/submissions/state";
import { createDownloadUrl } from "@/server/storage";
import { submissionFiles } from "@/server/db/schema";

/** Puts a paper in front of a reviewer and moves it into `under_review`. */
export async function assignReviewer(
  submissionId: number,
  reviewerId: string,
  dueAt?: Date,
): Promise<ActionResult<void>> {
  return attempt(async () => {
    await requireAdmin();

    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);
    if (!submission) return fail("Submission not found.");

    const [reviewer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, reviewerId))
      .limit(1);
    if (!reviewer) return fail("Reviewer not found.");

    await db
      .insert(reviews)
      .values({ submissionId, reviewerId, dueAt })
      .onConflictDoNothing();

    if (submission.status === "submitted") {
      await db
        .update(submissions)
        .set({ status: "under_review", updatedAt: new Date() })
        .where(eq(submissions.id, submissionId));
    }

    revalidatePath(`/admin/submissions/${submissionId}`);
    return ok();
  });
}

export async function saveReview(input: unknown): Promise<ActionResult<void>> {
  return attempt(async () => {
    const reviewer = await requireReviewer();

    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Please complete the review form.",
        fieldErrorsOf(parsed.error),
      );
    }
    const data = parsed.data;

    const [assignment] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.submissionId, data.submissionId),
          eq(reviews.reviewerId, reviewer.id),
        ),
      )
      .limit(1);

    if (!assignment) return fail("You are not assigned to this submission.");

    await db
      .update(reviews)
      .set({
        score: data.score,
        recommendation: data.recommendation,
        commentsToAuthor: data.commentsToAuthor,
        commentsToChair: data.commentsToChair || null,
        submittedAt: new Date(),
      })
      .where(eq(reviews.id, assignment.id));

    revalidatePath("/admin/reviews");
    return ok();
  });
}

/**
 * Records the committee's decision and notifies the author. The email is the
 * point of this action — the status change alone tells nobody anything.
 */
export async function recordDecision(
  input: unknown,
): Promise<ActionResult<void>> {
  return attempt(async () => {
    await requireAdmin();
    const conference = await requireActiveConference();

    const parsed = decisionSchema.safeParse(input);
    if (!parsed.success) return fail("Invalid decision.");
    const data = parsed.data;

    const [row] = await db
      .select({ submission: submissions, submitter: users })
      .from(submissions)
      .innerJoin(users, eq(submissions.submitterId, users.id))
      .where(eq(submissions.id, data.submissionId))
      .limit(1);

    if (!row) return fail("Submission not found.");
    assertTransition(row.submission.status, data.decision);

    await db
      .update(submissions)
      .set({
        status: data.decision,
        decidedAt: new Date(),
        decisionNote: data.note || null,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, data.submissionId));

    const comments = data.shareReviewerComments
      ? (
          await db
            .select({ text: reviews.commentsToAuthor })
            .from(reviews)
            .where(eq(reviews.submissionId, data.submissionId))
        )
          .map((review) => review.text)
          .filter((text): text is string => Boolean(text))
      : [];

    await sendEmail({
      to: row.submitter.email,
      subject:
        data.decision === "accepted"
          ? `Accepted — ${row.submission.reference}`
          : `Decision on ${row.submission.reference}`,
      template: "submission-decision",
      props: {
        conferenceName: conference.name,
        authorName: row.submitter.name,
        reference: row.submission.reference,
        title: row.submission.title,
        decision: data.decision,
        decisionNote: data.note || null,
        reviewerComments: comments,
        cameraReadyDeadline: conference.cameraReadyDeadline
          ? formatDate(conference.cameraReadyDeadline, conference.timezone)
          : null,
        actionUrl:
          data.decision === "accepted"
            ? `${env.NEXT_PUBLIC_APP_URL}/register`
            : `${env.NEXT_PUBLIC_APP_URL}/dashboard/submissions/${data.submissionId}`,
      },
      relatedType: "submission",
      relatedId: data.submissionId,
    });

    revalidatePath("/admin/submissions");
    return ok();
  });
}

/**
 * Signs a short-lived download link. Manuscripts are private in the bucket, so
 * this is the only way a reviewer or chair can open one.
 */
export async function getFileDownloadUrl(
  fileId: number,
): Promise<ActionResult<{ url: string }>> {
  return attempt(async () => {
    await requireReviewer();

    const [file] = await db
      .select()
      .from(submissionFiles)
      .where(eq(submissionFiles.id, fileId))
      .limit(1);

    if (!file) return fail("File not found.");

    const url = await createDownloadUrl({
      key: file.storageKey,
      fileName: file.fileName,
    });
    return ok({ url });
  });
}

export async function setUserRole(
  userId: string,
  role: "attendee" | "reviewer" | "admin",
): Promise<ActionResult<void>> {
  return attempt(async () => {
    const admin = await requireAdmin();
    if (admin.id === userId && role !== "admin") {
      return fail("You cannot remove your own admin role.");
    }

    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/admin/people");
    return ok();
  });
}
