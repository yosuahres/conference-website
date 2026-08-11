import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import {
  reviews,
  submissionAuthors,
  submissionFiles,
  submissions,
  tracks,
  users,
} from "@/server/db/schema";

export async function getMySubmissions(userId: string, conferenceId: number) {
  return db
    .select({
      submission: submissions,
      track: tracks,
    })
    .from(submissions)
    .leftJoin(tracks, eq(submissions.trackId, tracks.id))
    .where(
      and(
        eq(submissions.submitterId, userId),
        eq(submissions.conferenceId, conferenceId),
      ),
    )
    .orderBy(desc(submissions.updatedAt));
}

/**
 * Loads a submission with everything a detail page needs. Pass `submitterId` to
 * scope the lookup to one author — an admin page omits it.
 */
export async function getSubmissionDetail(
  submissionId: number,
  submitterId?: string,
) {
  const conditions = [eq(submissions.id, submissionId)];
  if (submitterId) conditions.push(eq(submissions.submitterId, submitterId));

  const [row] = await db
    .select({
      submission: submissions,
      track: tracks,
      submitter: users,
    })
    .from(submissions)
    .leftJoin(tracks, eq(submissions.trackId, tracks.id))
    .innerJoin(users, eq(submissions.submitterId, users.id))
    .where(and(...conditions))
    .limit(1);

  if (!row) return null;

  const [authors, files, reviewRows] = await Promise.all([
    db
      .select()
      .from(submissionAuthors)
      .where(eq(submissionAuthors.submissionId, submissionId))
      .orderBy(asc(submissionAuthors.sortOrder)),
    db
      .select()
      .from(submissionFiles)
      .where(eq(submissionFiles.submissionId, submissionId))
      .orderBy(desc(submissionFiles.uploadedAt)),
    db
      .select({ review: reviews, reviewer: users })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.submissionId, submissionId)),
  ]);

  return { ...row, authors, files, reviews: reviewRows };
}

/** Latest file of each kind — earlier versions stay in the table but are hidden. */
export function pickLatestFiles(
  files: Array<{ kind: string; version: number; id: number }>,
) {
  const latest = new Map<string, (typeof files)[number]>();
  for (const file of files) {
    const current = latest.get(file.kind);
    if (!current || file.version > current.version) latest.set(file.kind, file);
  }
  return latest;
}

export async function getNextFileVersion(submissionId: number, kind: string) {
  const rows = await db
    .select({ version: submissionFiles.version })
    .from(submissionFiles)
    .where(
      and(
        eq(submissionFiles.submissionId, submissionId),
        eq(submissionFiles.kind, kind as never),
      ),
    );
  return rows.reduce((max, row) => Math.max(max, row.version), 0) + 1;
}

/** Admin list, optionally narrowed to a set of statuses. */
export async function listSubmissions(
  conferenceId: number,
  statuses?: (typeof submissions.status.enumValues)[number][],
) {
  const conditions = [eq(submissions.conferenceId, conferenceId)];
  if (statuses?.length) conditions.push(inArray(submissions.status, statuses));

  return db
    .select({
      submission: submissions,
      track: tracks,
      submitter: users,
    })
    .from(submissions)
    .leftJoin(tracks, eq(submissions.trackId, tracks.id))
    .innerJoin(users, eq(submissions.submitterId, users.id))
    .where(and(...conditions))
    .orderBy(desc(submissions.submittedAt), desc(submissions.createdAt));
}

/** Accepted papers the given user may register against. */
export async function getRegisterableSubmissions(
  userId: string,
  conferenceId: number,
) {
  return db
    .select({
      id: submissions.id,
      reference: submissions.reference,
      title: submissions.title,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.submitterId, userId),
        eq(submissions.conferenceId, conferenceId),
        inArray(submissions.status, ["accepted", "camera_ready_submitted"]),
      ),
    )
    .orderBy(asc(submissions.reference));
}
